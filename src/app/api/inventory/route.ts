import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";

export async function GET() {
  const productsWithStock = await cached("inventory", () =>
    prisma.product.findMany({
      include: {
        category: true,
        unit: true,
        inventory: {
          include: { warehouse: true },
        },
      },
      where: { active: true },
      orderBy: { name: "asc" },
    }), 15);

  return NextResponse.json(productsWithStock);
}
