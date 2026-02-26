import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const customer = await prisma.customer.create({
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
  return NextResponse.json(customer, { status: 201 });
}
