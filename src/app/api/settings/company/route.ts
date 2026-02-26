import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let company = await prisma.company.findFirst();

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "My Company",
        nameTh: "บริษัทของฉัน",
        vatRate: 7,
      },
    });
  }

  return NextResponse.json(company);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const company = await prisma.company.findFirst();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 404 });
  }

  const updated = await prisma.company.update({
    where: { id: company.id },
    data: {
      name: body.name,
      nameTh: body.nameTh,
      address: body.address,
      addressTh: body.addressTh,
      taxId: body.taxId,
      phone: body.phone,
      email: body.email,
      vatRate: body.vatRate,
    },
  });

  return NextResponse.json(updated);
}
