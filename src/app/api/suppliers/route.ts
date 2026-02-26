import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const suppliers = await prisma.supplier.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(suppliers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supplier = await prisma.supplier.create({
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
  return NextResponse.json(supplier, { status: 201 });
}
