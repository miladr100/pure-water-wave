import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getCourse } from "@/app/api/academia/cursos/[slug]/route";
import { GET as listCourses } from "@/app/api/academia/cursos/route";
import { POST as enrollRoute } from "@/app/api/academia/inscricao/route";
import type { CourseCard, CourseDetail, CourseLocked } from "@/lib/academy/types";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";

import { createSampleCourse, createUser, enroll, jsonRequest, params, readJson, signInAs } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

async function catalogSlugs() {
  const response = await listCourses();
  expect(response.status).toBe(200);
  const body = await readJson<{ courses: CourseCard[] }>(response);
  return body.courses.map((course) => course.slug);
}

const detail = (slug: string) => getCourse(jsonRequest(`/api/academia/cursos/${slug}`), params({ slug }));
const enrollIn = (body: Record<string, unknown>) => enrollRoute(jsonRequest("/api/academia/inscricao", { body }));

describe("GET /api/academia/cursos", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses an anonymous caller", async () => {
    expect((await listCourses()).status).toBe(401);
  });

  it("lists published courses only", async () => {
    await createSampleCourse({ slug: "aberto" });
    await createSampleCourse({ slug: "rascunho", published: false });
    await signInAs(await createUser());

    expect(await catalogSlugs()).toEqual(["aberto"]);
  });

  it("describes a card with its lesson count, minutes and enrollment state", async () => {
    const { course } = await createSampleCourse({ slug: "aberto" });
    const student = await createUser();
    await signInAs(student);

    const before = await readJson<{ courses: CourseCard[] }>(await listCourses());
    expect(before.courses[0]).toMatchObject({
      slug: "aberto",
      title: "Curso de teste",
      language: "pt",
      lessonCount: 3,
      totalMinutes: 30,
      comingSoon: false,
      myState: { enrolled: false, coursePct: 0, completed: false, completedAt: null, unlocked: false },
    });

    await enroll(student._id, course._id);
    const after = await readJson<{ courses: CourseCard[] }>(await listCourses());
    expect(after.courses[0].myState.enrolled).toBe(true);
  });

  it("hides a gated course until one of its openers is completed", async () => {
    const opener = await createSampleCourse({ slug: "abridor" });
    await createSampleCourse({ slug: "seguinte", prerequisites: [opener.course._id] });
    const student = await createUser();
    await signInAs(student);

    expect(await catalogSlugs()).toEqual(["abridor"]);

    await enroll(student._id, opener.course._id, { completedAt: new Date() });
    expect(await catalogSlugs()).toEqual(["abridor", "seguinte"]);

    const cards = await readJson<{ courses: CourseCard[] }>(await listCourses());
    expect(cards.courses.find((course) => course.slug === "seguinte")?.myState.unlocked).toBe(true);
  });

  it("hides other languages unless asked, own language first, and shows a tutor everything", async () => {
    await createSampleCourse({ slug: "em-espanhol", language: "es" });
    await Course.updateOne({ slug: "em-espanhol" }, { order: 0 });
    await createSampleCourse({ slug: "em-portugues", language: "pt" });

    const student = await createUser({ language: "pt" });
    await signInAs(student);
    expect(await catalogSlugs()).toEqual(["em-portugues"]);

    await signInAs(await createUser({ language: "pt", showOtherLanguage: true }));
    expect(await catalogSlugs()).toEqual(["em-portugues", "em-espanhol"]);

    await signInAs(await createUser({ language: "pt", role: "tutor" }));
    expect(await catalogSlugs()).toEqual(["em-portugues", "em-espanhol"]);
  });
});

