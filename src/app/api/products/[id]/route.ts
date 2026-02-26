import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/redis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, unit: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const product = await prisma.product.update({
    where: { id },
    data: {
      sku: body.sku,
      name: body.name,
      nameTh: body.nameTh,
      description: body.description,
      categoryId: body.categoryId || null,
      unitId: body.unitId || null,
      buyPrice: parseFloat(body.buyPrice) || 0,
      sellPrice: parseFloat(body.sellPrice) || 0,
      minStock: parseInt(body.minStock) || 0,
      active: body.active,
    },
    include: { category: true, unit: true },
  });

  await invalidateCache("products");
  return NextResponse.json(product);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.product.delete({ where: { id } });

  await invalidateCache("products");
  return NextResponse.json({ success: true });
}
