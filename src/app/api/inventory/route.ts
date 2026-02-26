import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: {
        include: { category: true, unit: true },
      },
      warehouse: true,
    },
    orderBy: { product: { name: "asc" } },
  });

  // Also get products with no inventory record
  const productsWithStock = await prisma.product.findMany({
    include: {
      category: true,
      unit: true,
      inventory: {
        include: { warehouse: true },
      },
    },
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(productsWithStock);
}
