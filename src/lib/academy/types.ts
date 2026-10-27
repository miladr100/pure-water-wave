// The contract between the API routes (`src/app/api/academia`, `/api/admin`)
// and the screens. Everything a screen renders comes in one of these shapes;
// correct answers never do.

import type { Localized } from "@/lib/academy/localized";
import type { UserLanguage } from "@/lib/user-languages";
import type { AcademyRole } from "@/lib/academy/roles";
import type { AppTheme } from "@/lib/theme";
import type { QuestionType } from "@/models/exam";
import type { VideoProvider } from "@/models/lesson";

export type LockReason =
  | "not_enrolled"
  | "module_locked"
  | "lessons_incomplete"
  | "modules_incomplete"
  | "module_missing";

// ---------- student side ----------

export type CourseCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string;
  speaker: string;
  language: UserLanguage;
  starter: boolean;
  order: number;
  lessonCount: number;
  totalMinutes: number;
  comingSoon: boolean;
  translated: boolean;
  myState: {
    enrolled: boolean;
    coursePct: number;
    completed: boolean;
    completedAt: string | null;
    // true when the course has prerequisites: a student only ever sees such
    // a course once one of them is completed, so it reads "desbloqueado"
    unlocked: boolean;
  };
};

export type LessonSummary = {
  id: string;
  number: number;
  title: string;
  description: string;
  durationMinutes: number;
  thumbnailUrl: string | null;
  completed: boolean;
  percent: number;
  maxPercent: number;
  playable: boolean;
  lockReason: LockReason | null;
};

export type ExamSummary = {
  id: string;
  scope: "module" | "final";
  questionCount: number;
  passThreshold: number;
  requiredToAdvance: boolean;
  attempted: boolean;
  passed: boolean;
  bestScorePct: number | null;
  unlocked: boolean;
  lockReason: LockReason | null;
};

export type ModuleDetail = {
  id: string;
  number: number;
  title: string;
  unlocked: boolean;
  lessonsDone: boolean;
  complete: boolean;
  exam: ExamSummary | null;
  lessons: LessonSummary[];
};

export type CourseDetail = CourseCard & {
  modules: ModuleDetail[];
  finalExam: ExamSummary | null;
  myState: CourseCard["myState"] & {
    finalUnlocked: boolean;
    completedLessonCount: number;
  };
  // Published courses that open once this one is completed (named only after
  // completion, like the FFPUM "desbloqueos").
  unlocks: { slug: string; title: string }[];
};

export type CourseLocked = {
  error: "course_locked";
  course: { slug: string; title: string; coverUrl: string };
  prerequisites: { slug: string; title: string }[];
};

export type VideoPlayback =
  | {
      provider: "youtube";
      youtubeId: string;
      resume: { percent: number } | null;
      completedBefore: boolean;
      maxPercent: number;
      durationMinutes: number;
    }
  | {
      provider: "bunny";
      url: string;
      authQuery: string;
      expiresAt: number;
      resume: { percent: number } | null;
      completedBefore: boolean;
      maxPercent: number;
      durationMinutes: number;
    };

export type LessonPlayerData = {
  lesson: {
    id: string;
    number: number;
    title: string;
    description: string;
    durationMinutes: number;
    materials: { label: string; url: string }[];
    moduleId: string;
    moduleNumber: number;
    moduleTitle: string;
  };
  course: { id: string; slug: string; title: string };
  video: VideoPlayback;
  // Where to go when the video ends.
  next:
    | { kind: "lesson"; lessonId: string; lessonNumber: number; lessonTitle: string }
    | { kind: "module-exam"; examId: string }
    | { kind: "final-exam"; examId: string }
    | { kind: "course-complete" }
    | { kind: "none" };
};

export type ProgressBody = {
  lessonId: string;
  percent: number;
  ended?: boolean;
  maxPercent?: number;
  maxSeconds?: number;
  durationSeconds?: number;
};

export type StudentQuestion = {
  id: string;
  qtype: QuestionType;
  text: string;
  options: string[];
};

export type StudentExam = {
  id: string;
  scope: "module" | "final";
  courseSlug: string;
  courseTitle: string;
  moduleNumber: number | null;
  moduleTitle: string | null;
  passThreshold: number;
  requiredToAdvance: boolean;
  questionCount: number;
  mcCount: number;
  textCount: number;
  reflectionCount: number;
  requiredCount: number;
  unlocked: boolean;
  lockReason: LockReason | null;
  questions: StudentQuestion[];
};

export type AttemptResult = {
  id: string;
  scorePct: number;
  mcCorrect: number;
  mcTotal: number;
  passed: boolean;
  passThreshold: number;
  submittedAt: string;
  answers: Record<string, number[] | string>;
  detail: Record<string, boolean | "pending">;
  // The questions as they were when answered (from the snapshot).
  questions: StudentQuestion[];
  correct: Record<string, number[]>;
  explanations: Record<string, string>;
  reviews: {
    questionId: string;
    reviewed: boolean;
    reflection: boolean;
    feedback: string;
    gradedBy: string;
    gradedAt: string | null;
  }[];
  pendingReviewCount: number;
};

export type NextAfterPass = {
  courseCompleted?: boolean;
  nextModuleNumber?: number;
  nextLessonId?: string;
  nextLessonNumber?: number;
  finalExamId?: string;
};

export type ExamResponse = {
  exam: StudentExam;
  result: AttemptResult | null;
  next: NextAfterPass;
};

