import { Types } from "mongoose";

import { createSessionToken, type SessionPayload } from "@/lib/academy/auth";
import { hashPassword } from "@/lib/password";
import { AcademyUser } from "@/models/academy-user";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";
import { Exam } from "@/models/exam";
import { Lesson } from "@/models/lesson";
import { LessonProgress } from "@/models/lesson-progress";

import { setSessionCookie } from "./next-headers";

// Builds the Request a route handler expects and unwraps the JSON answer, so
// a test reads like the HTTP exchange it stands for.
export function jsonRequest(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
) {
  const hasBody = init.body !== undefined;
  return new Request(`http://localhost${path}`, {
    method: init.method ?? (hasBody ? "POST" : "GET"),
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    body: hasBody ? JSON.stringify(init.body) : undefined,
  });
}

// A request whose body is raw bytes (the photo upload sends the image as
// the whole body, no multipart).
export function rawRequest(
  path: string,
  init: { method?: string; body?: BodyInit | null; headers?: Record<string, string> } = {},
) {
  return new Request(`http://localhost${path}`, {
    method: init.method ?? "POST",
    headers: init.headers ?? {},
    body: init.body ?? null,
  });
}

export async function readJson<T = Record<string, unknown>>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) };
}

// Reads the `Set-Cookie` a login/register answer carries and installs it in
// the mocked cookie jar, the way a browser would.
export function adoptSessionCookie(response: Response) {
  const header = response.headers.get("set-cookie") ?? "";
  const match = header.match(/pww_academy_session=([^;]*)/);
  if (!match) {
    throw new Error("response carried no academy session cookie");
  }
  setSessionCookie(decodeURIComponent(match[1]));
  return match[1];
}

// bcrypt at 12 rounds costs a quarter of a second; the same test password
// is hashed once per file instead of once per user.
const passwordHashes = new Map<string, Promise<string>>();

function cachedHash(password: string) {
  let hash = passwordHashes.get(password);
  if (!hash) {
    hash = hashPassword(password);
    passwordHashes.set(password, hash);
  }
  return hash;
}

export async function createUser(
  overrides: Partial<{
    fullName: string;
    email: string;
    password: string;
    role: "student" | "tutor";
    country: string;
    language: "pt" | "en" | "es";
    phone: string;
    birthday: Date | null;
    showOtherLanguage: boolean;
  }> = {},
) {
  const email = overrides.email ?? `user-${new Types.ObjectId().toString()}@example.test`;
  const user = await AcademyUser.create({
    fullName: overrides.fullName ?? "Pessoa de Teste",
    email,
    login: email,
    password: await cachedHash(overrides.password ?? "senha123"),
    role: overrides.role ?? "student",
    country: overrides.country ?? "Brasil",
    language: overrides.language ?? "pt",
    phone: overrides.phone ?? "",
    birthday: overrides.birthday ?? null,
    showOtherLanguage: overrides.showOtherLanguage ?? false,
  });
  return user;
}

export async function signInAs(user: { _id: Types.ObjectId; login: string; fullName: string; role: "student" | "tutor"; language: "pt" | "en" | "es" }) {
  const payload: SessionPayload = {
    userId: user._id.toString(),
    login: user.login,
    fullName: user.fullName,
    role: user.role,
    language: user.language,
  };
  const token = await createSessionToken(payload);
  setSessionCookie(token);
  return token;
}

