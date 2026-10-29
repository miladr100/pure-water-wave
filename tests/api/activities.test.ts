import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getExam, POST as postExam } from "@/app/api/academia/atividades/[examId]/route";
import { GET as getCourse } from "@/app/api/academia/cursos/[slug]/route";
import { GET as getMe } from "@/app/api/academia/me/route";
import { POST as postProgress } from "@/app/api/academia/progresso/route";
import type { AttemptResult, CourseDetail, ExamResponse, MeResponse, NextAfterPass } from "@/lib/academy/types";
import { Enrollment } from "@/models/enrollment";
import { ExamAttempt } from "@/models/exam-attempt";

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
  questionIds,
  readJson,
  signInAs,
  type SampleCourse,
} from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string; reason?: string; missing?: string[] };
type SubmitReply = { result: AttemptResult; next: NextAfterPass; stored?: boolean };

const exam = (id: string) => answered(getExam(jsonRequest(`/api/academia/atividades/${id}`), params({ examId: id })));
const submit = (id: string, answers: unknown) =>
  answered(postExam(jsonRequest(`/api/academia/atividades/${id}`, { body: { answers } }), params({ examId: id })));

async function enrolledStudent(sample: SampleCourse) {
  const student = await createUser();
  await signInAs(student);
  await enroll(student._id, sample.course._id);
  return student;
}

// Module 1 watched: the module activity is open.
async function studentAtModuleExam(sample: SampleCourse) {
  const student = await enrolledStudent(sample);
  await completeLesson(student._id, sample.course._id, sample.lessons[0]._id);
  await completeLesson(student._id, sample.course._id, sample.lessons[1]._id);
  return student;
}

describe("GET /api/academia/atividades/[examId]", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses an anonymous caller, a malformed id and an unknown activity", async () => {
    const sample = await createSampleCourse();
    expect((await exam(sample.moduleExam._id.toString())).status).toBe(401);

    await signInAs(await createUser());
    expect((await exam("nope")).status).toBe(400);
    expect((await exam(sample.course._id.toString())).status).toBe(404);
  });

  it("refuses a student who is not enrolled", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser());

    const response = await exam(sample.moduleExam._id.toString());
    expect(response.status).toBe(403);
    expect((await readJson<ErrorBody>(response)).code).toBe("not_enrolled");
  });

  it("serves the activity without its answer key and reports why it is locked", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);

    const response = await exam(sample.moduleExam._id.toString());
    expect(response.status).toBe(200);

    const body = await readJson<ExamResponse>(response);
    expect(body.exam).toMatchObject({
      id: sample.moduleExam._id.toString(),
      scope: "module",
      courseSlug: "curso-teste",
      moduleNumber: 1,
      moduleTitle: "Módulo 1",
      passThreshold: 70,
      requiredToAdvance: true,
      questionCount: 4,
      mcCount: 3,
      textCount: 0,
      reflectionCount: 1,
      requiredCount: 3,
      unlocked: false,
      lockReason: "lessons_incomplete",
    });
    expect(body.exam.questions.map((question) => question.qtype)).toEqual(["truefalse", "truefalse", "single", "reflection"]);
    expect(body.exam.questions[2].options).toEqual(["Rio", "Brasília", "São Paulo"]);
    for (const question of body.exam.questions) {
      expect(question).not.toHaveProperty("correct");
      expect(question).not.toHaveProperty("explanation");
      expect(question).not.toHaveProperty("statementIsTrue");
    }
    expect(JSON.stringify(body)).not.toContain("geoide");
    expect(body.result).toBeNull();
    expect(body.next).toEqual({});
  });

  it("unlocks the module activity once both lessons are watched", async () => {
    const sample = await createSampleCourse();
    await studentAtModuleExam(sample);

    const body = await readJson<ExamResponse>(await exam(sample.moduleExam._id.toString()));
    expect(body.exam.unlocked).toBe(true);
    expect(body.exam.lockReason).toBeNull();
  });

  it("opens every activity to a tutor without touching their state", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser({ role: "tutor" }));

    const body = await readJson<ExamResponse>(await exam(sample.finalExam._id.toString()));
    expect(body.exam.unlocked).toBe(true);
    expect(body.result).toBeNull();
  });
});

