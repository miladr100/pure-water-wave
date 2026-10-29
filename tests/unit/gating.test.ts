import { describe, expect, it } from "vitest";

import {
  bestAttempt,
  courseCompleted,
  examCounts,
  examUnlocked,
  finalUnlocked,
  lessonPlayable,
  lessonReachedEnd,
  moduleComplete,
  moduleLessonsDone,
  moduleUnlocked,
  nextAfterPass,
  progressPct,
  type AttemptRow,
  type CourseStructure,
  type StructureExam,
  type StructureLesson,
  type StudentState,
} from "@/lib/academy/gating";

function lesson(id: string, moduleId: string, number: number): StructureLesson {
  return { id, moduleId, number, published: true, durationMinutes: 10 };
}

function exam(
  id: string,
  scope: "module" | "final",
  moduleId: string | null,
  overrides: Partial<StructureExam> = {},
): StructureExam {
  return {
    id,
    scope,
    moduleId,
    passThreshold: 70,
    requiredToAdvance: true,
    questionCount: 3,
    ...overrides,
  };
}

// Two modules with one required activity each, plus a final exam.
function twoModuleCourse(overrides: Partial<CourseStructure> = {}): CourseStructure {
  return {
    modules: [
      { id: "m1", number: 1 },
      { id: "m2", number: 2 },
    ],
    lessons: [lesson("l1", "m1", 1), lesson("l2", "m1", 2), lesson("l3", "m2", 1)],
    exams: [exam("e1", "module", "m1"), exam("e2", "module", "m2"), exam("final", "final", null)],
    ...overrides,
  };
}

function state(done: string[] = [], passedExams: string[] = []): StudentState {
  return {
    progress: done.map((lessonId) => ({ lessonId, percent: 100, maxPercent: 100, completed: true })),
    attempts: passedExams.map((examId) => ({ examId, passed: true, scorePct: 100 })),
  };
}

const EMPTY = state();

describe("lessonReachedEnd", () => {
  it("counts a lesson the player reported as ended regardless of the percentage", () => {
    expect(lessonReachedEnd({ ended: true, maxPercent: 10 })).toBe(true);
  });

  it("rejects a high-water mark under 95 percent", () => {
    expect(lessonReachedEnd({ maxPercent: 94.9 })).toBe(false);
  });

  it("accepts 95 percent when the real duration is unknown", () => {
    expect(lessonReachedEnd({ maxPercent: 95 })).toBe(true);
    expect(lessonReachedEnd({ maxPercent: 95, maxSeconds: 950, durationSeconds: null })).toBe(true);
    expect(lessonReachedEnd({ maxPercent: 95, maxSeconds: 950, durationSeconds: 0 })).toBe(true);
  });

  it("rejects 95 percent when more than 20 seconds of a known duration remain", () => {
    expect(lessonReachedEnd({ maxPercent: 96, maxSeconds: 960, durationSeconds: 1000 })).toBe(false);
  });

  it("accepts 95 percent when at most 20 seconds remain", () => {
    expect(lessonReachedEnd({ maxPercent: 98, maxSeconds: 980, durationSeconds: 1000 })).toBe(true);
    expect(lessonReachedEnd({ maxPercent: 99, maxSeconds: 1000, durationSeconds: 1000 })).toBe(true);
  });
});

describe("bestAttempt", () => {
  const attempts: AttemptRow[] = [
    { examId: "e1", passed: false, scorePct: 90 },
    { examId: "e1", passed: true, scorePct: 70 },
    { examId: "e1", passed: true, scorePct: 80 },
    { examId: "e2", passed: false, scorePct: 10 },
    { examId: "e2", passed: false, scorePct: 40 },
  ];

  it("prefers a passed attempt over a failed one with a higher score", () => {
    expect(bestAttempt(attempts, "e1")).toEqual({ examId: "e1", passed: true, scorePct: 80 });
  });

  it("picks the higher score among attempts with the same outcome", () => {
    expect(bestAttempt(attempts, "e2")).toEqual({ examId: "e2", passed: false, scorePct: 40 });
  });

  it("returns null when the exam was never attempted", () => {
    expect(bestAttempt(attempts, "e3")).toBeNull();
    expect(bestAttempt([], "e1")).toBeNull();
  });
});

