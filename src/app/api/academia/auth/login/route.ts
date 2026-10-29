import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { isUserLanguage, type UserLanguage } from "@/lib/user-languages";
import { redirectFor, setAcademyCookies, setLibraryCookie } from "@/lib/academy/session-bridge";
import { AcademyUser } from "@/models/academy-user";
import { SystemUser } from "@/models/system-user";

type LoginBody = {
  login?: string;
  password?: string;
};

// The site's single sign-in (see session-bridge.ts). An academy account is
// tried first; failing that, a library account. A library member (HJ Team)
// signing in for the first time gets an academy account made from their
// library one, same e-mail and password, so they land in the academy.
export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: "Banco de dados não configurado" }, { status: 503 });
    }

    if (!process.env.AUTH_SECRET) {
      return NextResponse.json({ error: "Autenticação não configurada" }, { status: 503 });
    }

    const { login, password } = (await request.json()) as LoginBody;
    const normalizedLogin = login?.trim().toLowerCase();

    if (!normalizedLogin || !password) {
      return NextResponse.json({ error: "Login e senha são obrigatórios" }, { status: 400 });
    }

    await connectDB();

    const [academyUser, systemUser] = await Promise.all([
      AcademyUser.findOne({ $or: [{ login: normalizedLogin }, { email: normalizedLogin }] }).select(
        "+password",
      ),
      SystemUser.findOne({ $or: [{ login: normalizedLogin }, { email: normalizedLogin }] }).select(
        "+password",
      ),
    ]);

    if (!academyUser?.password && !systemUser?.password) {
      return NextResponse.json(
        { error: "Este usuário não está cadastrado", code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    const academyOk = academyUser?.password
      ? await verifyPassword(password, academyUser.password)
      : false;
    const systemOk =
      !academyOk && systemUser?.password ? await verifyPassword(password, systemUser.password) : false;

    if (!academyOk && !systemOk) {
      return NextResponse.json({ error: "Senha incorreta", code: "INVALID_PASSWORD" }, { status: 401 });
    }

    // A pastor keeps the library and nothing else.
    if (!academyOk && systemUser && systemUser.role === "pastor") {
      const language = isUserLanguage(systemUser.language) ? systemUser.language : "pt";
      const response = NextResponse.json({
        ok: true,
        redirectTo: redirectFor("pastor"),
        user: { fullName: systemUser.fullName, login: systemUser.login, role: "pastor", language },
      });
      await setLibraryCookie(response, {
        userId: systemUser._id.toString(),
        login: systemUser.login,
        fullName: systemUser.fullName,
        role: "pastor",
        language,
      });
      return response;
    }

    // HJ Team member without an academy account yet: make one from the
    // library account (same e-mail and password hash).
    let user = academyOk ? academyUser! : null;
    if (!user && systemUser) {
      user =
        (await AcademyUser.findOne({ email: systemUser.email }).select("+password")) ??
        (await AcademyUser.create({
          fullName: systemUser.fullName,
          email: systemUser.email,
          login: systemUser.email,
          password: systemUser.password,
          phone: systemUser.phone ?? "",
          country: systemUser.country ?? "",
          language: isUserLanguage(systemUser.language) ? systemUser.language : "pt",
          role: "student",
        }));
    }

    if (!user) {
      return NextResponse.json({ error: "Não foi possível realizar o login" }, { status: 500 });
    }

    const language: UserLanguage = isUserLanguage(user.language) ? user.language : "pt";
    await AcademyUser.updateOne({ _id: user._id }, { lastSeenAt: new Date() });

    const response = NextResponse.json({
      ok: true,
      redirectTo: redirectFor(user.role),
      user: {
        fullName: user.fullName,
        login: user.login,
        role: user.role,
        language,
        theme: user.theme ?? "system",
      },
    });

    await setAcademyCookies(response, {
      userId: user._id.toString(),
      login: user.login,
      fullName: user.fullName,
      role: user.role,
      language,
    });

    return response;
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    return NextResponse.json({ error: "Não foi possível realizar o login" }, { status: 500 });
  }
}