describe("POST /api/academia/atividades/[examId]", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses answers to a locked activity", async () => {
    const sample = await createSampleCourse();
    await enrolledStudent(sample);

    const response = await submit(sample.moduleExam._id.toString(), moduleAnswers(sample.moduleExam, "pass"));
    expect(response.status).toBe(403);
    expect(await readJson<ErrorBody>(response)).toMatchObject({ code: "exam_locked", reason: "lessons_incomplete" });
    expect(await ExamAttempt.countDocuments()).toBe(0);
  });

  it("rejects a body that is not an answer map", async () => {
    const sample = await createSampleCourse();
    await studentAtModuleExam(sample);

    expect((await submit(sample.moduleExam._id.toString(), "x")).status).toBe(400);
    expect((await submit(sample.moduleExam._id.toString(), [1])).status).toBe(400);
  });

  it("lists the unanswered questions, a blank reflection not among them", async () => {
    const sample = await createSampleCourse();
    await studentAtModuleExam(sample);
    const [tf1, tf2, single] = questionIds(sample.moduleExam);

    const response = await submit(sample.moduleExam._id.toString(), { [tf1]: [0] });
    expect(response.status).toBe(400);
    const body = await readJson<ErrorBody>(response);
    expect(body.code).toBe("unanswered_questions");
    expect(body.missing).toEqual([tf2, single]);
  });

  it("fails a wrong set, reveals the key and explains only the false statement", async () => {
    const sample = await createSampleCourse();
    const student = await studentAtModuleExam(sample);
    const [tf1, tf2, single, reflection] = questionIds(sample.moduleExam);

    const response = await submit(sample.moduleExam._id.toString(), moduleAnswers(sample.moduleExam, "fail"));
    expect(response.status).toBe(201);

    const body = await readJson<SubmitReply>(response);
    expect(body.result).toMatchObject({
      passed: false,
      scorePct: 33,
      mcCorrect: 1,
      mcTotal: 3,
      passThreshold: 70,
      detail: { [tf1]: false, [tf2]: false, [single]: true },
      correct: { [tf1]: [0], [tf2]: [1], [single]: [1], [reflection]: [] },
      explanations: { [tf2]: "É um geoide." },
      reviews: [],
      pendingReviewCount: 0,
    });
    expect(body.result.questions.map((question) => question.id)).toEqual([tf1, tf2, single, reflection]);
    expect(body.next).toEqual({});

    const attempt = await ExamAttempt.findOne({ userId: student._id }).lean();
    expect(attempt?.passed).toBe(false);
    expect(attempt?.examSnapshot).toBeTruthy();
  });

  it("passes a right set, points at the next module and keeps the reflection for the tutor", async () => {
    const sample = await createSampleCourse();
    const student = await studentAtModuleExam(sample);
    const [, , , reflection] = questionIds(sample.moduleExam);

    const response = await submit(sample.moduleExam._id.toString(), moduleAnswers(sample.moduleExam, "pass"));
    expect(response.status).toBe(201);

    const body = await readJson<SubmitReply>(response);
    expect(body.result).toMatchObject({ passed: true, scorePct: 100, pendingReviewCount: 0 });
    expect(body.result.reviews).toEqual([
      { questionId: reflection, reviewed: false, reflection: true, feedback: "", gradedBy: "", gradedAt: null },
    ]);
    expect(body.next).toEqual({
      nextModuleNumber: 2,
      nextLessonId: sample.lessons[2]._id.toString(),
      nextLessonNumber: 3,
    });

    const attempt = await ExamAttempt.findOne({ userId: student._id }).lean();
    expect(attempt?.textReviews).toHaveLength(1);
    expect(attempt?.textReviews[0]).toMatchObject({ reflection: true, reviewed: false, answer: "Aprendi bastante." });
  });

  it("stores every retry and reports the best attempt", async () => {
    const sample = await createSampleCourse();
    const student = await studentAtModuleExam(sample);
    const id = sample.moduleExam._id.toString();

    await submit(id, moduleAnswers(sample.moduleExam, "fail"));
    const afterFail = await readJson<ExamResponse>(await exam(id));
    expect(afterFail.result?.passed).toBe(false);
    expect(afterFail.next).toEqual({});

    await submit(id, moduleAnswers(sample.moduleExam, "pass"));
    await submit(id, moduleAnswers(sample.moduleExam, "fail"));

    expect(await ExamAttempt.countDocuments({ userId: student._id, examId: sample.moduleExam._id })).toBe(3);
    const best = await readJson<ExamResponse>(await exam(id));
    expect(best.result?.passed).toBe(true);
    expect(best.result?.scorePct).toBe(100);
    expect(best.next.nextLessonId).toBe(sample.lessons[2]._id.toString());
  });

  it("grades a tutor's test run without storing it", async () => {
    const sample = await createSampleCourse();
    await signInAs(await createUser({ role: "tutor" }));

    const response = await submit(sample.moduleExam._id.toString(), moduleAnswers(sample.moduleExam, "pass"));
    expect(response.status).toBe(200);

    const body = await readJson<SubmitReply>(response);
    expect(body.stored).toBe(false);
    expect(body.result.passed).toBe(true);
    expect(body.next).toEqual({});
    expect(await ExamAttempt.countDocuments()).toBe(0);
  });
});

