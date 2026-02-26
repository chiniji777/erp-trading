"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintDocument } from "@/components/shared/print-document";

interface Invoice {
  invoiceNumber: string;
  date: string;
  dueDate: string | null;
  status: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes: string | null;
  customer: {
    name: string;
    address: string | null;
    taxId: string | null;
    phone: string | null;
  };
  items: {
    quantity: number;
    unitPrice: number;
    total: number;
    product: { sku: string; name: string; nameTh: string | null; unit: { abbr: string | null } | null };
  }[];
}

export default function InvoicePrintPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then((r) => r.json())
      .then(setInvoice);
  }, [params.id]);

  if (!invoice) return <div className="p-8 text-center">Loading...</div>;

  const statusMap: Record<string, string> = {
    DRAFT: "แบบร่าง / Draft",
    ISSUED: "ออกแล้ว / Issued",
    PAID: "ชำระแล้ว / Paid",
    CANCELLED: "ยกเลิก / Cancelled",
  };

  return (
    <PrintDocument
      type="INV"
      documentNumber={invoice.invoiceNumber}
      date={invoice.date}
      dueDate={invoice.dueDate}
      status={statusMap[invoice.status] || invoice.status}
      contactLabel="ลูกค้า / Customer"
      contactName={invoice.customer.name}
      contactAddress={invoice.customer.address}
      contactTaxId={invoice.customer.taxId}
      contactPhone={invoice.customer.phone}
      items={invoice.items}
      subtotal={invoice.subtotal}
      vatAmount={invoice.vatAmount}
      total={invoice.total}
      notes={invoice.notes}
    />
  );
}
