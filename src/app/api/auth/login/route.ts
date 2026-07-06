import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { User } from "@/models/user";

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

    const user = await User.findOne({
      $or: [{ login: normalizedLogin }, { email: normalizedLogin }],
    }).select("+password");

    if (!user?.password) {
      return NextResponse.json(
        { error: "Login ou senha inválidos" },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Login ou senha inválidos" },
        { status: 401 },
      );
    }

    if (user.role !== "pastor") {
      return NextResponse.json(
        { error: "Acesso restrito a pastores" },
        { status: 403 },
      );
    }

    const token = await createSessionToken({
      userId: user._id.toString(),
      login: user.login ?? user.email,
      fullName: user.fullName,
      role: user.role,
    });

    const response = NextResponse.json({
      ok: true,
      redirectTo: "/biblioteca",
      user: {
        fullName: user.fullName,
        login: user.login,
        role: user.role,
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
