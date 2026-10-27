import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getLesson } from "@/app/api/academia/aulas/[lessonId]/route";
import { POST as postProgress } from "@/app/api/academia/progresso/route";
import type { LessonPlayerData } from "@/lib/academy/types";
import { Lesson } from "@/models/lesson";
import { LessonProgress } from "@/models/lesson-progress";

import {
  completeLesson,
  createSampleCourse,
  createUser,
  enroll,
  jsonRequest,
  params,
  readJson,
  signInAs,
  type SampleCourse,
} from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };
type ProgressReply = { saved: boolean; skipped?: string; completed?: boolean; courseCompleted?: boolean };

const lesson = (id: string) => getLesson(jsonRequest(`/api/academia/aulas/${id}`), params({ lessonId: id }));
const progress = (body: Record<string, unknown>) => postProgress(jsonRequest("/api/academia/progresso", { body }));

async function enrolledStudent(sample: SampleCourse) {
  const student = await createUser();
  await signInAs(student);
  await enroll(student._id, sample.course._id);
  return student;
}

describe("GET /api/academia/aulas/[lessonId]", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses an anonymous caller and a malformed id", async () => {
    const sample = await createSampleCourse();
    expect((await lesson(sample.lessons[0]._id.toString())).status).toBe(401);

    await signInAs(await createUser());
    expect((await lesson("abc")).status).toBe(400);
  });

  it("refuses a student who is not enrolled", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser());

    const response = await lesson(sample.lessons[0]._id.toString());
    expect(response.status).toBe(403);
    expect((await readJson<ErrorBody>(response)).code).toBe("not_enrolled");
  });

  it("keeps a lesson of a locked module closed", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);

    const response = await lesson(sample.lessons[2]._id.toString());
    expect(response.status).toBe(403);
    expect((await readJson<ErrorBody>(response)).code).toBe("module_locked");
  });

  it("hides a draft lesson from a student but lets a tutor preview it", async () => {
    const sample = await createSampleCourse();
    const draft = sample.lessons[3];
    await Lesson.updateOne({ _id: draft._id }, { "video.youtubeId": "dQw4w9WgXcQ" });
    await enrolledStudent(sample);

    const student = await lesson(draft._id.toString());
    expect(student.status).toBe(404);
    expect((await readJson<ErrorBody>(student)).code).toBe("lesson_not_available");

    await signInAs(await createUser({ role: "tutor" }));
    const tutor = await lesson(draft._id.toString());
    expect(tutor.status).toBe(200);
    const body = await readJson<LessonPlayerData>(tutor);
    expect(body.lesson.number).toBe(4);
    expect(body.video.maxPercent).toBe(100);
  });

  it("serves the first lesson with its YouTube video, no resume point and the next lesson", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);

    const response = await lesson(sample.lessons[0]._id.toString());
    expect(response.status).toBe(200);

    const body = await readJson<LessonPlayerData>(response);
    expect(body.lesson).toMatchObject({
      id: sample.lessons[0]._id.toString(),
      number: 1,
      title: "Aula 1",
      durationMinutes: 10,
      moduleId: sample.module1.toString(),
      moduleNumber: 1,
      moduleTitle: "Módulo 1",
    });
    expect(body.course).toEqual({ id: sample.course._id.toString(), slug: "curso-teste", title: "Curso de teste" });
    expect(body.video).toEqual({
      provider: "youtube",
      youtubeId: "dQw4w9WgXcQ",
      resume: null,
      completedBefore: false,
      maxPercent: 0,
      durationMinutes: 10,
    });
    expect(body.next).toEqual({
      kind: "lesson",
      lessonId: sample.lessons[1]._id.toString(),
      lessonNumber: 2,
      lessonTitle: "Aula 2",
    });
  });

  it("points the last lesson of a module at its activity", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);

    const body = await readJson<LessonPlayerData>(await lesson(sample.lessons[1]._id.toString()));
    expect(body.next).toEqual({ kind: "module-exam", examId: sample.moduleExam._id.toString() });
  });

  it("offers to resume a lesson left half way and reports the ceiling", async () => {
    const sample = await createSampleCourse();
    const student = await enrolledStudent(sample);
    await LessonProgress.create({
      userId: student._id,
      courseId: sample.course._id,
      lessonId: sample.lessons[0]._id,
      percent: 40,
      maxPercent: 55,
    });

    const body = await readJson<LessonPlayerData>(await lesson(sample.lessons[0]._id.toString()));
    expect(body.video.resume).toEqual({ percent: 40 });
    expect(body.video.maxPercent).toBe(55);
    expect(body.video.completedBefore).toBe(false);
  });

  it("answers video_not_ready for a Bunny lesson while Bunny is not configured", async () => {
    const sample = await createSampleCourse();
    await Lesson.updateOne(
      { _id: sample.lessons[0]._id },
      { video: { provider: "bunny", youtubeId: "", bunnyVideoId: "0f0f0f0f-0000-0000-0000-000000000000" } },
    );
    await enrolledStudent(sample);

    const response = await lesson(sample.lessons[0]._id.toString());
    expect(response.status).toBe(409);
    expect((await readJson<ErrorBody>(response)).code).toBe("video_not_ready");
  });
});