// A published course with two modules, lessons and activities — enough to
// exercise every gate: module 1 (lessons 1–2 + required activity), module 2
// (lesson 3) and a final activity.
export async function createSampleCourse(
  overrides: Partial<{ slug: string; language: "pt" | "en" | "es"; published: boolean; prerequisites: Types.ObjectId[]; starter: boolean }> = {},
) {
  const module1 = new Types.ObjectId();
  const module2 = new Types.ObjectId();
  const course = await Course.create({
    slug: overrides.slug ?? "curso-teste",
    title: { pt: "Curso de teste", es: "Curso de prueba" },
    description: { pt: "Descrição" },
    language: overrides.language ?? "pt",
    published: overrides.published ?? true,
    starter: overrides.starter ?? false,
    order: 1,
    prerequisites: overrides.prerequisites ?? [],
    modules: [
      { _id: module1, number: 1, title: { pt: "Módulo 1" } },
      { _id: module2, number: 2, title: { pt: "Módulo 2" } },
    ],
  });

  const lessons = await Lesson.insertMany([
    { courseId: course._id, moduleId: module1, number: 1, title: { pt: "Aula 1" }, durationMinutes: 10, video: { provider: "youtube", youtubeId: "dQw4w9WgXcQ" }, published: true },
    { courseId: course._id, moduleId: module1, number: 2, title: { pt: "Aula 2" }, durationMinutes: 10, video: { provider: "youtube", youtubeId: "dQw4w9WgXcQ" }, published: true },
    { courseId: course._id, moduleId: module2, number: 3, title: { pt: "Aula 3" }, durationMinutes: 10, video: { provider: "youtube", youtubeId: "dQw4w9WgXcQ" }, published: true },
    { courseId: course._id, moduleId: module2, number: 4, title: { pt: "Rascunho" }, durationMinutes: 10, video: { provider: "youtube", youtubeId: "" }, published: false },
  ]);

  const moduleExam = await Exam.create({
    courseId: course._id,
    scope: "module",
    moduleId: module1,
    passThreshold: 70,
    requiredToAdvance: true,
    questions: [
      { qtype: "truefalse", text: { pt: "Dois mais dois são quatro." }, statementIsTrue: true },
      { qtype: "truefalse", text: { pt: "A Terra é plana." }, statementIsTrue: false, explanation: { pt: "É um geoide." } },
      { qtype: "single", text: { pt: "Capital do Brasil?" }, options: [{ text: { pt: "Rio" } }, { text: { pt: "Brasília" }, correct: true }, { text: { pt: "São Paulo" } }] },
      { qtype: "reflection", text: { pt: "O que você aprendeu?" } },
    ],
  });

  const finalExam = await Exam.create({
    courseId: course._id,
    scope: "final",
    moduleId: null,
    passThreshold: 50,
    requiredToAdvance: true,
    questions: [
      { qtype: "multi", text: { pt: "Números pares?" }, options: [{ text: { pt: "2" }, correct: true }, { text: { pt: "3" } }, { text: { pt: "4" }, correct: true }] },
      { qtype: "text", text: { pt: "Explique com suas palavras." } },
    ],
  });

  return { course, module1, module2, lessons, moduleExam, finalExam };
}

export type SampleCourse = Awaited<ReturnType<typeof createSampleCourse>>;

// Rows the routes would otherwise create one request at a time.
export async function enroll(
  userId: Types.ObjectId,
  courseId: Types.ObjectId,
  overrides: Partial<{ status: "active" | "cancelled"; completedAt: Date | null }> = {},
) {
  return Enrollment.create({
    userId,
    courseId,
    status: overrides.status ?? "active",
    completedAt: overrides.completedAt ?? null,
  });
}

export async function completeLesson(userId: Types.ObjectId, courseId: Types.ObjectId, lessonId: Types.ObjectId) {
  return LessonProgress.create({
    userId,
    courseId,
    lessonId,
    percent: 100,
    maxPercent: 100,
    completed: true,
    completedAt: new Date(),
  });
}

export function questionIds(exam: { questions: { _id: Types.ObjectId }[] }) {
  return exam.questions.map((question) => question._id.toString());
}

// Answer sets for the sample course's activities. The module activity is
// truefalse (true) + truefalse (false) + single (option 2) + reflection; the
// failing set gets one of three right (33 % against a 70 % threshold).
export function moduleAnswers(exam: SampleCourse["moduleExam"], outcome: "pass" | "fail") {
  const [tf1, tf2, single, reflection] = questionIds(exam);
  return outcome === "pass"
    ? { [tf1]: [0], [tf2]: [1], [single]: [1], [reflection]: "Aprendi bastante." }
    : { [tf1]: [1], [tf2]: [0], [single]: [1], [reflection]: "" };
}

// The final is multi (options 1 and 3) + a written answer.
export function finalAnswers(exam: SampleCourse["finalExam"], outcome: "pass" | "fail" = "pass") {
  const [multi, text] = questionIds(exam);
  return { [multi]: outcome === "pass" ? [0, 2] : [0], [text]: "Com as minhas palavras." };
}

export function setCookieHeader(response: Response) {
  return response.headers.get("set-cookie") ?? "";
}

// The activity route's handlers are typed as possibly returning nothing (an
// object-literal union in `loadExamContext` keeps `error` optional on every
// member, so TypeScript cannot narrow it); at runtime every path answers.
export async function answered(response: Promise<Response | undefined>): Promise<Response> {
  const value = await response;
  if (!value) {
    throw new Error("route handler returned nothing");
  }
  return value;
}