describe("examCounts", () => {
  it("counts a final exam even when it is not required to advance", () => {
    expect(examCounts(exam("f", "final", null, { requiredToAdvance: false }))).toBe(true);
  });

  it("counts a module exam only when it is required to advance", () => {
    expect(examCounts(exam("e", "module", "m1", { requiredToAdvance: true }))).toBe(true);
    expect(examCounts(exam("e", "module", "m1", { requiredToAdvance: false }))).toBe(false);
  });
});

describe("moduleUnlocked", () => {
  it("always opens the first module", () => {
    expect(moduleUnlocked(twoModuleCourse(), EMPTY, 0)).toBe(true);
  });

  it("opens a module only when the previous required activity is passed", () => {
    const course = twoModuleCourse();
    expect(moduleUnlocked(course, EMPTY, 1)).toBe(false);
    // Watching the lessons is not enough: only the activity gates.
    expect(moduleUnlocked(course, state(["l1", "l2"]), 1)).toBe(false);
    expect(moduleUnlocked(course, state([], ["e1"]), 1)).toBe(true);
  });

  it("falls through to the previous module when its activity is not required", () => {
    const course: CourseStructure = {
      modules: [
        { id: "m1", number: 1 },
        { id: "m2", number: 2 },
        { id: "m3", number: 3 },
      ],
      lessons: [],
      exams: [exam("e1", "module", "m1"), exam("e2", "module", "m2", { requiredToAdvance: false })],
    };
    expect(moduleUnlocked(course, EMPTY, 2)).toBe(false);
    expect(moduleUnlocked(course, state([], ["e1"]), 2)).toBe(true);
  });

  it("falls through to the previous module when it has no activity at all", () => {
    const course: CourseStructure = {
      modules: [
        { id: "m1", number: 1 },
        { id: "m2", number: 2 },
        { id: "m3", number: 3 },
      ],
      lessons: [],
      exams: [exam("e1", "module", "m1")],
    };
    expect(moduleUnlocked(course, EMPTY, 2)).toBe(false);
    expect(moduleUnlocked(course, state([], ["e1"]), 2)).toBe(true);
  });

  it("opens a module whose previous index does not exist", () => {
    expect(moduleUnlocked(twoModuleCourse({ modules: [] }), EMPTY, 3)).toBe(true);
  });
});

describe("moduleLessonsDone", () => {
  it("is false for a module with no published lessons", () => {
    const course = twoModuleCourse({ modules: [{ id: "m1", number: 1 }, { id: "empty", number: 2 }] });
    expect(moduleLessonsDone(course, state(["l1", "l2", "l3"]), "empty")).toBe(false);
  });

  it("requires every lesson of the module and ignores other modules", () => {
    const course = twoModuleCourse();
    expect(moduleLessonsDone(course, state(["l1"]), "m1")).toBe(false);
    expect(moduleLessonsDone(course, state(["l1", "l2"]), "m1")).toBe(true);
    expect(moduleLessonsDone(course, state(["l1", "l2"]), "m2")).toBe(false);
  });

  it("ignores progress rows that are not completed", () => {
    const course = twoModuleCourse();
    const partial: StudentState = {
      progress: [
        { lessonId: "l1", percent: 100, maxPercent: 100, completed: true },
        { lessonId: "l2", percent: 99, maxPercent: 99, completed: false },
      ],
      attempts: [],
    };
    expect(moduleLessonsDone(course, partial, "m1")).toBe(false);
  });
});

