import { Types } from "mongoose";

import {
  courseCompleted,
  examUnlocked,
  bestAttempt,
  finalExam as pickFinalExam,
  finalUnlocked,
  lessonCompleted,
  lessonPlayable,
  moduleComplete,
  moduleExam,
  moduleLessons,
  moduleLessonsDone,
  moduleUnlocked,
  progressPct,
  type CourseStructure,
  type StudentState,
} from "@/lib/academy/gating";
import { signVideoUrl } from "@/lib/academy/bunny";
import type { CourseCard, CourseDetail, ExamSummary, LessonSummary } from "@/lib/academy/types";
import { getYoutubeThumbnailUrl } from "@/lib/academy/youtube";
import { isTranslated, pick, type Localized } from "@/lib/academy/localized";
import type { UserLanguage } from "@/lib/user-languages";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";
import { Exam } from "@/models/exam";
import { Lesson } from "@/models/lesson";
import { LessonProgress } from "@/models/lesson-progress";
import { ExamAttempt } from "@/models/exam-attempt";

// Database loaders shared by the student API, the panel and the seed script.
// They turn documents into the plain structures `gating.ts` reasons about,
// and into the wire shapes in `types.ts`.

export type CourseDoc = {
  _id: Types.ObjectId;
  slug: string;
  title: Localized;
  description: Localized;
  coverUrl: string;
  speaker: string;
  language: UserLanguage;
  published: boolean;
  starter: boolean;
  order: number;
  prerequisites: Types.ObjectId[];
  modules: { _id: Types.ObjectId; number: number; title: Localized }[];
};

export type LessonDoc = {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  number: number;
  title: Localized;
  description: Localized;
  durationMinutes: number;
  video: { provider: "youtube" | "bunny"; youtubeId: string; bunnyVideoId: string };
  materials: { label: string; url: string }[];
  published: boolean;
};

export type ExamDoc = {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  scope: "module" | "final";
  moduleId: Types.ObjectId | null;
  passThreshold: number;
  requiredToAdvance: boolean;
  questions: unknown[];
};

export async function loadCourseStructure(courseId: Types.ObjectId | string, course?: CourseDoc) {
  const id = typeof courseId === "string" ? new Types.ObjectId(courseId) : courseId;
  const courseDoc = course ?? ((await Course.findById(id).lean()) as CourseDoc | null);

  if (!courseDoc) {
    return null;
  }

  const [lessons, exams] = await Promise.all([
    Lesson.find({ courseId: id, published: true }).sort({ number: 1 }).lean() as Promise<LessonDoc[]>,
    Exam.find({ courseId: id }).lean() as Promise<ExamDoc[]>,
  ]);

  const structure: CourseStructure = {
    modules: [...courseDoc.modules]
      .sort((a, b) => a.number - b.number)
      .map((mod) => ({ id: mod._id.toString(), number: mod.number })),
    lessons: lessons.map((lesson) => ({
      id: lesson._id.toString(),
      moduleId: lesson.moduleId.toString(),
      number: lesson.number,
      published: lesson.published,
      durationMinutes: lesson.durationMinutes ?? 0,
    })),
    exams: exams.map((exam) => ({
      id: exam._id.toString(),
      scope: exam.scope,
      moduleId: exam.moduleId ? exam.moduleId.toString() : null,
      passThreshold: exam.passThreshold,
      requiredToAdvance: exam.requiredToAdvance,
      questionCount: exam.questions.length,
    })),
  };

  return { course: courseDoc, lessons, exams, structure };
}

export async function loadStudentState(
  userId: Types.ObjectId | string,
  courseId: Types.ObjectId | string,
): Promise<StudentState> {
  const [progress, attempts] = await Promise.all([
    LessonProgress.find({ userId, courseId }).lean(),
    ExamAttempt.find({ userId, courseId }).select("examId passed scorePct").lean(),
  ]);

  return {
    progress: progress.map((row) => ({
      lessonId: row.lessonId.toString(),
      percent: row.percent,
      maxPercent: row.maxPercent,
      completed: row.completed,
    })),
    attempts: attempts.map((row) => ({
      examId: row.examId.toString(),
      passed: row.passed,
      scorePct: row.scorePct,
    })),
  };
}

