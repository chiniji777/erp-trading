"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrintDocument } from "@/components/shared/print-document";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  dueDate: string | null;
  status: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes: string | null;
  supplier: { name: string; nameTh: string | null; address: string | null; taxId: string | null; phone: string | null };
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
  RECEIVED: "รับแล้ว / Received",
  CANCELLED: "ยกเลิก / Cancelled",
};

export default function PrintPurchaseOrderPage() {
  const params = useParams();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    fetch(`/api/purchase-orders/${params.id}`)
      .then((r) => r.json())
      .then(setOrder);
  }, [params.id]);

  if (!order) {
    return <div className="flex items-center justify-center py-20">กำลังโหลด...</div>;
  }

  return (
    <div className="py-4">
      <PrintDocument
        type="PO"
        documentNumber={order.poNumber}
        date={order.date}
        dueDate={order.dueDate}
        status={statusMap[order.status] || order.status}
        contactLabel="ผู้ขาย / Supplier"
        contactName={order.supplier.nameTh || order.supplier.name}
        contactAddress={order.supplier.address}
        contactTaxId={order.supplier.taxId}
        contactPhone={order.supplier.phone}
        items={order.items}
        subtotal={order.subtotal}
        vatAmount={order.vatAmount}
        total={order.total}
        notes={order.notes}
      />
    </div>
  );
}
