import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/document-number";
import { invalidateCache, invalidateKey } from "@/lib/redis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { include: { unit: true } } } },
      createdBy: { select: { name: true } },
      invoices: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.status) {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // When delivering, deduct inventory
    if (body.status === "DELIVERED" && order.status === "CONFIRMED") {
      await prisma.$transaction(async (tx) => {
        await tx.salesOrder.update({
          where: { id },
          data: { status: "DELIVERED" },
        });

        for (const item of order.items) {
          // Deduct inventory
          await tx.inventory.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: "default-warehouse",
              },
            },
            create: {
              productId: item.productId,
              warehouseId: "default-warehouse",
              quantity: -item.quantity,
            },
            update: {
              quantity: { decrement: item.quantity },
            },
          });

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: "default-warehouse",
              type: "OUT",
              quantity: item.quantity,
              reference: order.soNumber,
              notes: `ส่งสินค้าจาก SO: ${order.soNumber}`,
            },
          });

          await tx.salesOrderItem.update({
            where: { id: item.id },
            data: { deliveredQty: item.quantity },
          });
        }

        // Auto-create Invoice
        const company = await tx.company.findFirst();
        const vatRate = company?.vatRate || 7;
        const subtotal = order.items.reduce((sum, item) => sum + item.total, 0);
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;
        const invoiceNumber = await generateDocumentNumber("INV");

        await tx.invoice.create({
          data: {
            invoiceNumber,
            customerId: order.customerId,
            subtotal,
            vatAmount,
            total,
            notes: `สร้างอัตโนมัติจาก ${order.soNumber}`,
            salesOrders: { connect: [{ id: order.id }] },
            items: {
              create: order.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
              })),
            },
          },
        });
      });

      await Promise.all([invalidateKey("dashboard"), invalidateCache("inventory")]);

      const updated = await prisma.salesOrder.findUnique({
        where: { id },
        include: { customer: true, items: { include: { product: true } }, invoices: true },
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status: body.status },
      include: { customer: true, items: { include: { product: true } } },
    });
    await invalidateKey("dashboard");
    return NextResponse.json(updated);
  }

  // Full update
  const items = body.items || [];
  const subtotal = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );
  const vatRate = body.vatRate || 7;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: id } });

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: {
      customerId: body.customerId,
      date: body.date ? new Date(body.date) : undefined,
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
    include: { customer: true, items: { include: { product: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.salesOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
