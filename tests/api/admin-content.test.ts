import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getExam, POST as postExam } from "@/app/api/academia/atividades/[examId]/route";
import { DELETE as deleteActivity, PATCH as patchActivity } from "@/app/api/admin/atividades/[id]/route";
import { PATCH as reviewAnswer } from "@/app/api/admin/correcoes/[attemptId]/route";
import { GET as listGrading } from "@/app/api/admin/correcoes/route";
import { POST as createActivity } from "@/app/api/admin/cursos/[id]/atividades/route";
import { PATCH as patchQuestion } from "@/app/api/admin/perguntas/[id]/route";
import { GET as listQuestions } from "@/app/api/admin/perguntas/route";
import type { AdminExam, AdminGradingRow, AdminQuestionRow, ExamResponse } from "@/lib/academy/types";
import { Exam } from "@/models/exam";
import { ExamAttempt } from "@/models/exam-attempt";
import { Question } from "@/models/question";

import {
  answered,
  completeLesson,
  createSampleCourse,
  createUser,
  enroll,
  finalAnswers,
  jsonRequest,
  moduleAnswers,
  params,
  readJson,
  signInAs,
  type SampleCourse,
} from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const addActivity = (id: string, body: Record<string, unknown>) =>
  createActivity(jsonRequest(`/api/admin/cursos/${id}/atividades`, { body }), params({ id }));
const editActivity = (id: string, body: Record<string, unknown>) =>
  patchActivity(jsonRequest(`/api/admin/atividades/${id}`, { method: "PATCH", body }), params({ id }));
const dropActivity = (id: string) => deleteActivity(jsonRequest(`/api/admin/atividades/${id}`, { method: "DELETE" }), params({ id }));
const questions = (query = "") => listQuestions(jsonRequest(`/api/admin/perguntas${query}`));
const editQuestion = (id: string, body: Record<string, unknown>) =>
  patchQuestion(jsonRequest(`/api/admin/perguntas/${id}`, { method: "PATCH", body }), params({ id }));
const review = (attemptId: string, body: Record<string, unknown>) =>
  reviewAnswer(jsonRequest(`/api/admin/correcoes/${attemptId}`, { method: "PATCH", body }), params({ attemptId }));

async function tutorSession() {
  const tutor = await createUser({ fullName: "Tutora Chefe", role: "tutor" });
  await signInAs(tutor);
  return tutor;
}

// A student who passed the module activity and answered the final (one
// written answer waiting for review); the tutor is signed back in after.
async function studentWithFinalAttempt(sample: SampleCourse) {
  const student = await createUser({ fullName: "Aluna" });
  await signInAs(student);
  await enroll(student._id, sample.course._id);
  for (const lesson of sample.lessons.slice(0, 3)) {
    await completeLesson(student._id, sample.course._id, lesson._id);
  }
  const submit = (id: string, answers: unknown) =>
    answered(postExam(jsonRequest(`/api/academia/atividades/${id}`, { body: { answers } }), params({ examId: id })));
  expect((await submit(sample.moduleExam._id.toString(), moduleAnswers(sample.moduleExam, "pass"))).status).toBe(201);
  expect((await submit(sample.finalExam._id.toString(), finalAnswers(sample.finalExam))).status).toBe(201);
  return student;
}