describe("POST /api/academia/progresso", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses an anonymous caller", async () => {
    expect((await progress({ lessonId: "x", percent: 1 })).status).toBe(401);
  });

  it("never records a tutor's viewing", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser({ role: "tutor" }));

    const response = await progress({ lessonId: sample.lessons[0]._id.toString(), percent: 100, ended: true });
    expect(response.status).toBe(200);
    expect(await readJson<ProgressReply>(response)).toEqual({ saved: false, skipped: "tutor_view" });
    expect(await LessonProgress.countDocuments()).toBe(0);
  });

  it("rejects a malformed lesson id or percent", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);

    expect((await progress({ lessonId: "nope", percent: 10 })).status).toBe(400);
    expect((await progress({ lessonId: sample.lessons[0]._id.toString(), percent: "x" })).status).toBe(400);
  });

  it("refuses a student who is not enrolled and a lesson of a locked module", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser());
    const notEnrolled = await progress({ lessonId: sample.lessons[0]._id.toString(), percent: 10 });
    expect(notEnrolled.status).toBe(403);
    expect((await readJson<ErrorBody>(notEnrolled)).code).toBe("not_enrolled");

    await enrolledStudent(sample);
    const locked = await progress({ lessonId: sample.lessons[2]._id.toString(), percent: 10 });
    expect(locked.status).toBe(403);
    expect((await readJson<ErrorBody>(locked)).code).toBe("module_locked");
  });

  it("keeps the high-water mark when the student seeks back", async () => {
    const sample = await createSampleCourse();
    const student = await enrolledStudent(sample);
    const lessonId = sample.lessons[0]._id.toString();

    const first = await progress({ lessonId, percent: 50 });
    expect(first.status).toBe(200);
    expect(await readJson<ProgressReply>(first)).toEqual({ saved: true, completed: false, courseCompleted: false });

    await progress({ lessonId, percent: 30 });

    const row = await LessonProgress.findOne({ userId: student._id, lessonId: sample.lessons[0]._id }).lean();
    expect(row).toMatchObject({ percent: 30, maxPercent: 50, completed: false, completedAt: null });
    expect(await LessonProgress.countDocuments()).toBe(1);
  });

  it("completes the lesson once the player reports the end and never un-completes it", async () => {
    const sample = await createSampleCourse();
    const student = await enrolledStudent(sample);
    const lessonId = sample.lessons[0]._id.toString();

    const ended = await progress({ lessonId, percent: 97, ended: true });
    expect(await readJson<ProgressReply>(ended)).toMatchObject({ saved: true, completed: true, courseCompleted: false });

    const row = await LessonProgress.findOne({ userId: student._id, lessonId: sample.lessons[0]._id }).lean();
    expect(row).toMatchObject({ percent: 100, maxPercent: 100, completed: true });
    expect(row?.completedAt).toBeInstanceOf(Date);

    const later = await progress({ lessonId, percent: 10 });
    expect((await readJson<ProgressReply>(later)).completed).toBe(true);

    const again = await LessonProgress.findOne({ userId: student._id, lessonId: sample.lessons[0]._id }).lean();
    expect(again).toMatchObject({ percent: 10, maxPercent: 100, completed: true });
    expect(again?.completedAt?.getTime()).toBe(row?.completedAt?.getTime());
  });

  it("counts the last seconds as the end when the real duration is known", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);
    const lessonId = sample.lessons[0]._id.toString();

    const credits = await progress({ lessonId, percent: 96, maxSeconds: 500, durationSeconds: 600 });
    expect((await readJson<ProgressReply>(credits)).completed).toBe(false);

    const tail = await progress({ lessonId, percent: 97, maxSeconds: 585, durationSeconds: 600 });
    expect((await readJson<ProgressReply>(tail)).completed).toBe(true);
  });

  it("reports the player of an already completed lesson as completed before", async () => {
    const sample = await createSampleCourse();
    const student = await enrolledStudent(sample);
    await completeLesson(student._id, sample.course._id, sample.lessons[0]._id);

    const body = await readJson<LessonPlayerData>(await lesson(sample.lessons[0]._id.toString()));
    expect(body.video.completedBefore).toBe(true);
    expect(body.video.maxPercent).toBe(100);
    expect(body.video.resume).toBeNull();
  });
});
