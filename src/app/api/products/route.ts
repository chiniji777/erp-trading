import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || undefined;

  const products = await prisma.product.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { nameTh: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        },
        categoryId ? { categoryId } : {},
      ],
    },
    include: {
      category: true,
      unit: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const product = await prisma.product.create({
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
    },
    include: { category: true, unit: true },
  });

  return NextResponse.json(product, { status: 201 });
}
