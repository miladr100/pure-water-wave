import { NextResponse } from "next/server";

import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { tutorCard, TUTOR_CARD_FIELDS, type TutorDoc } from "@/lib/academy/profile";
import { requireAcademySession } from "@/lib/academy/require-session";
import type { TutorCard } from "@/lib/academy/types";
import { AcademyUser } from "@/models/academy-user";

// The tutors a student can pick from. The FFPUM academy filters by country;
// here every tutor serves every country, so the list is complete — the
// student's own country simply comes first.
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

    const [me, tutorDocs] = await Promise.all([
      AcademyUser.findById(session.userId).select("country").lean() as Promise<{ country?: string } | null>,
      AcademyUser.find({ role: "tutor" }).select(TUTOR_CARD_FIELDS).lean() as Promise<TutorDoc[]>,
    ]);

    const ownCountry = me?.country ?? "";

    const tutors: TutorCard[] = tutorDocs
      .map(tutorCard)
      .sort(
        (a, b) =>
          Number(b.country === ownCountry) - Number(a.country === ownCountry) ||
          a.fullName.localeCompare(b.fullName, "pt", { sensitivity: "base" }),
      );

    return NextResponse.json({ tutors });
  } catch (error) {
    return serverError("Erro ao listar tutores", error, "Não foi possível carregar os tutores");
  }
}
