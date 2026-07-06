import { NextResponse } from "next/server";

import { processAbandonedDonationRemarketing } from "@/lib/donation-remarketing";

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "Banco de dados não configurado" },
        { status: 503 },
      );
    }

    console.info("Iniciando cron de remarketing de doações abandonadas");

    const results = await processAbandonedDonationRemarketing();

    console.info("Cron de remarketing concluído:", results);

    return NextResponse.json(
      {
        success: true,
        message: "Cron job successfully executed",
        results,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error executing cron job:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: err instanceof Error ? err.message : err,
      },
      { status: 500 },
    );
  }
}
