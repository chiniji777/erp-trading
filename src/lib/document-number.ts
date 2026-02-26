import { prisma } from "./prisma";

export async function generateDocumentNumber(prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const yearShort = year.toString().slice(-2);

  const seq = await prisma.documentSequence.upsert({
    where: { prefix },
    create: { prefix, lastNumber: 1, year },
    update: { lastNumber: { increment: 1 } },
  });

  // Reset number if year changed
  if (seq.year !== year) {
    const updated = await prisma.documentSequence.update({
      where: { prefix },
      data: { lastNumber: 1, year },
    });
    return `${prefix}${yearShort}-${String(updated.lastNumber).padStart(5, "0")}`;
  }

  return `${prefix}${yearShort}-${String(seq.lastNumber).padStart(5, "0")}`;
}
