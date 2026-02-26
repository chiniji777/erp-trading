"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintDocument } from "@/components/shared/print-document";

interface SalesOrder {
  id: string;
  soNumber: string;
  date: string;
  dueDate: string | null;
  status: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes: string | null;
  customer: { name: string; nameTh: string | null; address: string | null; taxId: string | null; phone: string | null };
  items: {
    quantity: number;
    unitPrice: number;
    total: number;
    product: { sku: string; name: string; nameTh: string | null; unit: { abbr: string | null } | null };
  }[];
}

const statusMap: Record<string, string> = {
  DRAFT: "แบบร่าง / Draft",
  CONFIRMED: "ยืนยันแล้ว / Confirmed",
  DELIVERED: "ส่งแล้ว / Delivered",
  CANCELLED: "ยกเลิก / Cancelled",
};

export default function PrintSalesOrderPage() {
  const params = useParams();
  const [order, setOrder] = useState<SalesOrder | null>(null);

  useEffect(() => {
    fetch(`/api/sales-orders/${params.id}`)
      .then((r) => r.json())
      .then(setOrder);
  }, [params.id]);

  if (!order) {
    return <div className="flex items-center justify-center py-20">กำลังโหลด...</div>;
  }

  return (
    <div className="py-4">
      <PrintDocument
        type="SO"
        documentNumber={order.soNumber}
        date={order.date}
        dueDate={order.dueDate}
        status={statusMap[order.status] || order.status}
        contactLabel="ลูกค้า / Customer"
        contactName={order.customer.nameTh || order.customer.name}
        contactAddress={order.customer.address}
        contactTaxId={order.customer.taxId}
        contactPhone={order.customer.phone}
        items={order.items}
        subtotal={order.subtotal}
        vatAmount={order.vatAmount}
        total={order.total}
        notes={order.notes}
      />
    </div>
  );
}
