import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/redis";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      code: body.code,
      name: body.name,
      nameTh: body.nameTh,
      contact: body.contact,
      phone: body.phone,
      email: body.email,
      address: body.address,
      taxId: body.taxId,
    },
  });
  await invalidateCache("suppliers");
  return NextResponse.json(supplier);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.supplier.delete({ where: { id } });
  await invalidateCache("suppliers");
  return NextResponse.json({ success: true });
}
