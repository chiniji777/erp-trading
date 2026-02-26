import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/document-number";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const invoices = await prisma.invoice.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { invoiceNumber: { contains: search, mode: "insensitive" } },
                { customer: { name: { contains: search, mode: "insensitive" } } },
                { customer: { code: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {},
        status ? { status: status as "DRAFT" | "ISSUED" | "PAID" | "CANCELLED" } : {},
      ],
    },
    include: {
      customer: { select: { name: true, code: true } },
      salesOrders: { select: { soNumber: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId, salesOrderIds, dueDate, notes } = body;

  // Get all sales orders and their items
  const salesOrders = await prisma.salesOrder.findMany({
    where: {
      id: { in: salesOrderIds },
      customerId,
    },
    include: {
      items: { include: { product: true } },
    },
  });

  if (salesOrders.length === 0) {
    return NextResponse.json({ error: "No valid sales orders found" }, { status: 400 });
  }

  // Get company VAT rate
  const company = await prisma.company.findFirst();
  const vatRate = company?.vatRate || 7;

  // Collect all items from selected SOs
  const allItems: { productId: string; quantity: number; unitPrice: number; total: number }[] = [];
  for (const so of salesOrders) {
    for (const item of so.items) {
      allItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      });
    }
  }

  const subtotal = allItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  const invoiceNumber = await generateDocumentNumber("INV");

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes,
      subtotal,
      vatAmount,
      total,
      salesOrders: { connect: salesOrderIds.map((id: string) => ({ id })) },
      items: {
        create: allItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
    include: {
      customer: true,
      salesOrders: { select: { soNumber: true } },
      items: { include: { product: { include: { unit: true } } } },
    },
  });

  return NextResponse.json(invoice);
}
