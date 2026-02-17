import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "ok", ts: new Date().toISOString() });
  } catch (error) {
    console.error("[ready] Database readiness check failed.", error);
    return NextResponse.json(
      { ok: false, db: "unavailable", ts: new Date().toISOString() },
      { status: 503 },
    );
  }
}
