import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => import("../helpers/next-headers"));

import { GET as getStudent, PATCH as patchStudent } from "@/app/api/admin/alunos/[id]/route";
import { GET as listStudents } from "@/app/api/admin/alunos/route";
import { GET as overview } from "@/app/api/admin/overview/route";
import { GET as listTutors } from "@/app/api/admin/tutores/route";
import type { AdminOverview, AdminStudentDetail, AdminStudentRow } from "@/lib/academy/types";
import { AcademyUser } from "@/models/academy-user";
import { ExamAttempt } from "@/models/exam-attempt";
import { Question } from "@/models/question";

import { completeLesson, createSampleCourse, createUser, enroll, jsonRequest, params, readJson, signInAs } from "../helpers/api";
import { clearDb, startDb, stopDb } from "../helpers/db";
import { resetNextHeaders } from "../helpers/next-headers";

type ErrorBody = { error: string; code?: string };

const students = (query = "") => listStudents(jsonRequest(`/api/admin/alunos${query}`));
const student = (id: string) => getStudent(jsonRequest(`/api/admin/alunos/${id}`), params({ id }));
const patch = (id: string, body: Record<string, unknown>) =>
  patchStudent(jsonRequest(`/api/admin/alunos/${id}`, { method: "PATCH", body }), params({ id }));

async function tutorSession(overrides: Parameters<typeof createUser>[0] = {}) {
  const tutor = await createUser({ fullName: "Tutora Chefe", role: "tutor", ...overrides });
  await signInAs(tutor);
  return tutor;
}

async function studentNames(query = "") {
  const response = await students(query);
  expect(response.status).toBe(200);
  return (await readJson<{ students: AdminStudentRow[] }>(response)).students.map((row) => row.fullName);
}

describe("GET /api/admin/overview", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses a student and an anonymous caller alike", async () => {
    expect((await overview()).status).toBe(403);
    await signInAs(await createUser());
    expect((await overview()).status).toBe(403);
  });

  it("counts students, tutors, published courses and the work waiting", async () => {
    const tutor = await tutorSession();
    await createUser({ role: "tutor" });
    const contacted = await createUser({ fullName: "Contactada" });
    await AcademyUser.updateOne({ _id: contacted._id }, { firstContactAt: new Date() });
    const fresh = await createUser({ fullName: "Nova" });
    const sample = await createSampleCourse();
    await createSampleCourse({ slug: "rascunho", published: false });

    await Question.create([
      { userId: fresh._id, courseId: sample.course._id, lessonId: sample.lessons[0]._id, text: "Aberta", status: "open" },
      { userId: fresh._id, courseId: sample.course._id, lessonId: sample.lessons[0]._id, text: "Respondida", status: "answered" },
    ]);
    const attempt = (textReviews: Record<string, unknown>[]) => ({
      userId: fresh._id,
      courseId: sample.course._id,
      examId: sample.finalExam._id,
      scorePct: 100,
      mcCorrect: 1,
      mcTotal: 1,
      passed: true,
      textReviews,
    });
    await ExamAttempt.create([
      attempt([{ questionId: "q", answer: "texto", reflection: false, reviewed: false }]),
      attempt([{ questionId: "q", answer: "reflexão", reflection: true, reviewed: false }]),
      attempt([{ questionId: "q", answer: "revisada", reflection: false, reviewed: true }]),
    ]);

    const response = await overview();
    expect(response.status).toBe(200);
    const body = await readJson<AdminOverview>(response);
    expect(body).toMatchObject({
      students: 2,
      tutors: 2,
      publishedCourses: 1,
      openQuestions: 1,
      pendingGrading: 1,
      pendingFirstContact: 1,
    });
    expect(body.recentStudents.map((row) => row.fullName)).toEqual(["Nova", "Contactada"]);
    expect(body.recentStudents.some((row) => row.id === tutor._id.toString())).toBe(false);
    expect(body.recentQuestions.map((row) => row.text)).toEqual(["Aberta"]);
    expect(body.recentQuestions[0].studentName).toBe("Nova");
  });
});

