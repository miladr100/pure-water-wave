// Pure gating and completion rules, ported from the FFPUM academy
// (`lib/academy/gating.ts` there). No database access here: callers load the
// course structure and the student's rows and pass them in, so the same
// rules serve the API, the panel and the seed script.

export type StructureLesson = {
  id: string;
  moduleId: string;
  number: number;
  published: boolean;
  durationMinutes: number;
};

export type StructureModule = {
  id: string;
  number: number;
};

export type StructureExam = {
  id: string;
  scope: "module" | "final";
  moduleId: string | null;
  passThreshold: number;
  requiredToAdvance: boolean;
  questionCount: number;
};

export type CourseStructure = {
  modules: StructureModule[];
  // Published lessons only, sorted by number.
  lessons: StructureLesson[];
  exams: StructureExam[];
};

export type ProgressRow = {
  lessonId: string;
  percent: number;
  maxPercent: number;
  completed: boolean;
};

export type AttemptRow = {
  examId: string;
  passed: boolean;
  scorePct: number;
};

export type StudentState = {
  progress: ProgressRow[];
  attempts: AttemptRow[];
};

export const LESSON_COMPLETE_PCT = 95;
export const LESSON_COMPLETE_TAIL_SEC = 20;

// A lesson counts as watched when the player reports the end, or when the
// high-water mark is within the last 5% and (if we know the real duration)
// within the last 20 seconds — long credits should not block a student.
export function lessonReachedEnd(input: {
  ended?: boolean;
  maxPercent: number;
  maxSeconds?: number | null;
  durationSeconds?: number | null;
}) {
  if (input.ended) {
    return true;
  }

  if (input.maxPercent < LESSON_COMPLETE_PCT) {
    return false;
  }

  const hasSeconds =
    typeof input.maxSeconds === "number" &&
    typeof input.durationSeconds === "number" &&
    input.durationSeconds > 0;

  if (!hasSeconds) {
    return true;
  }

  return input.durationSeconds! - input.maxSeconds! <= LESSON_COMPLETE_TAIL_SEC;
}

// A passed attempt beats a failed one; between equal pass states the higher
// score wins. Retries are unlimited, so the best attempt is what gates.
export function bestAttempt(attempts: AttemptRow[], examId: string): AttemptRow | null {
  let best: AttemptRow | null = null;

  for (const attempt of attempts) {
    if (attempt.examId !== examId) {
      continue;
    }

    if (
      !best ||
      (attempt.passed && !best.passed) ||
      (attempt.passed === best.passed && attempt.scorePct > best.scorePct)
    ) {
      best = attempt;
    }
  }

  return best;
}

export function examCounts(exam: StructureExam) {
  return exam.scope === "final" || exam.requiredToAdvance;
}

export function moduleExam(structure: CourseStructure, moduleId: string) {
  return structure.exams.find((exam) => exam.scope === "module" && exam.moduleId === moduleId) ?? null;
}

export function finalExam(structure: CourseStructure) {
  return structure.exams.find((exam) => exam.scope === "final") ?? null;
}

export function moduleLessons(structure: CourseStructure, moduleId: string) {
  return structure.lessons.filter((lesson) => lesson.moduleId === moduleId);
}

export function lessonCompleted(state: StudentState, lessonId: string) {
  return state.progress.some((row) => row.lessonId === lessonId && row.completed);
}

export function examPassed(state: StudentState, examId: string) {
  return bestAttempt(state.attempts, examId)?.passed ?? false;
}

export function moduleLessonsDone(structure: CourseStructure, state: StudentState, moduleId: string) {
  const lessons = moduleLessons(structure, moduleId);
  return lessons.length > 0 && lessons.every((lesson) => lessonCompleted(state, lesson.id));
}

// The first module is always open. Each later module opens when the previous
// module's activity is passed — or, if that module has no required activity,
// when the previous module itself was open. Lessons of the previous module
// are not required, only its activity.
export function moduleUnlocked(
  structure: CourseStructure,
  state: StudentState,
  moduleIndex: number,
): boolean {
  if (moduleIndex <= 0) {
    return true;
  }

  const previous = structure.modules[moduleIndex - 1];
  if (!previous) {
    return true;
  }

  const exam = moduleExam(structure, previous.id);
  if (!exam || !exam.requiredToAdvance) {
    return moduleUnlocked(structure, state, moduleIndex - 1);
  }

  return examPassed(state, exam.id);
}

