import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { DELETE as deleteLesson, PATCH as patchLesson } from "@/app/api/admin/aulas/[id]/route";
import { POST as uploadLesson } from "@/app/api/admin/aulas/[id]/upload/route";
import { POST as createLesson } from "@/app/api/admin/cursos/[id]/aulas/route";
import { DELETE as deleteCourse, GET as getCourse, PATCH as patchCourse } from "@/app/api/admin/cursos/[id]/route";
import { GET as listCourses, POST as createCourse } from "@/app/api/admin/cursos/route";
import { GET as videoStatus } from "@/app/api/admin/videos/[guid]/status/route";
import type { AdminCourseRow, AdminCourseStructure, AdminLesson } from "@/lib/academy/types";
import { Course } from "@/models/course";
import { Exam } from "@/models/exam";
import { Lesson } from "@/models/lesson";
import { Question } from "@/models/question";

import { completeLesson, createSampleCourse, createUser, enroll, jsonRequest, params, readJson, signInAs } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const course = (id: string) => getCourse(jsonRequest(`/api/admin/cursos/${id}`), params({ id }));
const patch = (id: string, body: Record<string, unknown>) =>
  patchCourse(jsonRequest(`/api/admin/cursos/${id}`, { method: "PATCH", body }), params({ id }));
const remove = (id: string) => deleteCourse(jsonRequest(`/api/admin/cursos/${id}`, { method: "DELETE" }), params({ id }));
const create = (body: Record<string, unknown>) => createCourse(jsonRequest("/api/admin/cursos", { body }));
const addLesson = (id: string, body: Record<string, unknown>) =>
  createLesson(jsonRequest(`/api/admin/cursos/${id}/aulas`, { body }), params({ id }));
const editLesson = (id: string, body: Record<string, unknown>) =>
  patchLesson(jsonRequest(`/api/admin/aulas/${id}`, { method: "PATCH", body }), params({ id }));
const dropLesson = (id: string) => deleteLesson(jsonRequest(`/api/admin/aulas/${id}`, { method: "DELETE" }), params({ id }));

async function tutorSession() {
  const tutor = await createUser({ role: "tutor" });
  await signInAs(tutor);
  return tutor;
}

async function lessonNumbers(courseId: unknown) {
  const rows = await Lesson.find({ courseId }).sort({ number: 1 }).lean();
  return rows.map((row) => [row.title.pt, row.number]);
}