describe("GET /api/admin/alunos", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("refuses a student", async () => {
    await signInAs(await createUser());
    expect((await students()).status).toBe(403);
  });

  it("searches by name or e-mail, case-insensitively", async () => {
    await tutorSession();
    await createUser({ fullName: "Maria Souza", email: "maria@example.test" });
    await createUser({ fullName: "João Lima", email: "joao@example.test" });

    expect(await studentNames("?search=SOUZA")).toEqual(["Maria Souza"]);
    expect(await studentNames("?search=joao@")).toEqual(["João Lima"]);
    expect(await studentNames("?search=example.test&sort=name&dir=asc")).toEqual(["João Lima", "Maria Souza"]);
  });

  it("filters by first contact and sorts by name both ways", async () => {
    await tutorSession();
    const contacted = await createUser({ fullName: "Bruna" });
    await AcademyUser.updateOne({ _id: contacted._id }, { firstContactAt: new Date() });
    await createUser({ fullName: "Ana" });
    await createUser({ fullName: "Carla" });

    expect(await studentNames("?filter=nocontact&sort=name&dir=asc")).toEqual(["Ana", "Carla"]);
    expect(await studentNames("?filter=contacted")).toEqual(["Bruna"]);
    expect(await studentNames("?sort=name&dir=asc")).toEqual(["Ana", "Bruna", "Carla"]);
    expect(await studentNames("?sort=name&dir=desc")).toEqual(["Carla", "Bruna", "Ana"]);
  });

  it("carries enrollment counts and the assigned tutor on each row", async () => {
    const tutor = await tutorSession();
    const sample = await createSampleCourse();
    const other = await createSampleCourse({ slug: "outro" });
    const user = await createUser({ fullName: "Ana" });
    await AcademyUser.updateOne({ _id: user._id }, { assignedTutorId: tutor._id });
    await enroll(user._id, sample.course._id, { completedAt: new Date() });
    await enroll(user._id, other.course._id);

    const body = await readJson<{ students: AdminStudentRow[] }>(await students());
    expect(body.students[0]).toMatchObject({
      fullName: "Ana",
      role: "student",
      enrollmentCount: 2,
      completedCount: 1,
      firstContactAt: null,
      tutor: { id: tutor._id.toString(), fullName: "Tutora Chefe" },
    });
  });
});

