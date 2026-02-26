import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter = {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to + "T23:59:59") }),
  };

  // Sales total
  const salesOrders = await prisma.salesOrder.findMany({
    where: {
      status: { in: ["CONFIRMED", "DELIVERED"] },
      date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
    },
    select: { total: true },
  });
  const salesTotal = salesOrders.reduce((sum, o) => sum + o.total, 0);

  // Purchase total
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      status: { in: ["CONFIRMED", "RECEIVED"] },
      date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
    },
    select: { total: true },
  });
  const purchaseTotal = purchaseOrders.reduce((sum, o) => sum + o.total, 0);

  // Top products by sales
  const topProducts = await prisma.salesOrderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });

  const productIds = topProducts.map((tp) => tp.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, nameTh: true },
  });

  const topProductsWithNames = topProducts.map((tp) => {
    const product = products.find((p) => p.id === tp.productId);
    return {
      name: product?.nameTh || product?.name || "Unknown",
      quantity: tp._sum.quantity || 0,
      total: tp._sum.total || 0,
    };
  });

  return NextResponse.json({
    salesTotal,
    purchaseTotal,
    profit: salesTotal - purchaseTotal,
    topProducts: topProductsWithNames,
  });
}