describe("/api/admin/cursos", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses a student on every verb", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser());
    const id = sample.course._id.toString();

    expect((await listCourses()).status).toBe(403);
    expect((await create({ title: "x" })).status).toBe(403);
    expect((await course(id)).status).toBe(403);
    expect((await patch(id, { order: 2 })).status).toBe(403);
    expect((await remove(id)).status).toBe(403);
  });

  it("creates a course with a unique slug and one default module", async () => {
    await tutorSession();

    const first = await create({ title: { pt: "Água Pura: início" } });
    expect(first.status).toBe(201);
    const second = await create({ title: "Água Pura: início" });
    expect(second.status).toBe(201);
    expect((await create({ title: { es: "sin pt" } })).status).toBe(400);

    const rows = await Course.find().sort({ createdAt: 1 }).lean();
    expect(rows.map((row) => row.slug)).toEqual(["agua-pura-inicio", "agua-pura-inicio-2"]);
    expect(rows[0].published).toBe(false);
    expect(rows[0].modules).toHaveLength(1);
    expect(rows[0].modules[0]).toMatchObject({ number: 1, title: { pt: "Módulo 1" } });
  });

  it("lists every course with lesson counts, enrollments and resolved prerequisites", async () => {
    await tutorSession();
    const opener = await createSampleCourse({ slug: "abridor" });
    const gated = await createSampleCourse({ slug: "seguinte", published: false, prerequisites: [opener.course._id] });
    const user = await createUser();
    await enroll(user._id, opener.course._id);

    const body = await readJson<{ courses: AdminCourseRow[] }>(await listCourses());
    const bySlug = new Map(body.courses.map((row) => [row.slug, row]));
    expect(bySlug.get("abridor")).toMatchObject({ published: true, lessonCount: 4, publishedLessonCount: 3, enrolledCount: 1, prerequisites: [] });
    expect(bySlug.get("seguinte")).toMatchObject({
      id: gated.course._id.toString(),
      published: false,
      enrolledCount: 0,
      prerequisites: [{ id: opener.course._id.toString(), slug: "abridor", title: "Curso de teste" }],
    });
  });

  it("describes the structure with other courses as options and Bunny off", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const other = await createSampleCourse({ slug: "outro" });
    const user = await createUser();
    await enroll(user._id, sample.course._id);

    const response = await course(sample.course._id.toString());
    expect(response.status).toBe(200);
    const body = await readJson<AdminCourseStructure>(response);
    expect(body.course).toMatchObject({ slug: "curso-teste", published: true, prerequisites: [] });
    expect(body.course.modules.map((mod) => mod.number)).toEqual([1, 2]);
    expect(body.lessons.map((lesson) => lesson.number)).toEqual([1, 2, 3, 4]);
    expect(body.lessons[3]).toMatchObject({ published: false, hasProgress: false, video: { provider: "youtube", youtubeId: "" } });
    expect(body.exams.map((exam) => exam.scope)).toEqual(["module", "final"]);
    expect(body.exams[0].questions[2].options.map((option) => option.correct)).toEqual([false, true, false]);
    expect(body.courseOptions).toEqual([{ id: other.course._id.toString(), slug: "outro", title: "Curso de teste" }]);
    expect(body.enrolledCount).toBe(1);
    expect(body.bunny).toEqual({ upload: false, playback: false });
  });

  it("guards prerequisites against self-reference, cycles and starter courses", async () => {
    await tutorSession();
    const a = await createSampleCourse({ slug: "a" });
    const b = await createSampleCourse({ slug: "b" });
    const aId = a.course._id.toString();
    const bId = b.course._id.toString();

    const self = await patch(aId, { prerequisites: [aId] });
    expect(self.status).toBe(400);
    expect((await readJson<ErrorBody>(self)).code).toBe("self_prerequisite");

    const unknown = await patch(aId, { prerequisites: ["000000000000000000000000"] });
    expect((await readJson<ErrorBody>(unknown)).code).toBe("prerequisite_not_found");

    expect((await patch(aId, { prerequisites: [bId] })).status).toBe(200);
    const cycle = await patch(bId, { prerequisites: [aId] });
    expect(cycle.status).toBe(400);
    expect((await readJson<ErrorBody>(cycle)).code).toBe("prerequisite_cycle");

    const starter = await patch(aId, { starter: true });
    expect(starter.status).toBe(400);
    expect((await readJson<ErrorBody>(starter)).code).toBe("starter_has_prerequisites");

    expect((await patch(bId, { starter: true })).status).toBe(200);
    const addPrerequisite = await patch(bId, { prerequisites: ["000000000000000000000001"] });
    expect(addPrerequisite.status).toBe(400);
  });

  it("keeps a single starter per language", async () => {
    await tutorSession();
    const pt1 = await createSampleCourse({ slug: "pt-1", starter: true });
    const pt2 = await createSampleCourse({ slug: "pt-2" });
    const es = await createSampleCourse({ slug: "es-1", language: "es", starter: true });

    const response = await patch(pt2.course._id.toString(), { starter: true });
    expect(response.status).toBe(200);
    expect((await readJson<AdminCourseStructure>(response)).course.starter).toBe(true);
    expect((await Course.findById(pt1.course._id).lean())?.starter).toBe(false);
    expect((await Course.findById(es.course._id).lean())?.starter).toBe(true);
  });

  it("refuses to publish a course without a published lesson", async () => {
    await tutorSession();
    const created = await readJson<{ id: string }>(await create({ title: "Vazio" }));

    const response = await patch(created.id, { published: true });
    expect(response.status).toBe(409);
    expect((await readJson<ErrorBody>(response)).code).toBe("no_published_lessons");
    expect((await Course.findById(created.id).lean())?.published).toBe(false);
  });

  it("stores the simple fields and validates language and order", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const id = sample.course._id.toString();

    const body = await readJson<AdminCourseStructure>(
      await patch(id, { title: { pt: "Novo", es: "Nuevo" }, description: "Desc", coverUrl: " /c.png ", speaker: "Alguém", language: "es", order: 3.4, published: false }),
    );
    expect(body.course).toMatchObject({ title: { pt: "Novo", es: "Nuevo", en: "" }, description: { pt: "Desc" }, coverUrl: "/c.png", speaker: "Alguém", language: "es", order: 3, published: false });

    expect((await patch(id, { title: "" })).status).toBe(400);
    expect((await patch(id, { language: "fr" })).status).toBe(400);
    expect((await patch(id, { order: "x" })).status).toBe(400);
  });

  it("refuses to remove a module that still has lessons and drops the activity of an empty one", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const id = sample.course._id.toString();
    const empty = await Course.findByIdAndUpdate(id, { $push: { modules: { number: 3, title: { pt: "Vazio" } } } }, { new: true }).lean();
    const emptyModuleId = empty!.modules[2]._id;
    const orphan = await Exam.create({ courseId: sample.course._id, scope: "module", moduleId: emptyModuleId, questions: [] });

    const keepOnlyFirst = await patch(id, { modules: [{ id: sample.module1.toString(), number: 1, title: "Módulo 1" }] });
    expect(keepOnlyFirst.status).toBe(409);
    expect((await readJson<ErrorBody>(keepOnlyFirst)).code).toBe("module_has_lessons");

    const dropEmpty = await patch(id, {
      modules: [
        { id: sample.module2.toString(), number: 1, title: "Agora primeiro" },
        { id: sample.module1.toString(), number: 2, title: "Módulo 1" },
      ],
    });
    expect(dropEmpty.status).toBe(200);
    const body = await readJson<AdminCourseStructure>(dropEmpty);
    expect(body.course.modules.map((mod) => [mod.id, mod.number])).toEqual([
      [sample.module2.toString(), 1],
      [sample.module1.toString(), 2],
    ]);
    expect(await Exam.findById(orphan._id).lean()).toBeNull();
    expect(await Exam.findById(sample.moduleExam._id).lean()).not.toBeNull();

    expect((await patch(id, { modules: [] })).status).toBe(400);
    expect((await patch(id, { modules: [{ number: 0, title: "x" }] })).status).toBe(400);
  });

  it("refuses to delete a course with enrollments, otherwise removes it and its references", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const dependent = await createSampleCourse({ slug: "seguinte", prerequisites: [sample.course._id] });
    const user = await createUser();
    const enrollment = await enroll(user._id, sample.course._id);

    const blocked = await remove(sample.course._id.toString());
    expect(blocked.status).toBe(409);
    expect((await readJson<ErrorBody>(blocked)).code).toBe("has_enrollments");

    await enrollment.deleteOne();
    expect((await remove(sample.course._id.toString())).status).toBe(200);
    expect(await Course.findById(sample.course._id).lean()).toBeNull();
    expect(await Lesson.countDocuments({ courseId: sample.course._id })).toBe(0);
    expect(await Exam.countDocuments({ courseId: sample.course._id })).toBe(0);
    expect((await Course.findById(dependent.course._id).lean())?.prerequisites).toEqual([]);
    expect(await Lesson.countDocuments({ courseId: dependent.course._id })).toBe(4);

    expect((await remove(sample.course._id.toString())).status).toBe(404);
  });
});

