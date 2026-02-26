import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const units = await prisma.unit.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(units);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const unit = await prisma.unit.create({
    data: { name: body.name, nameTh: body.nameTh, abbr: body.abbr },
  });
  return NextResponse.json(unit, { status: 201 });
}
