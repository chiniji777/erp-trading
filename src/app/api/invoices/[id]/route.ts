import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      salesOrders: { select: { id: true, soNumber: true, date: true, status: true, total: true } },
      items: { include: { product: { include: { unit: true } } } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.status) {
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: body.status },
      include: {
        customer: true,
        salesOrders: { select: { id: true, soNumber: true } },
        items: { include: { product: { include: { unit: true } } } },
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "No updates" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice || invoice.status !== "DRAFT") {
    return NextResponse.json({ error: "Can only delete draft invoices" }, { status: 400 });
  }

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
