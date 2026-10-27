import { Types } from "mongoose";

import { bestAttempt, lessonCompleted, progressPct } from "@/lib/academy/gating";
import { bunnyPlaybackConfigured, bunnyUploadConfigured } from "@/lib/academy/bunny";
import {
  loadCourseStructure,
  loadStudentState,
  type CourseDoc,
  type LessonDoc,
} from "@/lib/academy/load";
import type {
  AdminCourseStructure,
  AdminExam,
  AdminLesson,
  AdminQuestionRow,
  AdminStudentDetail,
  AdminStudentRow,
} from "@/lib/academy/types";
import { pick, type Localized } from "@/lib/academy/localized";
import { formatBirthday, photoUrlOf } from "@/lib/academy/profile";
import type { UserLanguage } from "@/lib/user-languages";
import type { AcademyRole } from "@/lib/academy/roles";
import { AcademyUser } from "@/models/academy-user";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";
import { Exam, type QuestionType } from "@/models/exam";
import { ExamAttempt } from "@/models/exam-attempt";
import { Lesson } from "@/models/lesson";
import { LessonProgress } from "@/models/lesson-progress";
import { Question } from "@/models/question";

// Turns documents into the Admin* shapes of `types.ts`. The lookups the rows
// need (tutor names, enrollment counts) are batched per call so a list of a
// few hundred students costs a handful of queries, not one per row.

export type UserDoc = {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  birthday?: Date | null;
  photoUpdatedAt?: Date | null;
  language: UserLanguage;
  role: AcademyRole;
  firstContactAt?: Date | null;
  tutorNotes?: string;
  assignedTutorId?: Types.ObjectId | null;
  lastSeenAt?: Date | null;
  createdAt: Date;
};

export type QuestionDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseTitle: string;
  lessonLabel: string;
  text: string;
  answer: string;
  answeredBy: string;
  answeredAt?: Date | null;
  status: "open" | "answered" | "archived";
  createdAt: Date;
};

export type ExamFullDoc = {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  scope: "module" | "final";
  moduleId: Types.ObjectId | null;
  passThreshold: number;
  requiredToAdvance: boolean;
  questions: {
    _id: Types.ObjectId;
    qtype: QuestionType;
    text: Localized;
    statementIsTrue?: boolean;
    explanation?: Localized;
    options?: { _id: Types.ObjectId; text: Localized; correct?: boolean }[];
  }[];
};

const iso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

export const USER_ROW_FIELDS =
  "fullName email phone country city birthday photoUpdatedAt language role firstContactAt tutorNotes assignedTutorId lastSeenAt createdAt";

