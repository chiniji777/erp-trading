import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";

export async function GET() {
  const data = await cached("dashboard", async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sales this month
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        status: { in: ["CONFIRMED", "DELIVERED"] },
        date: { gte: startOfMonth },
      },
      select: { total: true },
    });
    const salesThisMonth = salesOrders.reduce((sum, o) => sum + o.total, 0);

    // Purchases this month
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: ["CONFIRMED", "RECEIVED"] },
        date: { gte: startOfMonth },
      },
      select: { total: true },
    });
    const purchasesThisMonth = purchaseOrders.reduce((sum, o) => sum + o.total, 0);

    // Total products
    const totalProducts = await prisma.product.count({ where: { active: true } });

    // Low stock count
    const productsWithStock = await prisma.product.findMany({
      where: { active: true, minStock: { gt: 0 } },
      include: {
        inventory: { select: { quantity: true } },
      },
    });

    const lowStockCount = productsWithStock.filter((p) => {
      const totalQty = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      return totalQty <= p.minStock;
    }).length;

    // Recent sales
    const recentSales = await prisma.salesOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        soNumber: true,
        total: true,
        status: true,
        date: true,
        customer: { select: { name: true } },
      },
    });

    // Recent purchases
    const recentPurchases = await prisma.purchaseOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        poNumber: true,
        total: true,
        status: true,
        date: true,
        supplier: { select: { name: true } },
      },
    });

    return {
      salesThisMonth,
      purchasesThisMonth,
      totalProducts,
      lowStockCount,
      recentSales,
      recentPurchases,
    };
  }, 15);

  return NextResponse.json(data);
}