describe("moduleComplete", () => {
  it("is false for an index without a module", () => {
    expect(moduleComplete(twoModuleCourse(), state(["l1", "l2", "l3"], ["e1", "e2"]), 5)).toBe(false);
  });

  it("needs the lessons and the counted activity", () => {
    const course = twoModuleCourse();
    expect(moduleComplete(course, state(["l1", "l2"]), 0)).toBe(false);
    expect(moduleComplete(course, state([], ["e1"]), 0)).toBe(false);
    expect(moduleComplete(course, state(["l1", "l2"], ["e1"]), 0)).toBe(true);
  });

  it("needs only the lessons when the activity is optional or missing", () => {
    const optional = twoModuleCourse({ exams: [exam("e1", "module", "m1", { requiredToAdvance: false })] });
    expect(moduleComplete(optional, state(["l1", "l2"]), 0)).toBe(true);

    const none = twoModuleCourse({ exams: [] });
    expect(moduleComplete(none, state(["l1", "l2"]), 0)).toBe(true);
  });
});

describe("finalUnlocked", () => {
  it("opens once every module is complete", () => {
    const course = twoModuleCourse();
    expect(finalUnlocked(course, state(["l1", "l2", "l3"], ["e1"]))).toBe(false);
    expect(finalUnlocked(course, state(["l1", "l2", "l3"], ["e1", "e2"]))).toBe(true);
  });

  it("never opens for a course without modules", () => {
    expect(finalUnlocked(twoModuleCourse({ modules: [], lessons: [], exams: [] }), EMPTY)).toBe(false);
  });
});

describe("courseCompleted", () => {
  it("needs the final exam passed when the course has one", () => {
    const course = twoModuleCourse();
    const allModules = state(["l1", "l2", "l3"], ["e1", "e2"]);
    expect(courseCompleted(course, allModules)).toBe(false);
    expect(courseCompleted(course, state(["l1", "l2", "l3"], ["e1", "e2", "final"]))).toBe(true);
  });

  it("is complete when every module is complete and there is no final exam", () => {
    const course = twoModuleCourse({ exams: [exam("e1", "module", "m1"), exam("e2", "module", "m2")] });
    expect(courseCompleted(course, state(["l1", "l2", "l3"], ["e1", "e2"]))).toBe(true);
    expect(courseCompleted(course, state(["l1", "l2", "l3"], ["e1"]))).toBe(false);
  });
});

describe("progressPct", () => {
  it("is 0 for a course with nothing to count", () => {
    expect(progressPct(twoModuleCourse({ lessons: [], exams: [] }), EMPTY)).toBe(0);
  });

  it("divides lessons watched plus counted activities passed by their total", () => {
    // 3 lessons + 3 counted exams = 6; 2 lessons + 1 exam done = 3/6.
    expect(progressPct(twoModuleCourse(), state(["l1", "l2"], ["e1"]))).toBe(50);
  });

  it("leaves optional module activities out of both sides of the ratio", () => {
    const course = twoModuleCourse({
      exams: [exam("e1", "module", "m1", { requiredToAdvance: false }), exam("final", "final", null)],
    });
    // 3 lessons + final = 4; passing the optional e1 adds nothing.
    expect(progressPct(course, state(["l1", "l2"], ["e1"]))).toBe(50);
    expect(progressPct(course, state(["l1", "l2", "l3"], ["e1", "final"]))).toBe(100);
  });

  it("rounds to the nearest integer", () => {
    // 1 of 6 = 16.67 -> 17; 2 of 6 = 33.33 -> 33.
    expect(progressPct(twoModuleCourse(), state(["l1"]))).toBe(17);
    expect(progressPct(twoModuleCourse(), state(["l1", "l2"]))).toBe(33);
  });

  it("caps at 100 even with stray progress rows", () => {
    const course = twoModuleCourse();
    const full = state(["l1", "l2", "l3", "l1", "ghost"], ["e1", "e2", "final"]);
    expect(progressPct(course, full)).toBe(100);
  });
});