describe("GET /api/academia/cursos/[slug]", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("answers 404 for an unpublished course to a student but serves it to a tutor", async () => {
    await createSampleCourse({ slug: "rascunho", published: false });

    await signInAs(await createUser());
    const student = await detail("rascunho");
    expect(student.status).toBe(404);
    expect((await readJson<ErrorBody>(student)).code).toBe("course_not_available");

    await signInAs(await createUser({ role: "tutor" }));
    const tutor = await detail("rascunho");
    expect(tutor.status).toBe(200);
    const body = await readJson<{ course: CourseDetail }>(tutor);
    expect(body.course.modules.every((mod) => mod.unlocked)).toBe(true);
    expect(body.course.modules[1].lessons[0].playable).toBe(true);
    expect(body.course.myState.finalUnlocked).toBe(true);
  });

  it("answers 404 for an unknown slug", async () => {
    await signInAs(await createUser());
    expect((await detail("nao-existe")).status).toBe(404);
  });

  it("locks a gated course and names the openers the student can take", async () => {
    const opener = await createSampleCourse({ slug: "abridor" });
    const hidden = await createSampleCourse({ slug: "escondido", prerequisites: [opener.course._id] });
    await createSampleCourse({ slug: "alvo", prerequisites: [opener.course._id, hidden.course._id] });
    await signInAs(await createUser());

    const response = await detail("alvo");
    expect(response.status).toBe(403);

    const body = await readJson<CourseLocked>(response);
    expect(body.error).toBe("course_locked");
    expect(body.course.slug).toBe("alvo");
    // `escondido` is itself gated, so it is not offered as a way in.
    expect(body.prerequisites.map((item) => item.slug)).toEqual(["abridor"]);
  });

  it("reports every gate as locked for a student who is not enrolled", async () => {
    await createSampleCourse();
    await signInAs(await createUser());

    const body = await readJson<{ course: CourseDetail }>(await detail("curso-teste"));
    expect(body.course.myState.enrolled).toBe(false);
    expect(body.course.modules[0].unlocked).toBe(false);
    expect(body.course.modules[0].lessons[0]).toMatchObject({ playable: false, lockReason: "not_enrolled" });
    expect(body.course.modules[0].exam).toMatchObject({ unlocked: false, lockReason: "not_enrolled" });
  });

  it("carries the gate state of modules, lessons and activities for an enrolled student", async () => {
    const { course, lessons, moduleExam, finalExam } = await createSampleCourse();
    const student = await createUser();
    await signInAs(student);
    await enroll(student._id, course._id);

    const body = await readJson<{ course: CourseDetail }>(await detail("curso-teste"));
    const [module1, module2] = body.course.modules;

    expect(body.course.modules).toHaveLength(2);
    expect(module1.unlocked).toBe(true);
    expect(module1.lessons.map((lesson) => lesson.number)).toEqual([1, 2]);
    expect(module1.lessons[0]).toMatchObject({ playable: true, lockReason: null, completed: false, percent: 0 });
    expect(module1.exam).toMatchObject({
      id: moduleExam._id.toString(),
      scope: "module",
      questionCount: 4,
      passThreshold: 70,
      requiredToAdvance: true,
      attempted: false,
      passed: false,
      bestScorePct: null,
      unlocked: false,
      lockReason: "lessons_incomplete",
    });

    expect(module2.unlocked).toBe(false);
    // The draft lesson is not part of the structure a student sees.
    expect(module2.lessons.map((lesson) => lesson.id)).toEqual([lessons[2]._id.toString()]);
    expect(module2.lessons[0]).toMatchObject({ number: 3, playable: false, lockReason: "module_locked" });
    expect(module2.exam).toBeNull();

    expect(body.course.finalExam).toMatchObject({
      id: finalExam._id.toString(),
      scope: "final",
      unlocked: false,
      lockReason: "modules_incomplete",
    });
    expect(body.course.myState).toMatchObject({ enrolled: true, finalUnlocked: false, completedLessonCount: 0 });
    expect(body.course.unlocks).toEqual([]);
  });
});

describe("POST /api/academia/inscricao", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("answers 404 for an unknown or unpublished course and 400 without one", async () => {
    await createSampleCourse({ slug: "rascunho", published: false });
    await signInAs(await createUser());

    const unknown = await enrollIn({ courseSlug: "nao-existe" });
    expect(unknown.status).toBe(404);
    expect((await readJson<ErrorBody>(unknown)).code).toBe("course_not_available");

    expect((await enrollIn({ courseSlug: "rascunho" })).status).toBe(404);
    expect((await enrollIn({ courseId: "not-an-id" })).status).toBe(400);
    expect((await enrollIn({})).status).toBe(400);
  });

  it("refuses a course without published lessons as coming soon", async () => {
    await Course.create({ slug: "em-breve", title: { pt: "Em breve" }, published: true, modules: [{ number: 1, title: { pt: "M1" } }] });
    await signInAs(await createUser());

    const response = await enrollIn({ courseSlug: "em-breve" });
    expect(response.status).toBe(409);
    expect((await readJson<ErrorBody>(response)).code).toBe("course_coming_soon");
  });

  it("enrolls once and reports a repeat as already enrolled", async () => {
    const { course } = await createSampleCourse();
    const student = await createUser();
    await signInAs(student);

    const first = await enrollIn({ courseSlug: "Curso-Teste" });
    expect(first.status).toBe(201);
    const created = await readJson<{ enrolled: boolean; enrollmentId: string; alreadyEnrolled?: boolean }>(first);
    expect(created.enrolled).toBe(true);
    expect(created.alreadyEnrolled).toBeUndefined();

    const second = await enrollIn({ courseId: course._id.toString() });
    expect(second.status).toBe(200);
    const repeated = await readJson<{ alreadyEnrolled?: boolean; enrollmentId: string }>(second);
    expect(repeated.alreadyEnrolled).toBe(true);
    expect(repeated.enrollmentId).toBe(created.enrollmentId);

    expect(await Enrollment.countDocuments({ userId: student._id, courseId: course._id })).toBe(1);
  });

  it("reactivates a cancelled enrollment instead of creating a second one", async () => {
    const { course } = await createSampleCourse();
    const student = await createUser();
    await signInAs(student);
    const cancelled = await enroll(student._id, course._id, { status: "cancelled" });

    const response = await enrollIn({ courseSlug: "curso-teste" });
    expect(response.status).toBe(200);
    expect((await readJson<{ enrollmentId: string }>(response)).enrollmentId).toBe(cancelled._id.toString());
    expect((await Enrollment.findById(cancelled._id).lean())?.status).toBe("active");
  });

  it("refuses a gated course until a prerequisite is completed", async () => {
    const opener = await createSampleCourse({ slug: "abridor" });
    await createSampleCourse({ slug: "seguinte", prerequisites: [opener.course._id] });
    const student = await createUser();
    await signInAs(student);

    const locked = await enrollIn({ courseSlug: "seguinte" });
    expect(locked.status).toBe(403);
    expect((await readJson<ErrorBody>(locked)).code).toBe("prerequisite_required");

    await enroll(student._id, opener.course._id, { completedAt: new Date() });
    expect((await enrollIn({ courseSlug: "seguinte" })).status).toBe(201);
  });
});
