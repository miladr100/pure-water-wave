import { NextResponse } from "next/server";

import { sendEmailFeedback } from "@/lib/emails";
import { connectDB } from "@/lib/mongodb";
import { requirePastorSession } from "@/lib/require-pastor-session";
import { SYSTEM_USER_ROLE_LABELS } from "@/lib/user-roles";
import { SystemUser } from "@/models/system-user";

const FEEDBACK_TYPES = ["error", "suggestion"] as const;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_PAGE_LENGTH = 500;
const MAX_LINK_LENGTH = 2000;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function detectImageExtension(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }

  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "gif";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

function sanitizeFilename(name: string, extension: string, index: number) {
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

  return `${base || `imagem-${index + 1}`}.${extension}`;
}

export async function POST(request: Request) {
  try {
    const session = await requirePastorSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Envio de e-mail não configurado" },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const type = String(formData.get("type") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const page = String(formData.get("page") ?? "").trim();
    const link = String(formData.get("link") ?? "").trim();
    const files = formData
      .getAll("images")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (!FEEDBACK_TYPES.includes(type as (typeof FEEDBACK_TYPES)[number])) {
      return NextResponse.json({ error: "Informe o tipo do relato" }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "Escreva uma mensagem com pelo menos 10 caracteres" },
        { status: 400 },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Mensagem muito longa" }, { status: 400 });
    }

    if (page.length > MAX_PAGE_LENGTH) {
      return NextResponse.json({ error: "Página inválida" }, { status: 400 });
    }

    if (link && (link.length > MAX_LINK_LENGTH || !isHttpUrl(link))) {
      return NextResponse.json({ error: "Informe um link válido" }, { status: 400 });
    }

    if (files.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: "Envie no máximo 3 imagens" },
        { status: 400 },
      );
    }

    const images: { filename: string; content: string; contentType: string }[] = [];

    for (const [index, file] of files.entries()) {
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Cada imagem deve ter no máximo 4 MB" },
          { status: 400 },
        );
      }

      const declaredType = file.type;
      if (!IMAGE_TYPES[declaredType]) {
        return NextResponse.json(
          { error: "Envie apenas imagens JPG, PNG, WEBP ou GIF" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = detectImageExtension(buffer);

      if (!extension) {
        return NextResponse.json(
          { error: "Envie apenas imagens JPG, PNG, WEBP ou GIF" },
          { status: 400 },
        );
      }

      images.push({
        filename: sanitizeFilename(file.name, extension, index),
        content: buffer.toString("base64"),
        contentType: declaredType,
      });
    }

    await connectDB();

    const user = await SystemUser.findById(session.userId).select(
      "fullName email login phone churchName country language role",
    );

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    await sendEmailFeedback({
      type: type as "error" | "suggestion",
      message,
      page,
      link,
      imageNames: images.map((image) => image.filename),
      images,
      fullName: user.fullName,
      email: user.email,
      login: user.login,
      phone: user.phone,
      churchName: user.churchName ?? "",
      country: user.country ?? "",
      language: user.language ?? session.language,
      role: SYSTEM_USER_ROLE_LABELS[user.role] ?? user.role,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao enviar feedback:", error);
    return NextResponse.json(
      { error: "Não foi possível enviar o relatório" },
      { status: 500 },
    );
  }
}
