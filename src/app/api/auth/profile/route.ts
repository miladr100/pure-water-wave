import { NextResponse } from "next/server";

import {
  createSessionToken,
  getSession,
  getSessionCookieOptions,
  isSystemUserSession,
} from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { SystemUser } from "@/models/system-user";

type ProfileBody = {
  fullName?: string;
};

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session || !isSystemUserSession(session)) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    const { fullName } = (await request.json()) as ProfileBody;
    const normalizedName = fullName?.trim() ?? "";

    if (normalizedName.length < 2) {
      return NextResponse.json(
        { error: "Informe um nome válido" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await SystemUser.findByIdAndUpdate(
      session.userId,
      { fullName: normalizedName },
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
      fullName: user.fullName,
      role: session.role,
      language: session.language,
    });

    const response = NextResponse.json({ ok: true, fullName: user.fullName });
    response.cookies.set(getSessionCookieOptions(token));

    return response;
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o nome" },
      { status: 500 },
    );
  }
}
