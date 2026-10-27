import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { connectDB } from "@/lib/mongodb";

// The same three answers every library route gives: a 503 when the database
// is not configured, a JSON error with an optional machine-readable code, and
// a connected database otherwise.
export function dbNotConfigured() {
  if (process.env.MONGODB_URI) {
    return null;
  }

  return NextResponse.json({ error: "Banco de dados não configurado" }, { status: 503 });
}

export async function withDb() {
  const missing = dbNotConfigured();
  if (missing) {
    return missing;
  }

  await connectDB();
  return null;
}

export function jsonError(
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && Types.ObjectId.isValid(value) && /^[a-f\d]{24}$/i.test(value);
}

export function serverError(context: string, error: unknown, message: string) {
  console.error(`${context}:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}
