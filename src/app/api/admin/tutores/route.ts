import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";
import { AcademyUser } from "@/models/academy-user";

import { studentRows, USER_ROW_FIELDS, type UserDoc } from "../_lib/serialize";

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

    const [tutors, assigned] = await Promise.all([
      AcademyUser.find({ role: "tutor" })
        .sort({ fullName: 1 })
        .select(USER_ROW_FIELDS)
        .lean() as Promise<UserDoc[]>,
      AcademyUser.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { role: "student", assignedTutorId: { $ne: null } } },
        { $group: { _id: "$assignedTutorId", count: { $sum: 1 } } },
      ]),
    ]);

    // For a tutor the "enrollments" column means students in their care.
    const assignedCount = new Map(assigned.map((row) => [row._id.toString(), row.count]));
    const rows = (await studentRows(tutors)).map((row) => ({
      ...row,
      enrollmentCount: assignedCount.get(row.id) ?? 0,
      completedCount: 0,
    }));

    return NextResponse.json({ tutors: rows });
  } catch (error) {
    return serverError("Erro ao listar tutores", error, "Não foi possível carregar os tutores");
  }
}
