import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { createSessionToken, getSessionCookieOptions } from "@/lib/academy/auth";
import { jsonError, serverError, withDb } from "@/lib/academy/http";
import { requireAcademySession } from "@/lib/academy/require-session";
import { verifyPassword } from "@/lib/password";
import { AcademyUser } from "@/models/academy-user";

type EmailBody = {
  newEmail?: string;
  currentPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Changing the sign-in e-mail. The FFPUM academy confirms the new address
// with a code sent to it; this academy has no guaranteed mail delivery
// (Resend is optional), so the current password is the proof of ownership
// instead — the same check the change-password route makes.
export async function PATCH(request: Request) {
  try {
    const session = await requireAcademySession();
    if (!session) {
      return jsonError("Não autorizado", 401);
    }

    const dbError = await withDb();
    if (dbError) {
      return dbError;
    }

    const body = (await request.json().catch(() => ({}))) as EmailBody;
    const email = typeof body.newEmail === "string" ? body.newEmail.trim().toLowerCase() : "";
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

    if (!EMAIL_PATTERN.test(email)) {
      return jsonError("E-mail inválido", 400, { code: "INVALID_EMAIL" });
    }

    if (!currentPassword) {
      return jsonError("Informe a senha atual", 400, { code: "PASSWORD_REQUIRED" });
    }

    const user = (await AcademyUser.findById(session.userId).select("+password email").lean()) as {
      _id: Types.ObjectId;
      email: string;
      password?: string;
    } | null;

    if (!user?.password) {
      return jsonError("Usuário não encontrado", 404, { code: "user_not_found" });
    }

    if (!(await verifyPassword(currentPassword, user.password))) {
      return jsonError("Senha incorreta", 401, { code: "INVALID_PASSWORD" });
    }

    if (email !== user.email) {
      const taken = await AcademyUser.exists({
        _id: { $ne: user._id },
        $or: [{ email }, { login: email }],
      });
      if (taken) {
        return jsonError("Este e-mail já está em uso", 409, { code: "EMAIL_IN_USE" });
      }

      // `login` follows the e-mail: accounts are created with both equal and
      // the login route accepts either, so they must not drift apart.
      await AcademyUser.updateOne({ _id: user._id }, { $set: { email, login: email } });
    }

    const token = await createSessionToken({
      userId: session.userId,
      login: email,
      fullName: session.fullName,
      role: session.role,
      language: session.language,
    });

    const response = NextResponse.json({ ok: true, email });
    response.cookies.set(getSessionCookieOptions(token));

    return response;
  } catch (error) {
    return serverError("Erro ao alterar o e-mail", error, "Não foi possível alterar o e-mail");
  }
}