describe("course completion", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("takes a student from the module activity to a completed course that unlocks the next one", async () => {
    const sample = await createSampleCourse();
    await createSampleCourse({ slug: "seguinte", prerequisites: [sample.course._id] });
    const student = await studentAtModuleExam(sample);
    const [multi, text] = questionIds(sample.finalExam);

    await submit(sample.moduleExam._id.toString(), moduleAnswers(sample.moduleExam, "pass"));

    // The final is still closed: module 2 has a lesson to watch.
    const closed = await submit(sample.finalExam._id.toString(), finalAnswers(sample.finalExam));
    expect(closed.status).toBe(403);
    expect((await readJson<ErrorBody>(closed)).reason).toBe("modules_incomplete");

    const watched = await postProgress(
      jsonRequest("/api/academia/progresso", { body: { lessonId: sample.lessons[2]._id.toString(), percent: 100, ended: true } }),
    );
    expect(await readJson<{ completed: boolean; courseCompleted: boolean }>(watched)).toEqual({
      saved: true,
      completed: true,
      courseCompleted: false,
    });

    const wrong = await submit(sample.finalExam._id.toString(), finalAnswers(sample.finalExam, "fail"));
    expect((await readJson<SubmitReply>(wrong)).result.passed).toBe(false);

    const response = await submit(sample.finalExam._id.toString(), finalAnswers(sample.finalExam));
    expect(response.status).toBe(201);
    const body = await readJson<SubmitReply>(response);
    expect(body.result).toMatchObject({
      passed: true,
      scorePct: 100,
      mcTotal: 1,
      detail: { [multi]: true, [text]: "pending" },
      pendingReviewCount: 1,
    });
    expect(body.result.reviews[0]).toMatchObject({ questionId: text, reflection: false, reviewed: false });
    expect(body.next).toEqual({ courseCompleted: true });

    const enrollment = await Enrollment.findOne({ userId: student._id, courseId: sample.course._id }).lean();
    expect(enrollment?.completedAt).toBeInstanceOf(Date);

    const course = await readJson<{ course: CourseDetail }>(
      await getCourse(jsonRequest("/api/academia/cursos/curso-teste"), params({ slug: "curso-teste" })),
    );
    expect(course.course.myState).toMatchObject({ completed: true, coursePct: 100, completedLessonCount: 3, finalUnlocked: true });
    expect(course.course.modules.map((mod) => mod.complete)).toEqual([true, true]);
    expect(course.course.unlocks).toEqual([{ slug: "seguinte", title: "Curso de teste" }]);

    const me = await readJson<MeResponse>(await getMe());
    expect(me.enrollments).toHaveLength(1);
    expect(me.enrollments[0]).toMatchObject({ slug: "curso-teste", myState: { enrolled: true, completed: true, coursePct: 100 } });
    expect(me.enrollments[0].myState.completedAt).toBe(enrollment?.completedAt?.toISOString());
    expect(me.continueLesson).toBeNull();
  });

  it("completes a course without a final once every module is done", async () => {
    const sample = await createSampleCourse();
    await sample.finalExam.deleteOne();
    const student = await studentAtModuleExam(sample);
    await completeLesson(student._id, sample.course._id, sample.lessons[2]._id);

    const response = await submit(sample.moduleExam._id.toString(), moduleAnswers(sample.moduleExam, "pass"));
    expect(response.status).toBe(201);

    const enrollment = await Enrollment.findOne({ userId: student._id, courseId: sample.course._id }).lean();
    expect(enrollment?.completedAt).toBeInstanceOf(Date);
  });
});