describe("lessonPlayable", () => {
  const course = twoModuleCourse();

  it("refuses a student who is not enrolled", () => {
    expect(lessonPlayable(course, state([], ["e1"]), course.lessons[2], false)).toEqual({
      playable: false,
      reason: "not_enrolled",
    });
  });

  it("refuses a lesson whose module is not in the course", () => {
    expect(lessonPlayable(course, EMPTY, lesson("x", "m9", 1), true)).toEqual({
      playable: false,
      reason: "module_missing",
    });
  });

  it("refuses a lesson of a locked module", () => {
    expect(lessonPlayable(course, EMPTY, course.lessons[2], true)).toEqual({
      playable: false,
      reason: "module_locked",
    });
  });

  it("allows a lesson of an open module", () => {
    expect(lessonPlayable(course, EMPTY, course.lessons[0], true)).toEqual({ playable: true });
    expect(lessonPlayable(course, state([], ["e1"]), course.lessons[2], true)).toEqual({ playable: true });
  });
});

describe("examUnlocked", () => {
  const course = twoModuleCourse();
  const [e1, e2, final] = course.exams;

  it("refuses a student who is not enrolled", () => {
    expect(examUnlocked(course, state(["l1", "l2"]), e1, false)).toEqual({
      unlocked: false,
      reason: "not_enrolled",
    });
  });

  it("refuses an exam of a module that is not in the course", () => {
    expect(examUnlocked(course, EMPTY, exam("x", "module", "m9"), true)).toEqual({
      unlocked: false,
      reason: "module_missing",
    });
  });

  it("refuses the exam of a locked module", () => {
    expect(examUnlocked(course, state(["l3"]), e2, true)).toEqual({
      unlocked: false,
      reason: "module_locked",
    });
  });

  it("refuses the exam until every lesson of the module is watched", () => {
    expect(examUnlocked(course, state(["l1"]), e1, true)).toEqual({
      unlocked: false,
      reason: "lessons_incomplete",
    });
    expect(examUnlocked(course, state(["l1", "l2"]), e1, true)).toEqual({ unlocked: true });
  });

  it("refuses the final exam until every module is complete", () => {
    expect(examUnlocked(course, state(["l1", "l2", "l3"], ["e1"]), final, true)).toEqual({
      unlocked: false,
      reason: "modules_incomplete",
    });
    expect(examUnlocked(course, state(["l1", "l2", "l3"], ["e1", "e2"]), final, true)).toEqual({
      unlocked: true,
    });
  });
});

describe("nextAfterPass", () => {
  it("completes the course after the final exam", () => {
    const course = twoModuleCourse();
    expect(nextAfterPass(course, EMPTY, course.exams[2])).toEqual({ courseCompleted: true });
  });

  it("points to the first lesson of the next module", () => {
    const course = twoModuleCourse();
    expect(nextAfterPass(course, EMPTY, course.exams[0])).toEqual({
      nextModuleNumber: 2,
      nextLessonId: "l3",
      nextLessonNumber: 1,
    });
  });

  it("names the next module even when it has no lessons yet", () => {
    const course = twoModuleCourse({ lessons: [lesson("l1", "m1", 1)] });
    expect(nextAfterPass(course, EMPTY, course.exams[0])).toEqual({
      nextModuleNumber: 2,
      nextLessonId: undefined,
      nextLessonNumber: undefined,
    });
  });

  it("points to the final exam after the last module", () => {
    const course = twoModuleCourse();
    expect(nextAfterPass(course, EMPTY, course.exams[1])).toEqual({ finalExamId: "final" });
  });

  it("completes the course after the last module when there is no final exam", () => {
    const course = twoModuleCourse({ exams: [exam("e1", "module", "m1"), exam("e2", "module", "m2")] });
    expect(nextAfterPass(course, EMPTY, course.exams[1])).toEqual({ courseCompleted: true });
  });
});
