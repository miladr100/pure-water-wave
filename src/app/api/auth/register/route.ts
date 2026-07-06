import { NextResponse } from "next/server";

import { isValidPhoneWithDdd, normalizePhone } from "@/lib/phone";
import { hashPassword } from "@/lib/password";
import { isValidRegisterSecret } from "@/lib/register-secret";
import { isUserLanguage } from "@/lib/user-languages";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";

type RegisterBody = {
  secret?: string;
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  churchName?: string;
  country?: string;
  language?: string;
};

const MIN_PASSWORD_LENGTH = 6;

async function isPhoneUsedByAnotherUser(phone: string, userId?: string) {
  const filter = userId ? { phone, _id: { $ne: userId } } : { phone };
  const user = await User.exists(filter);
  return Boolean(user);
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

    const secret = body.secret?.trim() ?? "";
    const fullName = body.fullName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const phone = normalizePhone(body.phone ?? "");
    const churchName = body.churchName?.trim() ?? "";
    const country = body.country?.trim() ?? "";
    const language = body.language?.trim() ?? "";

    if (!isValidRegisterSecret(secret)) {
      return NextResponse.json({ error: "Segredo de cadastro inválido" }, { status: 403 });
    }

    if (!fullName || !email || !password || !phone || !churchName || !country || !language) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios" },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 },
      );
    }

    if (!isValidPhoneWithDdd(phone)) {
      return NextResponse.json(
        { error: "Informe um telefone válido com DDD" },
        { status: 400 },
      );
    }

    if (!isUserLanguage(language)) {
      return NextResponse.json({ error: "Língua inválida" }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    await connectDB();

    const hashedPassword = await hashPassword(password);

    const profileData = {
      fullName,
      phone,
      churchName,
      country,
      language,
      login: email,
      password: hashedPassword,
      role: "pastor" as const,
    };

    const existingUserByEmail = await User.findOne({ email }).select("+password");

    if (existingUserByEmail) {
      if (existingUserByEmail.password) {
        return NextResponse.json(
          { error: "Este e-mail já está em uso por outro usuário" },
          { status: 409 },
        );
      }

      if (await isPhoneUsedByAnotherUser(phone, existingUserByEmail._id.toString())) {
        return NextResponse.json(
          { error: "Este telefone já está em uso por outro usuário" },
          { status: 409 },
        );
      }

      await User.updateOne({ _id: existingUserByEmail._id }, { $set: profileData });

      return NextResponse.json({ ok: true, updated: true });
    }

    if (await isPhoneUsedByAnotherUser(phone)) {
      return NextResponse.json(
        { error: "Este telefone já está em uso por outro usuário" },
        { status: 409 },
      );
    }

    await User.create({
      email,
      ...profileData,
    });

    return NextResponse.json({ ok: true, updated: false });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return NextResponse.json(
      { error: "Não foi possível concluir o cadastro" },
      { status: 500 },
    );
  }
}
