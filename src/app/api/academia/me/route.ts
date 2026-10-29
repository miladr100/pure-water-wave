import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { createSessionToken, getSessionCookieOptions } from "@/lib/academy/auth";
import { isCountry } from "@/lib/academy/countries";
import { isObjectId, jsonError, serverError, withDb } from "@/lib/academy/http";
import { courseCard, lessonThumbnail, type CourseDoc, type LessonDoc } from "@/lib/academy/load";
import type { MeResponse, ProfilePatchBody } from "@/lib/academy/types";
import { pick } from "@/lib/academy/localized";
import {
  meProfile,
  parseBirthday,
  PROFILE_FIELDS,
  TUTOR_CARD_FIELDS,
  type ProfileDoc,
} from "@/lib/academy/profile";
import { requireAcademySession } from "@/lib/academy/require-session";
import { isAppTheme } from "@/lib/theme";
import { isUserLanguage } from "@/lib/user-languages";
import { AcademyUser } from "@/models/academy-user";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";
import { Lesson } from "@/models/lesson";
import { LessonProgress } from "@/models/lesson-progress";
import { Question } from "@/models/question";

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

async function loadProfileDoc(userId: string) {
  return (await AcademyUser.findById(userId)
    .select(PROFILE_FIELDS)
    .populate("assignedTutorId", TUTOR_CARD_FIELDS)
    .lean()) as ProfileDoc | null;
}

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

    const userDoc = await loadProfileDoc(session.userId);
    if (!userDoc) {
      return jsonError("Usuário não encontrado", 404, { code: "user_not_found" });
    }

    const user = { id: session.userId, role: session.role };
    const language = session.language;

    // Enrolled courses stay visible whatever their language: the student
    // chose them (the FFPUM F26 language filter applies to the catalogue only).
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
      profile: meProfile(userDoc),
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

// FFPUM-style profile rules: a short real name, a country from the list,
// a phone that looks like one, a birthday that already happened.
const NAME_MIN = 2;
const NAME_MAX = 120;
const CITY_MAX = 120;
const PHONE_PATTERN = /^\+?[\d\s()-]{6,20}$/;

type FieldErrors = Partial<Record<keyof ProfilePatchBody, string>>;

export async function PATCH(request: Request) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const body = (await request.json().catch(() => ({}))) as ProfilePatchBody;
    const update: Record<string, unknown> = {};
    const fields: FieldErrors = {};

    if (body.fullName !== undefined) {
      const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
      if (fullName.length < NAME_MIN || fullName.length > NAME_MAX) {
        fields.fullName = "invalid";
      } else {
        update.fullName = fullName;
      }
    }

    // An empty country keeps the current one: the form always sends the
    // field, and clearing it is not a choice the student can make.
    if (body.country !== undefined && body.country !== "") {
      if (isCountry(body.country)) {
        update.country = body.country;
      } else {
        fields.country = "invalid";
      }
    }

    if (body.city !== undefined) {
      const city = typeof body.city === "string" ? body.city.trim() : null;
      if (city === null || city.length > CITY_MAX) {
        fields.city = "invalid";
      } else {
        update.city = city;
      }
    }

    if (body.phone !== undefined) {
      const phone = typeof body.phone === "string" ? body.phone.trim() : null;
      if (phone === null || (phone !== "" && !PHONE_PATTERN.test(phone))) {
        fields.phone = "invalid";
      } else {
        update.phone = phone;
      }
    }

    if (body.birthday !== undefined) {
      if (body.birthday === null || body.birthday === "") {
        update.birthday = null;
      } else {
        const birthday = typeof body.birthday === "string" ? parseBirthday(body.birthday) : null;
        if (birthday) {
          update.birthday = birthday;
        } else {
          fields.birthday = "invalid";
        }
      }
    }

    if (body.language !== undefined) {
      if (isUserLanguage(body.language)) {
        update.language = body.language;
      } else {
        fields.language = "invalid";
      }
    }

    if (body.theme !== undefined) {
      if (isAppTheme(body.theme)) {
        update.theme = body.theme;
      } else {
        fields.theme = "invalid";
      }
    }

    if (body.showOtherLanguage !== undefined) {
      if (typeof body.showOtherLanguage === "boolean") {
        update.showOtherLanguage = body.showOtherLanguage;
      } else {
        fields.showOtherLanguage = "invalid";
      }
    }

    // Tutors have no tutor of their own, and nobody is their own tutor: both
    // are dropped without complaint rather than failing the whole save.
    if (body.assignedTutorId !== undefined && session.role !== "tutor") {
      if (body.assignedTutorId === null || body.assignedTutorId === "") {
        update.assignedTutorId = null;
      } else if (body.assignedTutorId === session.userId) {
        // ignored
      } else {
        const tutor = isObjectId(body.assignedTutorId)
          ? await AcademyUser.exists({ _id: body.assignedTutorId, role: "tutor" })
          : null;
        if (tutor) {
          update.assignedTutorId = body.assignedTutorId;
        } else {
          fields.assignedTutorId = "tutor_not_found";
        }
      }
    }

    if (Object.keys(fields).length > 0) {
      return jsonError("Verifique os campos destacados", 400, { code: "validation", fields });
    }

    if (Object.keys(update).length > 0) {
      const updated = await AcademyUser.updateOne({ _id: session.userId }, { $set: update });
      if (updated.matchedCount === 0) {
        return jsonError("Usuário não encontrado", 404, { code: "user_not_found" });
      }
    }

    const userDoc = await loadProfileDoc(session.userId);
    if (!userDoc) {
      return jsonError("Usuário não encontrado", 404, { code: "user_not_found" });
    }

    const profile = meProfile(userDoc);
    const response = NextResponse.json({ profile });

    // The session cookie carries the name and the language (the header and
    // the course titles read them from there), so it is reissued when either
    // changed — as the older /auth/profile and /auth/language routes do.
    if (profile.fullName !== session.fullName || profile.language !== session.language) {
      const token = await createSessionToken({
        userId: session.userId,
        login: session.login,
        fullName: profile.fullName,
        role: session.role,
        language: profile.language,
      });
      response.cookies.set(getSessionCookieOptions(token));
    }

    return response;
  } catch (error) {
    return serverError("Erro ao atualizar o perfil", error, "Não foi possível atualizar o perfil");
  }
}
