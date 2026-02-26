import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached, invalidateCache } from "@/lib/redis";

export async function GET() {
  const categories = await cached("categories", () =>
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }), 60);
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const category = await prisma.category.create({
    data: { name: body.name, nameTh: body.nameTh },
  });
  await invalidateCache("categories");
  return NextResponse.json(category, { status: 201 });
}
