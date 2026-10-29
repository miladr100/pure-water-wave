import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import type { CourseDoc } from "@/lib/academy/load";
import type { AdminCourseRow } from "@/lib/academy/types";
import { normalizeLocalized, pick } from "@/lib/academy/localized";
import { requireTutorSession } from "@/lib/academy/require-session";
import { Course } from "@/models/course";
import { Enrollment } from "@/models/enrollment";
import { Lesson } from "@/models/lesson";

export async function GET() {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const [courses, lessonCounts, enrolledCounts] = await Promise.all([
      Course.find().sort({ order: 1, createdAt: 1 }).lean() as Promise<CourseDoc[]>,
      Lesson.aggregate<{ _id: Types.ObjectId; total: number; published: number }>([
        {
          $group: {
            _id: "$courseId",
            total: { $sum: 1 },
            published: { $sum: { $cond: ["$published", 1, 0] } },
          },
        },
      ]),
      Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { status: "active" } },
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
      ]),
    ]);

    const lessonsByCourse = new Map(lessonCounts.map((row) => [row._id.toString(), row]));
    const enrolledByCourse = new Map(enrolledCounts.map((row) => [row._id.toString(), row.count]));
    const byId = new Map(courses.map((course) => [course._id.toString(), course]));

    const rows: AdminCourseRow[] = courses.map((course) => {
      const id = course._id.toString();
      const lessons = lessonsByCourse.get(id);

      return {
        id,
        slug: course.slug,
        title: course.title,
        language: course.language ?? "pt",
        published: Boolean(course.published),
        starter: Boolean(course.starter),
        order: course.order ?? 0,
        lessonCount: lessons?.total ?? 0,
        publishedLessonCount: lessons?.published ?? 0,
        enrolledCount: enrolledByCourse.get(id) ?? 0,
        prerequisites: (course.prerequisites ?? [])
          .map((prerequisiteId) => byId.get(prerequisiteId.toString()))
          .filter((item): item is CourseDoc => Boolean(item))
          .map((item) => ({
            id: item._id.toString(),
            slug: item.slug,
            title: pick(item.title, "pt"),
          })),
      };
    });

    return NextResponse.json({ courses: rows });
  } catch (error) {
    return serverError("Erro ao listar cursos", error, "Não foi possível carregar os cursos");
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string) {
  let slug = base;
  for (let suffix = 2; await Course.exists({ slug }); suffix += 1) {
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function POST(request: Request) {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const body = (await request.json().catch(() => ({}))) as { title?: unknown; slug?: unknown };
    const title = normalizeLocalized(body.title);
    if (!title.pt) {
      return jsonError("Informe o título em português", 400);
    }

    const base = slugify(typeof body.slug === "string" && body.slug.trim() ? body.slug : title.pt);
    if (!base) {
      return jsonError("Endereço inválido", 400);
    }

    const course = await Course.create({
      slug: await uniqueSlug(base),
      title,
      modules: [{ number: 1, title: { pt: "Módulo 1", en: "", es: "" } }],
    });

    return NextResponse.json({ id: course._id.toString() }, { status: 201 });
  } catch (error) {
    return serverError("Erro ao criar curso", error, "Não foi possível criar o curso");
  }
}