const EMPTY_STATE: StudentState = { progress: [], attempts: [] };

export async function loadEnrollment(userId: string, courseId: Types.ObjectId | string) {
  return Enrollment.findOne({ userId, courseId }).lean();
}

// A course with prerequisites exists for the student only once ANY ONE of
// them is completed. Tutors are exempt: they need to see everything.
export async function prerequisiteMet(
  course: CourseDoc,
  user: { id: string; role: "student" | "tutor" } | null,
) {
  if (course.prerequisites.length === 0) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (user.role === "tutor") {
    return true;
  }

  for (const prerequisiteId of course.prerequisites) {
    if (await isCourseCompleted(user.id, prerequisiteId)) {
      return true;
    }
  }

  return false;
}

export async function isCourseCompleted(userId: string, courseId: Types.ObjectId | string) {
  const enrollment = await Enrollment.findOne({ userId, courseId }).lean();

  if (!enrollment) {
    return false;
  }

  if (enrollment.completedAt) {
    return true;
  }

  if (enrollment.status !== "active") {
    return false;
  }

  const loaded = await loadCourseStructure(courseId);
  if (!loaded) {
    return false;
  }

  const state = await loadStudentState(userId, courseId);
  return courseCompleted(loaded.structure, state);
}

// Stamps `completedAt` the first time the course is found complete.
export async function recordCourseCompletion(userId: string, courseId: Types.ObjectId | string) {
  const enrollment = await Enrollment.findOne({ userId, courseId });

  if (!enrollment || enrollment.completedAt) {
    return false;
  }

  const loaded = await loadCourseStructure(courseId);
  if (!loaded) {
    return false;
  }

  const state = await loadStudentState(userId, courseId);
  if (!courseCompleted(loaded.structure, state)) {
    return false;
  }

  enrollment.completedAt = new Date();
  await enrollment.save();
  return true;
}

export function lessonThumbnail(lesson: LessonDoc): string | null {
  if (lesson.video?.provider === "bunny" && lesson.video.bunnyVideoId) {
    return signVideoUrl(lesson.video.bunnyVideoId)?.thumbnailUrl ?? null;
  }

  if (lesson.video?.youtubeId) {
    return getYoutubeThumbnailUrl(lesson.video.youtubeId);
  }

  return null;
}

export async function courseCard(
  course: CourseDoc,
  language: UserLanguage,
  user: { id: string; role: "student" | "tutor" } | null,
): Promise<CourseCard> {
  const loaded = await loadCourseStructure(course._id, course);
  const structure = loaded!.structure;
  const enrollment = user ? await loadEnrollment(user.id, course._id) : null;
  const enrolled = enrollment?.status === "active";
  const state = user && enrolled ? await loadStudentState(user.id, course._id) : EMPTY_STATE;
  const completed = Boolean(enrollment?.completedAt) || (enrolled && courseCompleted(structure, state));

  return {
    id: course._id.toString(),
    slug: course.slug,
    title: pick(course.title, language),
    description: pick(course.description, language),
    coverUrl: course.coverUrl ?? "",
    speaker: course.speaker ?? "",
    language: course.language,
    starter: Boolean(course.starter),
    order: course.order ?? 0,
    lessonCount: structure.lessons.length,
    totalMinutes: structure.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0),
    comingSoon: structure.lessons.length === 0,
    translated: isTranslated(course.title, language),
    myState: {
      enrolled,
      coursePct: enrolled ? progressPct(structure, state) : 0,
      completed,
      completedAt: enrollment?.completedAt ? enrollment.completedAt.toISOString() : null,
      unlocked: course.prerequisites.length > 0 && user?.role !== "tutor",
    },
  };
}

