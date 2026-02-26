import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCache, invalidateKey } from "@/lib/redis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: { include: { unit: true } } } },
      createdBy: { select: { name: true } },
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

  // Handle status changes
  if (body.status) {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // When receiving goods, update inventory
    if (body.status === "RECEIVED" && order.status === "CONFIRMED") {
      await prisma.$transaction(async (tx) => {
        // Update PO status
        await tx.purchaseOrder.update({
          where: { id },
          data: { status: "RECEIVED" },
        });

        // Update inventory for each item
        for (const item of order.items) {
          // Upsert inventory
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
              quantity: item.quantity,
            },
            update: {
              quantity: { increment: item.quantity },
            },
          });

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: "default-warehouse",
              type: "IN",
              quantity: item.quantity,
              reference: order.poNumber,
              notes: `รับสินค้าจาก PO: ${order.poNumber}`,
            },
          });

          // Update received qty
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { receivedQty: item.quantity },
          });
        }
      });

      await Promise.all([invalidateKey("dashboard"), invalidateCache("inventory")]);

      const updated = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: { supplier: true, items: { include: { product: true } } },
      });
      return NextResponse.json(updated);
    }

    // Simple status update
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: body.status },
      include: { supplier: true, items: { include: { product: true } } },
    });
    await invalidateKey("dashboard");
    return NextResponse.json(updated);
  }

  // Full update (edit PO)
  const items = body.items || [];
  const subtotal = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );
  const vatRate = body.vatRate || 7;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  // Delete old items and create new ones
  await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      supplierId: body.supplierId,
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
    include: { supplier: true, items: { include: { product: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.purchaseOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
