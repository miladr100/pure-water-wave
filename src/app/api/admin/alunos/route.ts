import { NextResponse } from "next/server";
import type { FilterQuery } from "mongoose";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import type { AdminStudentRow } from "@/lib/academy/types";
import { requireTutorSession } from "@/lib/academy/require-session";
import { AcademyUser } from "@/models/academy-user";

import { studentRows, USER_ROW_FIELDS, type UserDoc } from "../_lib/serialize";

const SORTS = ["name", "createdAt", "country", "lastSeen"] as const;
type SortKey = (typeof SORTS)[number];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Sorting happens in memory: the list is small, and ordering names in the
// database would need a collation the in-memory test Mongo does not share.
function compare(a: AdminStudentRow, b: AdminStudentRow, sort: SortKey) {
  const text = (x: string, y: string) => x.localeCompare(y, "pt", { sensitivity: "base" });
  const date = (x: string | null, y: string | null) => {
    if (x === y) return 0;
    if (!x) return 1;
    if (!y) return -1;
    return x < y ? -1 : 1;
  };

  switch (sort) {
    case "name":
      return text(a.fullName, b.fullName);
    case "country":
      return text(a.country, b.country) || text(a.fullName, b.fullName);
    case "lastSeen":
      return date(a.lastSeenAt, b.lastSeenAt);
    default:
      return date(a.createdAt, b.createdAt);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireTutorSession();
    if (!session) {
      return jsonError("Não autorizado", 403);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const params = new URL(request.url).searchParams;
    const search = params.get("search")?.trim() ?? "";
    const sortParam = params.get("sort") ?? "createdAt";
    const sort: SortKey = (SORTS as readonly string[]).includes(sortParam)
      ? (sortParam as SortKey)
      : "createdAt";
    const dir = params.get("dir") === "asc" ? 1 : -1;

    const query: FilterQuery<UserDoc> = { role: "student" };
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      query.$or = [{ fullName: pattern }, { email: pattern }];
    }

    const users = (await AcademyUser.find(query).select(USER_ROW_FIELDS).lean()) as UserDoc[];
    const students = (await studentRows(users)).sort((a, b) => compare(a, b, sort) * dir);

    return NextResponse.json({ students });
  } catch (error) {
    return serverError("Erro ao listar alunos", error, "Não foi possível carregar os alunos");
  }
}