export function moduleComplete(structure: CourseStructure, state: StudentState, moduleIndex: number) {
  const mod = structure.modules[moduleIndex];
  if (!mod) {
    return false;
  }

  if (!moduleLessonsDone(structure, state, mod.id)) {
    return false;
  }

  const exam = moduleExam(structure, mod.id);
  if (!exam || !examCounts(exam)) {
    return true;
  }

  return examPassed(state, exam.id);
}

export function finalUnlocked(structure: CourseStructure, state: StudentState) {
  return (
    structure.modules.length > 0 &&
    structure.modules.every((_, index) => moduleComplete(structure, state, index))
  );
}

export function courseCompleted(structure: CourseStructure, state: StudentState) {
  const allModules = finalUnlocked(structure, state);
  const final = finalExam(structure);

  if (!final) {
    return allModules;
  }

  return allModules && examPassed(state, final.id);
}

// Same formula everywhere: lessons watched plus counted activities passed,
// over lessons plus counted activities.
export function progressPct(structure: CourseStructure, state: StudentState) {
  const counted = structure.exams.filter(examCounts);
  const total = structure.lessons.length + counted.length;

  if (total === 0) {
    return 0;
  }

  const lessonsDone = structure.lessons.filter((lesson) => lessonCompleted(state, lesson.id)).length;
  const examsPassed = counted.filter((exam) => examPassed(state, exam.id)).length;

  return Math.min(100, Math.round(((lessonsDone + examsPassed) / total) * 100));
}

export type LockReason =
  | "not_enrolled"
  | "module_locked"
  | "lessons_incomplete"
  | "modules_incomplete"
  | "module_missing";

export function lessonPlayable(
  structure: CourseStructure,
  state: StudentState,
  lesson: StructureLesson,
  enrolled: boolean,
): { playable: true } | { playable: false; reason: LockReason } {
  if (!enrolled) {
    return { playable: false, reason: "not_enrolled" };
  }

  const moduleIndex = structure.modules.findIndex((mod) => mod.id === lesson.moduleId);
  if (moduleIndex < 0) {
    return { playable: false, reason: "module_missing" };
  }

  if (!moduleUnlocked(structure, state, moduleIndex)) {
    return { playable: false, reason: "module_locked" };
  }

  return { playable: true };
}

export function examUnlocked(
  structure: CourseStructure,
  state: StudentState,
  exam: StructureExam,
  enrolled: boolean,
): { unlocked: true } | { unlocked: false; reason: LockReason } {
  if (!enrolled) {
    return { unlocked: false, reason: "not_enrolled" };
  }

  if (exam.scope === "final") {
    return finalUnlocked(structure, state)
      ? { unlocked: true }
      : { unlocked: false, reason: "modules_incomplete" };
  }

  const moduleIndex = structure.modules.findIndex((mod) => mod.id === exam.moduleId);
  if (moduleIndex < 0) {
    return { unlocked: false, reason: "module_missing" };
  }

  if (!moduleUnlocked(structure, state, moduleIndex)) {
    return { unlocked: false, reason: "module_locked" };
  }

  if (!moduleLessonsDone(structure, state, structure.modules[moduleIndex].id)) {
    return { unlocked: false, reason: "lessons_incomplete" };
  }

  return { unlocked: true };
}

// What the student should do after passing an activity.
export function nextAfterPass(
  structure: CourseStructure,
  state: StudentState,
  exam: StructureExam,
): {
  courseCompleted?: boolean;
  nextModuleNumber?: number;
  nextLessonId?: string;
  nextLessonNumber?: number;
  finalExamId?: string;
} {
  if (exam.scope === "final") {
    return { courseCompleted: true };
  }

  const moduleIndex = structure.modules.findIndex((mod) => mod.id === exam.moduleId);
  const next = structure.modules[moduleIndex + 1];

  if (next) {
    const firstLesson = moduleLessons(structure, next.id)[0];
    return {
      nextModuleNumber: next.number,
      nextLessonId: firstLesson?.id,
      nextLessonNumber: firstLesson?.number,
    };
  }

  const final = finalExam(structure);
  if (final) {
    return { finalExamId: final.id };
  }

  return { courseCompleted: true };
}