describe("/api/admin/aulas", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses a student", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser());
    expect((await addLesson(sample.course._id.toString(), { moduleId: sample.module1.toString(), title: "x" })).status).toBe(403);
    expect((await editLesson(sample.lessons[0]._id.toString(), { title: "x" })).status).toBe(403);
    expect((await dropLesson(sample.lessons[0]._id.toString())).status).toBe(403);
  });

  it("numbers new lessons after the last one and needs a real module", async () => {
    await tutorSession();
    const created = await readJson<{ id: string }>(await create({ title: "Novo" }));
    const moduleId = (await Course.findById(created.id).lean())!.modules[0]._id.toString();

    const first = await addLesson(created.id, { moduleId, title: "Primeira" });
    expect(first.status).toBe(201);
    const body = await readJson<{ lesson: AdminLesson }>(first);
    expect(body.lesson).toMatchObject({ number: 1, moduleId, title: { pt: "Primeira" }, published: false, hasProgress: false });

    const second = await readJson<{ lesson: AdminLesson }>(await addLesson(created.id, { moduleId, title: { pt: "Segunda" } }));
    expect(second.lesson.number).toBe(2);

    const badModule = await addLesson(created.id, { moduleId: "000000000000000000000000", title: "x" });
    expect(badModule.status).toBe(400);
    expect((await readJson<ErrorBody>(badModule)).code).toBe("module_not_found");
    expect((await addLesson(created.id, { moduleId, title: "" })).status).toBe(400);
    expect((await addLesson("000000000000000000000000", { moduleId, title: "x" })).status).toBe(404);
  });

  it("validates the YouTube id and refuses to publish without a video", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const draft = sample.lessons[3]._id.toString();

    const bad = await editLesson(draft, { video: { youtubeId: "not a video" } });
    expect(bad.status).toBe(400);
    expect((await readJson<ErrorBody>(bad)).code).toBe("invalid_youtube_id");

    const noVideo = await editLesson(draft, { published: true });
    expect(noVideo.status).toBe(409);
    expect((await readJson<ErrorBody>(noVideo)).code).toBe("no_video");

    const ok = await editLesson(draft, { video: { youtubeId: "https://youtu.be/dQw4w9WgXcQ" }, published: true, durationMinutes: 12.4, materials: [{ label: "PDF", url: "https://x/y.pdf" }, { label: "", url: "x" }] });
    expect(ok.status).toBe(200);
    const body = await readJson<{ lesson: AdminLesson }>(ok);
    expect(body.lesson).toMatchObject({ published: true, durationMinutes: 12, video: { youtubeId: "dQw4w9WgXcQ" }, materials: [{ label: "PDF", url: "https://x/y.pdf" }] });

    expect((await editLesson(draft, { video: { provider: "vimeo" } })).status).toBe(400);
    expect((await editLesson(draft, { moduleId: "000000000000000000000000" })).status).toBe(400);
    expect((await editLesson("000000000000000000000000", { title: "x" })).status).toBe(404);
  });

  it("renumbers the course when a lesson moves", async () => {
    await tutorSession();
    const sample = await createSampleCourse();

    const response = await editLesson(sample.lessons[2]._id.toString(), { number: 1 });
    expect(response.status).toBe(200);
    expect((await readJson<{ lesson: AdminLesson }>(response)).lesson.number).toBe(1);
    expect(await lessonNumbers(sample.course._id)).toEqual([["Aula 3", 1], ["Aula 1", 2], ["Aula 2", 3], ["Rascunho", 4]]);

    expect((await editLesson(sample.lessons[2]._id.toString(), { number: 0 })).status).toBe(400);
  });

  it("refuses to delete a lesson a student touched, otherwise deletes and renumbers", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const user = await createUser();
    await enroll(user._id, sample.course._id);
    await completeLesson(user._id, sample.course._id, sample.lessons[0]._id);
    await Question.create({ userId: user._id, courseId: sample.course._id, lessonId: sample.lessons[2]._id, text: "?" });

    const withProgress = await dropLesson(sample.lessons[0]._id.toString());
    expect(withProgress.status).toBe(409);
    expect((await readJson<ErrorBody>(withProgress)).code).toBe("has_progress");
    expect((await dropLesson(sample.lessons[2]._id.toString())).status).toBe(409);

    const structure = await readJson<AdminCourseStructure>(await course(sample.course._id.toString()));
    expect(structure.lessons.map((lesson) => lesson.hasProgress)).toEqual([true, false, true, false]);

    expect((await dropLesson(sample.lessons[1]._id.toString())).status).toBe(200);
    expect(await lessonNumbers(sample.course._id)).toEqual([["Aula 1", 1], ["Aula 3", 2], ["Rascunho", 3]]);
    expect((await dropLesson(sample.lessons[1]._id.toString())).status).toBe(404);
  });

  it("reports Bunny as not configured for uploads and status checks", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const id = sample.lessons[0]._id.toString();

    const upload = await uploadLesson(jsonRequest(`/api/admin/aulas/${id}/upload`, { method: "POST" }), params({ id }));
    expect(upload.status).toBe(503);
    expect((await readJson<ErrorBody>(upload)).code).toBe("bunny_not_configured");

    const guid = "0f0f0f0f-0000-0000-0000-000000000000";
    const status = await videoStatus(jsonRequest(`/api/admin/videos/${guid}/status`), params({ guid }));
    expect(status.status).toBe(503);
    expect((await readJson<ErrorBody>(status)).code).toBe("bunny_not_configured");

    await signInAs(await createUser());
    expect((await uploadLesson(jsonRequest(`/api/admin/aulas/${id}/upload`, { method: "POST" }), params({ id }))).status).toBe(403);
  });
});