describe("/api/admin/atividades", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses a student", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser());
    expect((await addActivity(sample.course._id.toString(), { scope: "final" })).status).toBe(403);
    expect((await editActivity(sample.moduleExam._id.toString(), { passThreshold: 50 })).status).toBe(403);
    expect((await dropActivity(sample.moduleExam._id.toString())).status).toBe(403);
  });

  it("allows one activity per module and one final per course", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const id = sample.course._id.toString();

    const created = await addActivity(id, { scope: "module", moduleId: sample.module2.toString() });
    expect(created.status).toBe(201);
    expect((await readJson<{ exam: AdminExam }>(created)).exam).toMatchObject({
      scope: "module",
      moduleId: sample.module2.toString(),
      passThreshold: 70,
      requiredToAdvance: true,
      attemptCount: 0,
      questions: [],
    });

    const duplicateModule = await addActivity(id, { scope: "module", moduleId: sample.module1.toString() });
    expect(duplicateModule.status).toBe(409);
    expect((await readJson<ErrorBody>(duplicateModule)).code).toBe("exam_exists");

    const duplicateFinal = await addActivity(id, { scope: "final" });
    expect(duplicateFinal.status).toBe(409);

    expect((await addActivity(id, { scope: "weekly" })).status).toBe(400);
    const badModule = await addActivity(id, { scope: "module", moduleId: "000000000000000000000000" });
    expect((await readJson<ErrorBody>(badModule)).code).toBe("module_not_found");
    expect((await addActivity("000000000000000000000000", { scope: "final" })).status).toBe(404);
  });

  it("keeps the ids of existing questions and options and mints new ones", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const id = sample.moduleExam._id.toString();
    const before = (await Exam.findById(id).lean())!;
    const [tf1, , single] = before.questions;
    const [rio, brasilia] = single.options;

    const response = await editActivity(id, {
      passThreshold: 80.4,
      requiredToAdvance: false,
      questions: [
        { id: tf1._id.toString(), qtype: "truefalse", text: { pt: "Reescrita" }, statementIsTrue: false, explanation: "Porque não." },
        {
          id: single._id.toString(),
          qtype: "single",
          text: "Capital?",
          options: [
            { id: brasilia._id.toString(), text: "Brasília", correct: true },
            { id: rio._id.toString(), text: "Rio" },
            { text: "Nova" },
          ],
        },
        { qtype: "text", text: "Escreva." },
      ],
    });
    expect(response.status).toBe(200);

    const body = await readJson<{ exam: AdminExam }>(response);
    expect(body.exam).toMatchObject({ passThreshold: 80, requiredToAdvance: false, attemptCount: 0 });
    expect(body.exam.questions).toHaveLength(3);
    expect(body.exam.questions[0]).toMatchObject({ id: tf1._id.toString(), qtype: "truefalse", statementIsTrue: false, explanation: { pt: "Porque não." } });
    expect(body.exam.questions[1].id).toBe(single._id.toString());
    expect(body.exam.questions[1].options.map((option) => option.id)).toEqual([
      brasilia._id.toString(),
      rio._id.toString(),
      expect.not.stringMatching(new RegExp(`^(${brasilia._id}|${rio._id})$`)),
    ]);
    expect(body.exam.questions[1].options.map((option) => option.correct)).toEqual([true, false, false]);
    expect(body.exam.questions[2].id).toMatch(/^[a-f\d]{24}$/);
    expect(before.questions.map((question) => question._id.toString())).not.toContain(body.exam.questions[2].id);
  });

  it("rejects malformed questions", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const id = sample.moduleExam._id.toString();
    const options = (correct: boolean[]) => correct.map((flag, index) => ({ text: `Opção ${index + 1}`, correct: flag }));

    const cases: Record<string, unknown>[] = [
      { qtype: "single", text: "Sem correta", options: options([false, false]) },
      { qtype: "single", text: "Duas corretas", options: options([true, true]) },
      { qtype: "single", text: "Uma só alternativa", options: options([true]) },
      { qtype: "multi", text: "Sem correta", options: options([false, false]) },
      { qtype: "truefalse", text: "Com alternativas", options: options([true, false]) },
      { qtype: "single", text: "", options: options([true, false]) },
      { qtype: "single", text: "Alternativa vazia", options: [{ text: "", correct: true }, { text: "B" }] },
      { qtype: "essay", text: "Tipo inválido" },
    ];

    for (const question of cases) {
      const response = await editActivity(id, { questions: [question] });
      expect(response.status, JSON.stringify(question)).toBe(400);
      expect((await readJson<ErrorBody>(response)).code).toBe("invalid_questions");
    }
    expect((await editActivity(id, { questions: "x" })).status).toBe(400);
    expect((await editActivity(id, { passThreshold: 101 })).status).toBe(400);
    expect((await Exam.findById(id).lean())?.questions).toHaveLength(4);
  });

  it("refuses to delete an activity with attempts, otherwise removes it", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const user = await createUser();
    await ExamAttempt.create({ userId: user._id, courseId: sample.course._id, examId: sample.moduleExam._id, scorePct: 0, mcCorrect: 0, mcTotal: 3, passed: false });

    const blocked = await dropActivity(sample.moduleExam._id.toString());
    expect(blocked.status).toBe(409);
    expect((await readJson<ErrorBody>(blocked)).code).toBe("has_attempts");

    expect((await dropActivity(sample.finalExam._id.toString())).status).toBe(200);
    expect(await Exam.findById(sample.finalExam._id).lean()).toBeNull();
    expect((await dropActivity(sample.finalExam._id.toString())).status).toBe(404);
  });
});

