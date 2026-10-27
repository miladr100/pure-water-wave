import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieOptions } from "@/lib/academy/auth";
import { connectDB } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { isAppTheme } from "@/lib/theme";
import { isUserLanguage } from "@/lib/user-languages";
import { AcademyUser } from "@/models/academy-user";

type LoginBody = {
  login?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    if (!process.env.AUTH_SECRET) {
      return NextResponse.json(
        { error: "Autenticação não configurada" },
        { status: 503 },
      );
    }

    const { login, password } = (await request.json()) as LoginBody;
    const normalizedLogin = login?.trim().toLowerCase();

    if (!normalizedLogin || !password) {
      return NextResponse.json(
        { error: "Login e senha são obrigatórios" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await AcademyUser.findOne({
      $or: [{ login: normalizedLogin }, { email: normalizedLogin }],
    }).select("+password");

    if (!user?.password) {
      return NextResponse.json(
        { error: "Este usuário não está cadastrado", code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Senha incorreta", code: "INVALID_PASSWORD" },
        { status: 401 },
      );
    }

    const language = isUserLanguage(user.language) ? user.language : "pt";
    // The browser adopts the saved theme at sign-in (FFPUM F10).
    const theme = isAppTheme(user.theme) ? user.theme : "system";

    const token = await createSessionToken({
      userId: user._id.toString(),
      login: user.login,
      fullName: user.fullName,
      role: user.role,
      language,
    });

    await AcademyUser.updateOne({ _id: user._id }, { lastSeenAt: new Date() });

    const response = NextResponse.json({
      ok: true,
      redirectTo: user.role === "tutor" ? "/admin" : "/academia",
      user: {
        fullName: user.fullName,
        login: user.login,
        role: user.role,
        language,
        theme,
      },
    });

    response.cookies.set(getSessionCookieOptions(token));

    return response;
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    return NextResponse.json(
      { error: "Não foi possível realizar o login" },
      { status: 500 },
    );
  }
}