export type LessonQuestion = {
  id: string;
  text: string;
  status: "answered" | "pending";
  createdAt: string;
  courseId: string;
  courseSlug: string;
  lessonId: string;
  lessonNumber: number;
  courseTitle: string;
  lessonLabel: string;
  answer: { text: string; by: string; at: string; seen: boolean } | null;
};

export type TutorCard = { id: string; fullName: string; country: string; photoUrl: string | null };

export type MeProfile = {
  id: string;
  fullName: string;
  email: string;
  role: AcademyRole;
  language: UserLanguage;
  country: string;
  city: string;
  phone: string;
  // ISO date (yyyy-mm-dd) or null
  birthday: string | null;
  // `/api/academia/foto/<id>?v=<ts>` or null when there is no photo
  photoUrl: string | null;
  theme: AppTheme;
  showOtherLanguage: boolean;
  tutor: TutorCard | null;
  createdAt: string;
};

// PATCH /api/academia/me: every field optional; the server validates each
// and answers 400 `{ error: "validation", fields: { <name>: <code> } }`.
export type ProfilePatchBody = {
  fullName?: string;
  country?: string;
  city?: string;
  phone?: string;
  birthday?: string | null;
  language?: UserLanguage;
  theme?: AppTheme;
  showOtherLanguage?: boolean;
  // null detaches the tutor
  assignedTutorId?: string | null;
};

export type MeResponse = {
  profile: MeProfile;
  enrollments: (CourseCard & { enrolledAt: string })[];
  continueLesson: {
    lessonId: string;
    lessonNumber: number;
    lessonTitle: string;
    durationMinutes: number;
    percent: number;
    courseSlug: string;
    courseTitle: string;
    coverUrl: string;
    thumbnailUrl: string | null;
  } | null;
  notifications: {
    questionId: string;
    text: string;
    courseSlug: string;
    lessonId: string;
    lessonLabel: string;
    answeredBy: string;
    answeredAt: string;
    seen: boolean;
  }[];
  unreadCount: number;
};

// ---------- tutor (admin) side ----------

export type AdminOverview = {
  students: number;
  tutors: number;
  publishedCourses: number;
  openQuestions: number;
  pendingGrading: number;
  pendingFirstContact: number;
  recentStudents: AdminStudentRow[];
  recentQuestions: AdminQuestionRow[];
};

export type AdminStudentRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  language: UserLanguage;
  role: AcademyRole;
  createdAt: string;
  lastSeenAt: string | null;
  firstContactAt: string | null;
  tutor: { id: string; fullName: string } | null;
  enrollmentCount: number;
  completedCount: number;
};

export type AdminStudentDetail = AdminStudentRow & {
  birthday: string | null;
  photoUrl: string | null;
  tutorNotes: string;
  enrollments: {
    courseId: string;
    courseSlug: string;
    courseTitle: string;
    enrolledAt: string;
    completedAt: string | null;
    coursePct: number;
    completedLessons: number;
    lessonCount: number;
    exams: {
      examId: string;
      label: string;
      state: "aprovado" | "reprovado" | "pendente";
      bestScorePct: number | null;
    }[];
  }[];
  questions: AdminQuestionRow[];
};

export type AdminQuestionRow = {
  id: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  lessonLabel: string;
  text: string;
  answer: string;
  answeredBy: string;
  answeredAt: string | null;
  status: "open" | "answered" | "archived";
  createdAt: string;
};

export type AdminGradingRow = {
  attemptId: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  examLabel: string;
  submittedAt: string;
  reviews: {
    questionId: string;
    questionText: string;
    reflection: boolean;
    answer: string;
    reviewed: boolean;
    feedback: string;
    gradedBy: string;
    gradedAt: string | null;
  }[];
};

export type AdminCourseRow = {
  id: string;
  slug: string;
  title: Localized;
  language: UserLanguage;
  published: boolean;
  starter: boolean;
  order: number;
  lessonCount: number;
  publishedLessonCount: number;
  enrolledCount: number;
  prerequisites: { id: string; slug: string; title: string }[];
};

export type AdminLesson = {
  id: string;
  moduleId: string;
  number: number;
  title: Localized;
  description: Localized;
  durationMinutes: number;
  video: { provider: VideoProvider; youtubeId: string; bunnyVideoId: string };
  materials: { label: string; url: string }[];
  published: boolean;
  hasProgress: boolean;
};

export type AdminExam = {
  id: string;
  scope: "module" | "final";
  moduleId: string | null;
  passThreshold: number;
  requiredToAdvance: boolean;
  attemptCount: number;
  questions: {
    id: string;
    qtype: QuestionType;
    text: Localized;
    statementIsTrue: boolean;
    explanation: Localized;
    options: { id: string; text: Localized; correct: boolean }[];
  }[];
};

export type AdminCourseStructure = {
  course: {
    id: string;
    slug: string;
    title: Localized;
    description: Localized;
    coverUrl: string;
    speaker: string;
    language: UserLanguage;
    published: boolean;
    starter: boolean;
    order: number;
    prerequisites: string[];
    modules: { id: string; number: number; title: Localized }[];
  };
  lessons: AdminLesson[];
  exams: AdminExam[];
  courseOptions: { id: string; slug: string; title: string }[];
  enrolledCount: number;
  bunny: { upload: boolean; playback: boolean };
};

export type ApiErrorBody = { error: string; code?: string; [key: string]: unknown };
