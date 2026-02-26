import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/document-number";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const customerId = searchParams.get("customerId") || undefined;
  const forInvoice = searchParams.get("forInvoice") === "true";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  // For invoice creation: show CONFIRMED/DELIVERED SOs that don't have invoices yet
  if (forInvoice) {
    where.status = { in: ["CONFIRMED", "DELIVERED"] };
    where.invoices = { none: {} };
  }

  const orders = await prisma.salesOrder.findMany({
    where,
    include: {
      customer: true,
      items: { include: { product: { include: { unit: true } } } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const soNumber = await generateDocumentNumber("SO");

  const items = body.items || [];
  const subtotal = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );
  const vatRate = body.vatRate || 7;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  const order = await prisma.salesOrder.create({
    data: {
      soNumber,
      customerId: body.customerId,
      date: body.date ? new Date(body.date) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes,
      subtotal,
      vatAmount,
      total,
      items: {
        create: items.map(
          (item: { productId: string; quantity: number; unitPrice: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })
        ),
      },
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
