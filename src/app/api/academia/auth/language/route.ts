import { NextResponse } from "next/server";

import {
  createSessionToken,
  getSession,
  getSessionCookieOptions,
  isAcademySession,
} from "@/lib/academy/auth";
import { connectDB } from "@/lib/mongodb";
import { isUserLanguage } from "@/lib/user-languages";
import { AcademyUser } from "@/models/academy-user";

type LanguageBody = {
  language?: string;
};

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session || !isAcademySession(session)) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    const { language } = (await request.json()) as LanguageBody;

    if (!isUserLanguage(language)) {
      return NextResponse.json({ error: "Idioma inválido" }, { status: 400 });
    }

    await connectDB();

    const user = await AcademyUser.findByIdAndUpdate(
      session.userId,
      { language },
      { new: true },
    );

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const token = await createSessionToken({
      userId: session.userId,
      login: session.login,
      fullName: session.fullName,
      role: session.role,
      language,
    });

    const response = NextResponse.json({ ok: true, language });
    response.cookies.set(getSessionCookieOptions(token));

    return response;
  } catch (error) {
    console.error("Erro ao atualizar idioma:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o idioma" },
      { status: 500 },
    );
  }
}