describe("GET and PATCH /api/admin/alunos/[id]", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("answers 404 for a malformed or unknown id", async () => {
    await tutorSession();
    expect((await student("nope")).status).toBe(404);
    expect((await student("000000000000000000000000")).status).toBe(404);
    expect((await patch("000000000000000000000000", { tutorNotes: "x" })).status).toBe(404);
  });

  it("details enrollments with progress, activity states and the student's questions", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const user = await createUser({ fullName: "Ana", birthday: new Date("1990-07-01T00:00:00Z") });
    await enroll(user._id, sample.course._id);
    await completeLesson(user._id, sample.course._id, sample.lessons[0]._id);
    await ExamAttempt.create({
      userId: user._id,
      courseId: sample.course._id,
      examId: sample.moduleExam._id,
      scorePct: 33,
      mcCorrect: 1,
      mcTotal: 3,
      passed: false,
    });
    await Question.create({ userId: user._id, courseId: sample.course._id, lessonId: sample.lessons[0]._id, text: "Dúvida", lessonLabel: "Aula 1: Aula 1" });

    const response = await student(user._id.toString());
    expect(response.status).toBe(200);
    const body = await readJson<{ student: AdminStudentDetail }>(response);
    expect(body.student).toMatchObject({ fullName: "Ana", birthday: "1990-07-01", photoUrl: null, tutorNotes: "" });
    expect(body.student.enrollments).toHaveLength(1);
    expect(body.student.enrollments[0]).toMatchObject({
      courseSlug: "curso-teste",
      courseTitle: "Curso de teste",
      completedAt: null,
      // 1 of 3 lessons + 2 counted activities = 1/5.
      coursePct: 20,
      completedLessons: 1,
      lessonCount: 3,
    });
    expect(body.student.enrollments[0].exams).toEqual([
      { examId: sample.moduleExam._id.toString(), label: "Módulo 1", state: "reprovado", bestScorePct: 33 },
      { examId: sample.finalExam._id.toString(), label: "Atividade final", state: "pendente", bestScorePct: null },
    ]);
    expect(body.student.questions.map((row) => row.text)).toEqual(["Dúvida"]);
  });

  it("reports a passed activity as aprovado", async () => {
    await tutorSession();
    const sample = await createSampleCourse();
    const user = await createUser();
    await enroll(user._id, sample.course._id);
    await ExamAttempt.create({ userId: user._id, courseId: sample.course._id, examId: sample.moduleExam._id, scorePct: 100, mcCorrect: 3, mcTotal: 3, passed: true });

    const body = await readJson<{ student: AdminStudentDetail }>(await student(user._id.toString()));
    expect(body.student.enrollments[0].exams[0]).toMatchObject({ state: "aprovado", bestScorePct: 100 });
  });

  it("stamps and clears the first contact and keeps tutor notes", async () => {
    await tutorSession();
    const user = await createUser();
    const id = user._id.toString();

    const stamped = await readJson<{ student: AdminStudentDetail }>(await patch(id, { firstContact: true, tutorNotes: "  Ligar na terça  " }));
    expect(stamped.student.firstContactAt).toMatch(/^\d{4}-/);
    expect(stamped.student.tutorNotes).toBe("Ligar na terça");

    const cleared = await readJson<{ student: AdminStudentDetail }>(await patch(id, { firstContact: false }));
    expect(cleared.student.firstContactAt).toBeNull();
    expect(cleared.student.tutorNotes).toBe("Ligar na terça");
  });

  it("assigns only a real tutor", async () => {
    const tutor = await tutorSession();
    const user = await createUser();
    const other = await createUser();
    const id = user._id.toString();

    const notTutor = await patch(id, { assignedTutorId: other._id.toString() });
    expect(notTutor.status).toBe(400);
    expect((await readJson<ErrorBody>(notTutor)).code).toBe("tutor_not_found");

    const assigned = await readJson<{ student: AdminStudentDetail }>(await patch(id, { assignedTutorId: tutor._id.toString() }));
    expect(assigned.student.tutor).toEqual({ id: tutor._id.toString(), fullName: "Tutora Chefe" });

    const detached = await readJson<{ student: AdminStudentDetail }>(await patch(id, { assignedTutorId: null }));
    expect(detached.student.tutor).toBeNull();
  });

  it("converts a student into a tutor and back, never the caller's own role", async () => {
    const tutor = await tutorSession();
    const user = await createUser();
    const id = user._id.toString();

    const promoted = await readJson<{ student: AdminStudentDetail }>(await patch(id, { role: "tutor" }));
    expect(promoted.student.role).toBe("tutor");
    expect((await AcademyUser.findById(user._id).lean())?.role).toBe("tutor");

    const demoted = await readJson<{ student: AdminStudentDetail }>(await patch(id, { role: "student" }));
    expect(demoted.student.role).toBe("student");

    expect((await patch(id, { role: "admin" })).status).toBe(400);

    const own = await patch(tutor._id.toString(), { role: "student" });
    expect(own.status).toBe(400);
    expect((await readJson<ErrorBody>(own)).code).toBe("cannot_change_own_role");
    expect((await AcademyUser.findById(tutor._id).lean())?.role).toBe("tutor");
  });
});

describe("GET /api/admin/tutores", () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => {
    await clearDb();
    resetNextHeaders();
  });

  it("lists tutors with the number of students in their care", async () => {
    const tutor = await tutorSession({ fullName: "Zélia" });
    const other = await createUser({ fullName: "Abel", role: "tutor" });
    const a = await createUser();
    const b = await createUser();
    await AcademyUser.updateMany({ _id: { $in: [a._id, b._id] } }, { assignedTutorId: tutor._id });
    await createUser();

    const response = await listTutors();
    expect(response.status).toBe(200);
    const body = await readJson<{ tutors: AdminStudentRow[] }>(response);
    expect(body.tutors.map((row) => row.fullName)).toEqual(["Abel", "Zélia"]);
    expect(body.tutors.find((row) => row.id === tutor._id.toString())).toMatchObject({ role: "tutor", enrollmentCount: 2, completedCount: 0 });
    expect(body.tutors.find((row) => row.id === other._id.toString())?.enrollmentCount).toBe(0);
  });

  it("refuses a student", async () => {
    await signInAs(await createUser());
    expect((await listTutors()).status).toBe(403);
  });
});
