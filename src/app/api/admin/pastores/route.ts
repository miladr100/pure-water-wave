import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireTutorSession } from "@/lib/academy/require-session";
import type { AdminPastorRow } from "@/lib/academy/types";
import { isUserLanguage } from "@/lib/user-languages";
import { SystemUser } from "@/models/system-user";

type SystemUserDoc = {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  churchName?: string;
  language?: string;
  role: "pastor" | "hjteam";
  createdAt: Date;
};

// The library's accounts, newest first: the pastors the panel created plus
// the legacy HJ Team memberships that still sign in through the same Login.
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

    const users = (await SystemUser.find({ role: { $in: ["pastor", "hjteam"] } })
      .sort({ createdAt: -1, _id: -1 })
      .select("fullName email phone country churchName language role createdAt")
      .lean()) as SystemUserDoc[];

    const pastors: AdminPastorRow[] = users.map((user) => ({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
      country: user.country ?? "",
      churchName: user.churchName ?? "",
      language: isUserLanguage(user.language) ? user.language : "pt",
      role: user.role,
      createdAt: (user.createdAt ?? new Date(0)).toISOString(),
    }));

    return NextResponse.json({ pastors });
  } catch (error) {
    return serverError("Erro ao listar pastores", error, "Não foi possível carregar os pastores");
  }
}