function examSummary(
  structure: CourseStructure,
  state: StudentState,
  examId: string,
  enrolled: boolean,
): ExamSummary | null {
  const exam = structure.exams.find((item) => item.id === examId);
  if (!exam) {
    return null;
  }

  const best = bestAttempt(state.attempts, exam.id);
  const gate = examUnlocked(structure, state, exam, enrolled);

  return {
    id: exam.id,
    scope: exam.scope,
    questionCount: exam.questionCount,
    passThreshold: exam.passThreshold,
    requiredToAdvance: exam.requiredToAdvance,
    attempted: Boolean(best),
    passed: best?.passed ?? false,
    bestScorePct: best?.scorePct ?? null,
    unlocked: gate.unlocked,
    lockReason: gate.unlocked ? null : gate.reason,
  };
}

export async function courseDetail(
  course: CourseDoc,
  language: UserLanguage,
  user: { id: string; role: "student" | "tutor" } | null,
): Promise<CourseDetail> {
  const card = await courseCard(course, language, user);
  const loaded = (await loadCourseStructure(course._id, course))!;
  const { structure, lessons } = loaded;
  const enrolled = card.myState.enrolled;
  const state = user && enrolled ? await loadStudentState(user.id, course._id) : EMPTY_STATE;
  const tutorView = user?.role === "tutor";

  const modules = structure.modules.map((mod, index) => {
    const moduleDoc = course.modules.find((item) => item._id.toString() === mod.id)!;
    const unlocked = tutorView || (enrolled && moduleUnlocked(structure, state, index));
    const exam = moduleExam(structure, mod.id);

    const lessonSummaries: LessonSummary[] = moduleLessons(structure, mod.id).map((lesson) => {
      const doc = lessons.find((item) => item._id.toString() === lesson.id)!;
      const row = state.progress.find((item) => item.lessonId === lesson.id);
      const gate = tutorView
        ? ({ playable: true } as const)
        : lessonPlayable(structure, state, lesson, enrolled);

      return {
        id: lesson.id,
        number: lesson.number,
        title: pick(doc.title, language),
        description: pick(doc.description, language),
        durationMinutes: lesson.durationMinutes,
        thumbnailUrl: lessonThumbnail(doc),
        completed: card.myState.completed || Boolean(row?.completed),
        percent: row?.percent ?? 0,
        maxPercent: row?.maxPercent ?? 0,
        playable: gate.playable,
        lockReason: gate.playable ? null : gate.reason,
      };
    });

    const summary = exam ? examSummary(structure, state, exam.id, enrolled || tutorView) : null;
    if (summary && tutorView) {
      summary.unlocked = true;
      summary.lockReason = null;
    }

    return {
      id: mod.id,
      number: mod.number,
      title: pick(moduleDoc.title, language),
      unlocked,
      lessonsDone: moduleLessonsDone(structure, state, mod.id),
      complete: moduleComplete(structure, state, index),
      exam: summary,
      lessons: lessonSummaries,
    };
  });

  const final = pickFinalExam(structure);
  const finalSummary = final ? examSummary(structure, state, final.id, enrolled || tutorView) : null;
  if (finalSummary && tutorView) {
    finalSummary.unlocked = true;
    finalSummary.lockReason = null;
  }

  const unlocks =
    card.myState.completed || tutorView
      ? ((await Course.find({ published: true, prerequisites: course._id })
          .select("slug title")
          .lean()) as { slug: string; title: Localized }[]).map((item) => ({
          slug: item.slug,
          title: pick(item.title, language),
        }))
      : [];

  return {
    ...card,
    modules,
    finalExam: finalSummary,
    myState: {
      ...card.myState,
      finalUnlocked: tutorView || finalUnlocked(structure, state),
      completedLessonCount: structure.lessons.filter((lesson) => lessonCompleted(state, lesson.id)).length,
    },
    unlocks,
  };
}
