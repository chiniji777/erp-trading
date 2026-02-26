import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/redis";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const category = await prisma.category.update({
    where: { id },
    data: { name: body.name, nameTh: body.nameTh },
  });
  await invalidateCache("categories");
  return NextResponse.json(category);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  await invalidateCache("categories");
  return NextResponse.json({ success: true });
}