export async function studentRows(users: UserDoc[]): Promise<AdminStudentRow[]> {
  if (users.length === 0) {
    return [];
  }

  const ids = users.map((user) => user._id);
  const tutorIds = users
    .map((user) => user.assignedTutorId)
    .filter((id): id is Types.ObjectId => Boolean(id));

  const [tutors, counts] = await Promise.all([
    tutorIds.length
      ? (AcademyUser.find({ _id: { $in: tutorIds } }).select("fullName").lean() as Promise<
          { _id: Types.ObjectId; fullName: string }[]
        >)
      : Promise.resolve([]),
    Enrollment.aggregate<{ _id: Types.ObjectId; total: number; completed: number }>([
      { $match: { userId: { $in: ids }, status: "active" } },
      {
        $group: {
          _id: "$userId",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $ifNull: ["$completedAt", false] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const tutorName = new Map(tutors.map((tutor) => [tutor._id.toString(), tutor.fullName]));
  const countByUser = new Map(counts.map((row) => [row._id.toString(), row]));

  return users.map((user) => {
    const count = countByUser.get(user._id.toString());
    const tutorId = user.assignedTutorId?.toString() ?? null;
    const name = tutorId ? tutorName.get(tutorId) : undefined;

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
      country: user.country ?? "",
      city: user.city ?? "",
      language: user.language ?? "pt",
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: iso(user.lastSeenAt),
      firstContactAt: iso(user.firstContactAt),
      tutor: tutorId && name ? { id: tutorId, fullName: name } : null,
      enrollmentCount: count?.total ?? 0,
      completedCount: count?.completed ?? 0,
    };
  });
}

export async function questionRows(questions: QuestionDoc[]): Promise<AdminQuestionRow[]> {
  if (questions.length === 0) {
    return [];
  }

  const userIds = [...new Set(questions.map((question) => question.userId.toString()))];
  const users = (await AcademyUser.find({ _id: { $in: userIds } })
    .select("fullName")
    .lean()) as { _id: Types.ObjectId; fullName: string }[];
  const nameById = new Map(users.map((user) => [user._id.toString(), user.fullName]));

  return questions.map((question) => ({
    id: question._id.toString(),
    studentId: question.userId.toString(),
    studentName: nameById.get(question.userId.toString()) ?? "",
    courseTitle: question.courseTitle,
    lessonLabel: question.lessonLabel,
    text: question.text,
    answer: question.answer ?? "",
    answeredBy: question.answeredBy ?? "",
    answeredAt: iso(question.answeredAt),
    status: question.status,
    createdAt: question.createdAt.toISOString(),
  }));
}

// The label the panel shows for an activity: the module it belongs to, or
// the final activity of the course. Content labels are Portuguese, like the
// course titles the tutors author.
export function examLabel(
  exam: { scope: "module" | "final"; moduleId: Types.ObjectId | null },
  course: Pick<CourseDoc, "modules"> | null,
) {
  if (exam.scope === "final") {
    return "Atividade final";
  }

  const mod = course?.modules.find((item) => item._id.toString() === exam.moduleId?.toString());
  return `Módulo ${mod?.number ?? "?"}`;
}

export async function studentDetail(user: UserDoc): Promise<AdminStudentDetail> {
  const [row] = await studentRows([user]);
  const userId = user._id.toString();

  const [enrollments, questions] = await Promise.all([
    Enrollment.find({ userId: user._id, status: "active" }).sort({ createdAt: 1 }).lean(),
    Question.find({ userId: user._id }).sort({ createdAt: -1 }).lean() as Promise<QuestionDoc[]>,
  ]);

  const enrollmentDetails: AdminStudentDetail["enrollments"] = [];

  for (const enrollment of enrollments) {
    const loaded = await loadCourseStructure(enrollment.courseId);
    if (!loaded) {
      continue;
    }

    const { course, exams, structure } = loaded;
    const state = await loadStudentState(userId, course._id);

    enrollmentDetails.push({
      courseId: course._id.toString(),
      courseSlug: course.slug,
      courseTitle: pick(course.title, "pt"),
      enrolledAt: enrollment.createdAt.toISOString(),
      completedAt: iso(enrollment.completedAt),
      coursePct: progressPct(structure, state),
      completedLessons: structure.lessons.filter((lesson) => lessonCompleted(state, lesson.id)).length,
      lessonCount: structure.lessons.length,
      exams: exams.map((exam) => {
        const best = bestAttempt(state.attempts, exam._id.toString());
        return {
          examId: exam._id.toString(),
          label: examLabel(exam, course),
          state: !best ? "pendente" : best.passed ? "aprovado" : "reprovado",
          bestScorePct: best?.scorePct ?? null,
        };
      }),
    });
  }

  return {
    ...row,
    birthday: formatBirthday(user.birthday),
    photoUrl: photoUrlOf(user),
    tutorNotes: user.tutorNotes ?? "",
    enrollments: enrollmentDetails,
    questions: await questionRows(questions),
  };
}

export function adminLesson(lesson: LessonDoc, hasProgress: boolean): AdminLesson {
  return {
    id: lesson._id.toString(),
    moduleId: lesson.moduleId.toString(),
    number: lesson.number,
    title: lesson.title,
    description: lesson.description ?? { pt: "", en: "", es: "" },
    durationMinutes: lesson.durationMinutes ?? 0,
    video: {
      provider: lesson.video?.provider ?? "youtube",
      youtubeId: lesson.video?.youtubeId ?? "",
      bunnyVideoId: lesson.video?.bunnyVideoId ?? "",
    },
    materials: (lesson.materials ?? []).map((item) => ({ label: item.label, url: item.url })),
    published: Boolean(lesson.published),
    hasProgress,
  };
}

export function adminExam(exam: ExamFullDoc, attemptCount: number): AdminExam {
  return {
    id: exam._id.toString(),
    scope: exam.scope,
    moduleId: exam.moduleId ? exam.moduleId.toString() : null,
    passThreshold: exam.passThreshold,
    requiredToAdvance: Boolean(exam.requiredToAdvance),
    attemptCount,
    questions: exam.questions.map((question) => ({
      id: question._id.toString(),
      qtype: question.qtype,
      text: question.text,
      statementIsTrue: Boolean(question.statementIsTrue),
      explanation: question.explanation ?? { pt: "", en: "", es: "" },
      options: (question.options ?? []).map((option) => ({
        id: option._id.toString(),
        text: option.text,
        correct: Boolean(option.correct),
      })),
    })),
  };
}

export async function lessonHasProgress(lessonId: Types.ObjectId) {
  const [progress, question] = await Promise.all([
    LessonProgress.exists({ lessonId }),
    Question.exists({ lessonId }),
  ]);

  return Boolean(progress || question);
}

export async function adminCourseStructure(course: CourseDoc): Promise<AdminCourseStructure> {
  const courseId = course._id;

  const [lessons, exams, progressLessonIds, questionLessonIds, attemptCounts, others, enrolledCount] =
    await Promise.all([
      Lesson.find({ courseId }).sort({ number: 1 }).lean() as Promise<LessonDoc[]>,
      Exam.find({ courseId }).lean() as Promise<ExamFullDoc[]>,
      LessonProgress.distinct("lessonId", { courseId }) as Promise<Types.ObjectId[]>,
      // Same rule as `lessonHasProgress()` and the delete route: a question
      // under the lesson keeps it too.
      Question.distinct("lessonId", { courseId }) as Promise<Types.ObjectId[]>,
      ExamAttempt.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { courseId } },
        { $group: { _id: "$examId", count: { $sum: 1 } } },
      ]),
      Course.find({ _id: { $ne: courseId } })
        .sort({ order: 1 })
        .select("slug title")
        .lean() as Promise<{ _id: Types.ObjectId; slug: string; title: Localized }[]>,
      Enrollment.countDocuments({ courseId, status: "active" }),
    ]);

  const withProgress = new Set([...progressLessonIds, ...questionLessonIds].map((id) => id.toString()));
  const attemptsByExam = new Map(attemptCounts.map((row) => [row._id.toString(), row.count]));

  return {
    course: {
      id: courseId.toString(),
      slug: course.slug,
      title: course.title,
      description: course.description ?? { pt: "", en: "", es: "" },
      coverUrl: course.coverUrl ?? "",
      speaker: course.speaker ?? "",
      language: course.language ?? "pt",
      published: Boolean(course.published),
      starter: Boolean(course.starter),
      order: course.order ?? 0,
      prerequisites: (course.prerequisites ?? []).map((id) => id.toString()),
      modules: [...course.modules]
        .sort((a, b) => a.number - b.number)
        .map((mod) => ({ id: mod._id.toString(), number: mod.number, title: mod.title })),
    },
    lessons: lessons.map((lesson) => adminLesson(lesson, withProgress.has(lesson._id.toString()))),
    exams: exams.map((exam) => adminExam(exam, attemptsByExam.get(exam._id.toString()) ?? 0)),
    courseOptions: others.map((item) => ({
      id: item._id.toString(),
      slug: item.slug,
      title: pick(item.title, "pt"),
    })),
    enrolledCount,
    bunny: { upload: bunnyUploadConfigured(), playback: bunnyPlaybackConfigured() },
  };
}

// Keeps lesson numbers contiguous (1..N) after a move or a delete. `movedId`
// at `toNumber` wins its slot; everything else keeps its relative order.
export async function renumberLessons(
  courseId: Types.ObjectId,
  moved?: { id: Types.ObjectId; toNumber: number },
) {
  const lessons = (await Lesson.find({ courseId })
    .sort({ number: 1 })
    .select("_id number")
    .lean()) as { _id: Types.ObjectId; number: number }[];

  let ordered = lessons;
  if (moved) {
    const rest = lessons.filter((lesson) => !lesson._id.equals(moved.id));
    const target = Math.min(Math.max(moved.toNumber, 1), rest.length + 1) - 1;
    const movedLesson = lessons.find((lesson) => lesson._id.equals(moved.id));
    ordered = movedLesson ? [...rest.slice(0, target), movedLesson, ...rest.slice(target)] : rest;
  }

  const ops = ordered
    .map((lesson, index) => ({ lesson, number: index + 1 }))
    .filter(({ lesson, number }) => lesson.number !== number)
    .map(({ lesson, number }) => ({
      updateOne: { filter: { _id: lesson._id }, update: { $set: { number } } },
    }));

  if (ops.length) {
    await Lesson.bulkWrite(ops);
  }
}
