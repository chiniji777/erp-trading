import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const customer = await prisma.customer.update({
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
  return NextResponse.json(customer);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
