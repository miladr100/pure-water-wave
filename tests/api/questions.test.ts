import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getMe } from "@/app/api/academia/me/route";
import { POST as markSeen } from "@/app/api/academia/perguntas/[id]/vista/route";
import { GET as listQuestions, POST as ask } from "@/app/api/academia/perguntas/route";
import type { LessonQuestion, MeResponse } from "@/lib/academy/types";
import { Question } from "@/models/question";

import { createSampleCourse, createUser, enroll, jsonRequest, params, readJson, signInAs, type SampleCourse } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const post = (body: Record<string, unknown>) => ask(jsonRequest("/api/academia/perguntas", { body }));
const list = (query = "") => listQuestions(jsonRequest(`/api/academia/perguntas${query}`));
const seen = (id: string) => markSeen(jsonRequest(`/api/academia/perguntas/${id}/vista`, { method: "POST" }), params({ id }));

async function enrolledStudent(sample: SampleCourse) {
  const student = await createUser();
  await signInAs(student);
  await enroll(student._id, sample.course._id);
  return student;
}

async function answer(id: unknown, text = "Aqui vai a resposta.") {
  await Question.updateOne({ _id: id }, { status: "answered", answer: text, answeredBy: "Tutora", answeredAt: new Date() });
}

describe("POST /api/academia/perguntas", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses an anonymous caller", async () => {
    expect((await post({ lessonId: "x", text: "Oi" })).status).toBe(401);
  });

  it("rejects a blank question, one over 500 characters and a malformed lesson", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);
    const lessonId = sample.lessons[0]._id.toString();

    expect((await post({ lessonId, text: "   " })).status).toBe(400);
    expect((await post({ lessonId, text: "a".repeat(501) })).status).toBe(400);
    expect((await post({ lessonId: "nope", text: "Pergunta" })).status).toBe(400);
    expect(await Question.countDocuments()).toBe(0);
  });

  it("refuses a student who is not enrolled and a lesson of a locked module", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser());
    const notEnrolled = await post({ lessonId: sample.lessons[0]._id.toString(), text: "Pergunta" });
    expect(notEnrolled.status).toBe(403);
    expect((await readJson<ErrorBody>(notEnrolled)).code).toBe("not_enrolled");

    await enrolledStudent(sample);
    const locked = await post({ lessonId: sample.lessons[2]._id.toString(), text: "Pergunta" });
    expect(locked.status).toBe(403);
    expect((await readJson<ErrorBody>(locked)).code).toBe("module_locked");
  });

  it("hides a draft lesson from a student", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);

    const response = await post({ lessonId: sample.lessons[3]._id.toString(), text: "Pergunta" });
    expect(response.status).toBe(404);
  });

  it("files the question under the lesson with the course slug and the lesson label", async () => {
    const sample = await createSampleCourse();
    const student = await enrolledStudent(sample);

    const response = await post({ lessonId: sample.lessons[0]._id.toString(), text: "  Como assim?  " });
    expect(response.status).toBe(201);

    const body = await readJson<{ question: LessonQuestion }>(response);
    expect(body.question).toMatchObject({
      text: "Como assim?",
      status: "pending",
      courseId: sample.course._id.toString(),
      courseSlug: "curso-teste",
      lessonId: sample.lessons[0]._id.toString(),
      lessonNumber: 1,
      courseTitle: "Curso de teste",
      lessonLabel: "Aula 1: Aula 1",
      answer: null,
    });

    const stored = await Question.findById(body.question.id).lean();
    expect(stored?.userId.toString()).toBe(student._id.toString());
    expect(stored?.status).toBe("open");
  });

  it("caps open questions at five per course", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);
    const lessonId = sample.lessons[0]._id.toString();

    for (let index = 1; index <= 5; index += 1) {
      expect((await post({ lessonId, text: `Pergunta ${index}` })).status).toBe(201);
    }

    const sixth = await post({ lessonId, text: "Pergunta 6" });
    expect(sixth.status).toBe(429);
    expect((await readJson<ErrorBody>(sixth)).code).toBe("too_many_open_questions");

    // An answered question frees a slot.
    const first = await Question.findOne({ text: "Pergunta 1" }).lean();
    await answer(first?._id);
    expect((await post({ lessonId, text: "Pergunta 6" })).status).toBe(201);
  });
});

