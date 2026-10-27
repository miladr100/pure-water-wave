import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieOptions } from "@/lib/academy/auth";
import { emailConfigured, sendEmailNewStudent } from "@/lib/academy/emails";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { parseBirthday } from "@/lib/academy/profile";
import { isValidTutorSecret } from "@/lib/academy/register-secret";
import { USER_LANGUAGE_LABELS, isUserLanguage } from "@/lib/user-languages";
import { AcademyUser } from "@/models/academy-user";

type RegisterBody = {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  country?: string;
  city?: string;
  // yyyy-mm-dd, optional
  birthday?: string | null;
  language?: string;
  tutorSecret?: string;
};

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function appUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as RegisterBody;

    const fullName = body.fullName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const phone = body.phone?.trim() ?? "";
    const country = body.country?.trim() ?? "";
    const city = body.city?.trim() ?? "";
    const language = body.language?.trim() ?? "pt";
    const tutorSecret = body.tutorSecret?.trim() ?? "";
    const birthdayRaw = typeof body.birthday === "string" ? body.birthday.trim() : "";

    if (!fullName || !email || !password || !country) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios" },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 },
      );
    }

    if (!isUserLanguage(language)) {
      return NextResponse.json({ error: "Língua inválida" }, { status: 400 });
    }

    // Same rule as PATCH /api/academia/me: a real day, 1900 or later, not
    // in the future. Empty means the student chose not to say.
    const birthday = birthdayRaw ? parseBirthday(birthdayRaw) : null;
    if (birthdayRaw && !birthday) {
      return NextResponse.json({ error: "Data de nascimento inválida" }, { status: 400 });
    }

    if (tutorSecret && !isValidTutorSecret(tutorSecret)) {
      return NextResponse.json({ error: "Segredo de tutor inválido" }, { status: 403 });
    }

    const role = tutorSecret ? "tutor" : "student";

    await connectDB();

    const existing = await AcademyUser.exists({ email });

    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso", code: "EMAIL_IN_USE" },
        { status: 409 },
      );
    }

    const user = await AcademyUser.create({
      fullName,
      email,
      login: email,
      password: await hashPassword(password),
      phone,
      country,
      city,
      birthday,
      language,
      role,
    });

    // A new student is signed in straight away — the academy has no email
    // verification step, the tutor's first contact is the welcome.
    const token = await createSessionToken({
      userId: user._id.toString(),
      login: user.login,
      fullName: user.fullName,
      role: user.role,
      language,
    });

    if (role === "student" && emailConfigured()) {
      const tutors = await AcademyUser.find({ role: "tutor" }).select("email");
      try {
        await sendEmailNewStudent({
          to: tutors.map((tutor) => tutor.email),
          studentName: fullName,
          studentEmail: email,
          country,
          language: USER_LANGUAGE_LABELS[language],
          adminUrl: `${appUrl(request)}/admin/alunos/${user._id.toString()}`,
        });
      } catch (error) {
        console.error("Aluno criado, mas o aviso aos tutores falhou:", error);
      }
    }

    // The same `user` object the login route returns, so the browser adopts
    // the theme the same way on both paths (a new account starts on "system").
    const response = NextResponse.json({
      ok: true,
      redirectTo: role === "tutor" ? "/admin" : "/academia",
      user: {
        fullName: user.fullName,
        login: user.login,
        role: user.role,
        language,
        theme: "system",
      },
    });
    response.cookies.set(getSessionCookieOptions(token));

    return response;
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return NextResponse.json(
      { error: "Não foi possível concluir o cadastro" },
      { status: 500 },
    );
  }
}
