import { NextResponse } from "next/server";

import { getSession, isSystemUserSession } from "@/lib/auth";
import { sendEmailPasswordChanged } from "@/lib/emails";
import { connectDB } from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SystemUser } from "@/models/system-user";

const MIN_PASSWORD_LENGTH = 6;

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
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

    const body = (await request.json()) as ChangePasswordBody;
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Informe a senha atual" },
        { status: 400 },
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await SystemUser.findById(session.userId).select("+password");

    if (!user?.password) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 401 },
      );
    }

    await SystemUser.updateOne(
      { _id: user._id },
      { password: await hashPassword(newPassword) },
    );

    const firstName = user.fullName.trim().split(/\s+/)[0] ?? user.fullName;

    try {
      await sendEmailPasswordChanged({
        userFirstname: firstName,
        email: user.email,
      });
    } catch (error) {
      console.error("Senha alterada, mas o e-mail de aviso falhou:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return NextResponse.json(
      { error: "Não foi possível alterar a senha" },
      { status: 500 },
    );
  }
}