describe("/api/admin/perguntas", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  async function seedQuestions(sample: SampleCourse) {
    const student = await createUser({ fullName: "Aluna" });
    const base = { userId: student._id, courseId: sample.course._id, lessonId: sample.lessons[0]._id, courseTitle: "Curso de teste", lessonLabel: "Aula 1: Aula 1" };
    const [open, answered, archived] = await Question.create([
      { ...base, text: "Aberta" },
      { ...base, text: "Respondida", status: "answered", answer: "Sim", answeredBy: "Outra", answeredAt: new Date(), answerSeenAt: new Date() },
      { ...base, text: "Arquivada", status: "archived" },
    ]);
    return { student, open, answered, archived };
  }

  it("refuses a student", async () => {
    await signInAs(await createUser());
    expect((await questions()).status).toBe(403);
    expect((await editQuestion("000000000000000000000000", { answer: "x" })).status).toBe(403);
  });

  it("lists open questions by default, or one status, or all", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    await seedQuestions(sample);

    const texts = async (query: string) => {
      const response = await questions(query);
      expect(response.status).toBe(200);
      return (await readJson<{ questions: AdminQuestionRow[] }>(response)).questions.map((row) => row.text);
    };

    expect(await texts("")).toEqual(["Aberta"]);
    expect(await texts("?status=answered")).toEqual(["Respondida"]);
    expect(await texts("?status=archived")).toEqual(["Arquivada"]);
    expect(await texts("?status=bogus")).toEqual(["Aberta"]);
    expect((await texts("?status=all")).sort()).toEqual(["Aberta", "Arquivada", "Respondida"]);

    const body = await readJson<{ questions: AdminQuestionRow[] }>(await questions());
    expect(body.questions[0]).toMatchObject({ studentName: "Aluna", courseTitle: "Curso de teste", lessonLabel: "Aula 1: Aula 1", status: "open", answer: "", answeredAt: null });
  });

  it("answers a question in the tutor's name and marks it unread for the student again", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const { answered } = await seedQuestions(sample);

    const response = await editQuestion(answered._id.toString(), { answer: "  Nova resposta  " });
    expect(response.status).toBe(200);
    const body = await readJson<{ question: AdminQuestionRow }>(response);
    expect(body.question).toMatchObject({ status: "answered", answer: "Nova resposta", answeredBy: "Tutora Chefe" });
    expect(body.question.answeredAt).toMatch(/^\d{4}-/);

    const stored = await Question.findById(answered._id).lean();
    expect(stored?.answerSeenAt).toBeNull();
    expect(stored?.answeredAt?.getTime()).toBeGreaterThan(answered.answeredAt!.getTime() - 1);
  });

  it("archives and reopens a question, and rejects an unknown status", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const { open } = await seedQuestions(sample);
    const id = open._id.toString();

    const archived = await readJson<{ question: AdminQuestionRow }>(await editQuestion(id, { status: "archived" }));
    expect(archived.question.status).toBe("archived");
    expect((await Question.findById(id).lean())?.status).toBe("archived");

    const reopened = await readJson<{ question: AdminQuestionRow }>(await editQuestion(id, { status: "open" }));
    expect(reopened.question.status).toBe("open");

    expect((await editQuestion(id, { status: "deleted" })).status).toBe(400);
    expect((await editQuestion("000000000000000000000000", { status: "open" })).status).toBe(404);
  });
});

describe("/api/admin/correcoes", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses a student", async () => {
    await signInAs(await createUser());
    expect((await listGrading()).status).toBe(403);
    expect((await review("000000000000000000000000", { questionId: "q", reviewed: true })).status).toBe(403);
  });

  it("lists attempts with an unreviewed written answer and clears them once reviewed", async () => {
    const sample = await createSampleCourse();
    const student = await studentWithFinalAttempt(sample);
    const [, text] = sample.finalExam.questions.map((question) => question._id.toString());
    const tutor = await tutorSession();

    const response = await listGrading();
    expect(response.status).toBe(200);
    const rows = (await readJson<{ rows: AdminGradingRow[] }>(response)).rows;
    // The module attempt (a reflection only) and the final (a written answer)
    // both wait: a reflection is unreviewed too, it just never blocks anyone.
    expect(rows.map((row) => row.examLabel).sort()).toEqual(["Atividade final", "Módulo 1"]);
    const finalRow = rows.find((row) => row.examLabel === "Atividade final")!;
    expect(finalRow).toMatchObject({ studentId: student._id.toString(), studentName: "Aluna", courseTitle: "Curso de teste" });
    expect(finalRow.reviews).toEqual([
      {
        questionId: text,
        questionText: "Explique com suas palavras.",
        reflection: false,
        answer: "Com as minhas palavras.",
        reviewed: false,
        feedback: "",
        gradedBy: "",
        gradedAt: null,
      },
    ]);

    const missing = await review(finalRow.attemptId, { questionId: "nope", reviewed: true });
    expect(missing.status).toBe(404);
    expect((await review(finalRow.attemptId, { questionId: text })).status).toBe(400);

    const reviewed = await review(finalRow.attemptId, { questionId: text, reviewed: true, feedback: "  Muito bem.  " });
    expect(reviewed.status).toBe(200);

    const attempt = await ExamAttempt.findById(finalRow.attemptId).lean();
    expect(attempt?.textReviews[0]).toMatchObject({ reviewed: true, feedback: "Muito bem.", gradedBy: tutor.fullName });
    expect(attempt?.textReviews[0].gradedAt).toBeInstanceOf(Date);

    const after = (await readJson<{ rows: AdminGradingRow[] }>(await listGrading())).rows;
    expect(after.map((row) => row.attemptId)).not.toContain(finalRow.attemptId);

    await signInAs(student);
    const seen = await readJson<ExamResponse>(
      await answered(getExam(jsonRequest(`/api/academia/atividades/${sample.finalExam._id}`), params({ examId: sample.finalExam._id.toString() }))),
    );
    expect(seen.result?.pendingReviewCount).toBe(0);
    expect(seen.result?.reviews[0]).toMatchObject({ questionId: text, reviewed: true, feedback: "Muito bem.", gradedBy: "Tutora Chefe" });
    expect(seen.result?.reviews[0].gradedAt).toMatch(/^\d{4}-/);
  });
});
