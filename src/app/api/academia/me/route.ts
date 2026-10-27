import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { courseCard, lessonThumbnail, type CourseDoc, type LessonDoc } from "@/lib/academy/load";
import type { MeResponse } from "@/lib/academy/types";
import { pick } from "@/lib/academy/localized";
import { requireAcademySession } from "@/lib/academy/require-session";
import type { UserLanguage } from "@/lib/user-languages";
import type { AcademyRole } from "@/lib/academy/roles";
import { AcademyUser } from "@/models/academy-user";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";
import { Lesson } from "@/models/lesson";
import { LessonProgress } from "@/models/lesson-progress";
import { Question } from "@/models/question";

type UserRow = {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  role: AcademyRole;
  language?: UserLanguage;
  country?: string;
  city?: string;
  phone?: string;
  birthYear?: number | null;
  assignedTutorId?: { _id: Types.ObjectId; fullName: string } | null;
};

type EnrollmentRow = { courseId: Types.ObjectId; createdAt: Date };

type ProgressRow = { lessonId: Types.ObjectId; percent: number };

type NotificationRow = {
  _id: Types.ObjectId;
  text: string;
  courseId: { slug: string } | null;
  lessonId: Types.ObjectId;
  lessonLabel: string;
  answeredBy: string;
  answeredAt: Date | null;
  answerSeenAt: Date | null;
};

const NOTIFICATION_LIMIT = 50;
// Only the most recent unfinished rows are inspected: an old row whose
// lesson was since unpublished should not cost a scan of the whole table.
const CONTINUE_CANDIDATES = 20;

export async function GET() {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const userDoc = (await AcademyUser.findById(session.userId)
      .populate("assignedTutorId", "fullName")
      .lean()) as UserRow | null;

    if (!userDoc) {
      return jsonError("Usuário não encontrado", 404, { code: "user_not_found" });
    }

    const user = { id: session.userId, role: session.role };
    const language = session.language;

    const enrollmentRows = (await Enrollment.find({ userId: session.userId, status: "active" })
      .sort({ createdAt: -1 })
      .lean()) as EnrollmentRow[];
    const courses = (await Course.find({
      _id: { $in: enrollmentRows.map((row) => row.courseId) },
      published: true,
    }).lean()) as CourseDoc[];

    const enrollments: MeResponse["enrollments"] = [];
    for (const row of enrollmentRows) {
      const course = courses.find((item) => item._id.equals(row.courseId));
      if (!course) {
        continue;
      }

      enrollments.push({
        ...(await courseCard(course, language, user)),
        enrolledAt: row.createdAt.toISOString(),
      });
    }

    const recent = (await LessonProgress.find({
      userId: session.userId,
      completed: false,
      percent: { $gt: 0 },
    })
      .sort({ updatedAt: -1 })
      .limit(CONTINUE_CANDIDATES)
      .lean()) as ProgressRow[];

    let continueLesson: MeResponse["continueLesson"] = null;
    for (const row of recent) {
      const lesson = (await Lesson.findById(row.lessonId).lean()) as LessonDoc | null;
      if (!lesson?.published) {
        continue;
      }

      const course =
        courses.find((item) => item._id.equals(lesson.courseId)) ??
        ((await Course.findById(lesson.courseId).lean()) as CourseDoc | null);
      if (!course?.published) {
        continue;
      }

      continueLesson = {
        lessonId: lesson._id.toString(),
        lessonNumber: lesson.number,
        lessonTitle: pick(lesson.title, language),
        durationMinutes: lesson.durationMinutes ?? 0,
        percent: row.percent,
        courseSlug: course.slug,
        courseTitle: pick(course.title, language),
        coverUrl: course.coverUrl ?? "",
        thumbnailUrl: lessonThumbnail(lesson),
      };
      break;
    }

    const answered = (await Question.find({ userId: session.userId, status: "answered" })
      .sort({ answeredAt: -1 })
      .limit(NOTIFICATION_LIMIT)
      .populate("courseId", "slug")
      .lean()) as unknown as NotificationRow[];

    const notifications: MeResponse["notifications"] = answered.map((row) => ({
      questionId: row._id.toString(),
      text: row.text,
      courseSlug: row.courseId?.slug ?? "",
      lessonId: row.lessonId.toString(),
      lessonLabel: row.lessonLabel,
      answeredBy: row.answeredBy,
      answeredAt: row.answeredAt ? row.answeredAt.toISOString() : "",
      seen: Boolean(row.answerSeenAt),
    }));

    const body: MeResponse = {
      profile: {
        id: userDoc._id.toString(),
        fullName: userDoc.fullName,
        email: userDoc.email,
        role: userDoc.role,
        language: userDoc.language ?? "pt",
        country: userDoc.country ?? "",
        city: userDoc.city ?? "",
        phone: userDoc.phone ?? "",
        birthYear: userDoc.birthYear ?? null,
        tutor: userDoc.assignedTutorId
          ? { id: userDoc.assignedTutorId._id.toString(), fullName: userDoc.assignedTutorId.fullName }
          : null,
      },
      enrollments,
      continueLesson,
      notifications,
      unreadCount: notifications.filter((item) => !item.seen).length,
    };

    return NextResponse.json(body);
  } catch (error) {
    return serverError("Erro ao carregar o painel do aluno", error, "Não foi possível carregar o painel");
  }
}