describe("GET /api/academia/perguntas", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("lists the student's own questions, newest first, filtered by lesson on request", async () => {
    const sample = await createSampleCourse();
    const other = await enrolledStudent(sample);
    await post({ lessonId: sample.lessons[0]._id.toString(), text: "De outra pessoa" });

    const student = await enrolledStudent(sample);
    expect(student._id).not.toEqual(other._id);
    await post({ lessonId: sample.lessons[0]._id.toString(), text: "Primeira" });
    await post({ lessonId: sample.lessons[1]._id.toString(), text: "Segunda" });

    const all = await readJson<{ questions: LessonQuestion[] }>(await list());
    expect(all.questions.map((question) => question.text)).toEqual(["Segunda", "Primeira"]);
    expect(all.questions[0].courseSlug).toBe("curso-teste");

    const filtered = await readJson<{ questions: LessonQuestion[] }>(await list(`?lessonId=${sample.lessons[1]._id.toString()}`));
    expect(filtered.questions.map((question) => question.text)).toEqual(["Segunda"]);

    expect((await list("?lessonId=nope")).status).toBe(400);
  });

  it("shows an answer with who gave it and whether it was seen; an archived one reads as pending", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);
    await post({ lessonId: sample.lessons[0]._id.toString(), text: "Respondida" });
    await post({ lessonId: sample.lessons[0]._id.toString(), text: "Arquivada" });
    const answered = await Question.findOne({ text: "Respondida" }).lean();
    await answer(answered?._id, "Porque sim.");
    await Question.updateOne({ text: "Arquivada" }, { status: "archived" });

    const body = await readJson<{ questions: LessonQuestion[] }>(await list());
    const byText = new Map(body.questions.map((question) => [question.text, question]));
    expect(byText.get("Respondida")).toMatchObject({
      status: "answered",
      answer: { text: "Porque sim.", by: "Tutora", seen: false },
    });
    expect(byText.get("Arquivada")).toMatchObject({ status: "pending", answer: null });
  });
});

describe("POST /api/academia/perguntas/[id]/vista and /me notifications", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("marks an answer as seen once, for its owner only", async () => {
    const sample = await createSampleCourse();
    const student = await enrolledStudent(sample);
    const created = await readJson<{ question: LessonQuestion }>(
      await post({ lessonId: sample.lessons[0]._id.toString(), text: "Pergunta" }),
    );
    await answer(created.question.id);

    expect((await seen("nope")).status).toBe(400);

    await signInAs(await createUser());
    const stranger = await seen(created.question.id);
    expect(stranger.status).toBe(404);
    expect((await readJson<ErrorBody>(stranger)).code).toBe("question_not_found");
    expect((await Question.findById(created.question.id).lean())?.answerSeenAt).toBeNull();

    await signInAs(student);
    const first = await seen(created.question.id);
    expect(first.status).toBe(200);
    const firstSeenAt = (await Question.findById(created.question.id).lean())?.answerSeenAt;
    expect(firstSeenAt).toBeInstanceOf(Date);

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect((await seen(created.question.id)).status).toBe(200);
    expect((await Question.findById(created.question.id).lean())?.answerSeenAt?.getTime()).toBe(firstSeenAt?.getTime());
  });

  it("lists answered questions as notifications, unread until opened", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);
    const open = await readJson<{ question: LessonQuestion }>(await post({ lessonId: sample.lessons[0]._id.toString(), text: "Aberta" }));
    const replied = await readJson<{ question: LessonQuestion }>(await post({ lessonId: sample.lessons[1]._id.toString(), text: "Respondida" }));
    await answer(replied.question.id, "Resposta da tutora");

    const before = await readJson<MeResponse>(await getMe());
    expect(before.unreadCount).toBe(1);
    expect(before.notifications).toHaveLength(1);
    expect(before.notifications[0]).toMatchObject({
      questionId: replied.question.id,
      text: "Respondida",
      courseSlug: "curso-teste",
      lessonId: sample.lessons[1]._id.toString(),
      lessonLabel: "Aula 2: Aula 2",
      answeredBy: "Tutora",
      seen: false,
    });
    expect(before.notifications.some((item) => item.questionId === open.question.id)).toBe(false);

    await seen(replied.question.id);

    const after = await readJson<MeResponse>(await getMe());
    expect(after.unreadCount).toBe(0);
    expect(after.notifications[0].seen).toBe(true);
  });
});

