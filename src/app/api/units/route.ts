import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached, invalidateCache } from "@/lib/redis";

export async function GET() {
  const units = await cached("units", () =>
    prisma.unit.findMany({ orderBy: { name: "asc" } }), 60);
  return NextResponse.json(units);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const unit = await prisma.unit.create({
    data: { name: body.name, nameTh: body.nameTh, abbr: body.abbr },
  });
  await invalidateCache("units");
  return NextResponse.json(unit, { status: 201 });
}
