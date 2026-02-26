"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface PrintItem {
  product: { sku: string; name: string; nameTh: string | null; unit: { abbr: string | null } | null };
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PrintDocumentProps {
  type: "PO" | "SO" | "INV";
  documentNumber: string;
  date: string;
  dueDate?: string | null;
  status: string;
  contactLabel: string;
  contactName: string;
  contactAddress?: string | null;
  contactTaxId?: string | null;
  contactPhone?: string | null;
  items: PrintItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  notes?: string | null;
}

const docTitles: Record<string, { th: string; en: string }> = {
  PO: { th: "ใบสั่งซื้อ", en: "Purchase Order" },
  SO: { th: "ใบสั่งขาย", en: "Sales Order" },
  INV: { th: "ใบแจ้งหนี้/ใบกำกับภาษี", en: "Invoice / Tax Invoice" },
};

interface Company {
  name: string;
  nameTh: string | null;
  address: string | null;
  addressTh: string | null;
  taxId: string | null;
  phone: string | null;
  email: string | null;
}

export function PrintDocument(props: PrintDocumentProps) {
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetch("/api/settings/company")
      .then((r) => r.json())
      .then(setCompany);
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);

  const handlePrint = () => {
    window.print();
  };

  const title = docTitles[props.type] || { th: props.type, en: props.type };

  return (
    <>
      {/* Print button - hidden when printing */}
      <div className="print:hidden flex justify-end mb-4">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          พิมพ์ / Print
        </button>
      </div>

      {/* Document body */}
      <div className="bg-white text-black p-8 max-w-[210mm] mx-auto border print:border-0 print:p-0 print:max-w-full" id="print-area">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold">{company?.nameTh || company?.name || "..."}</h2>
            <p className="text-sm">{company?.name}</p>
            <p className="text-xs mt-1">{company?.addressTh || company?.address}</p>
            {company?.phone && <p className="text-xs">โทร: {company.phone}</p>}
            {company?.taxId && <p className="text-xs">เลขประจำตัวผู้เสียภาษี: {company.taxId}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold">{title.th}</h1>
            <p className="text-sm text-gray-600">{title.en}</p>
            <p className="text-lg font-mono font-bold mt-2">{props.documentNumber}</p>
          </div>
        </div>

        {/* Contact & Date info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border p-3 rounded">
            <p className="font-bold text-xs text-gray-500 mb-1">{props.contactLabel}</p>
            <p className="font-bold">{props.contactName}</p>
            {props.contactAddress && <p className="text-xs mt-1">{props.contactAddress}</p>}
            {props.contactTaxId && <p className="text-xs">Tax ID: {props.contactTaxId}</p>}
            {props.contactPhone && <p className="text-xs">Tel: {props.contactPhone}</p>}
          </div>
          <div className="border p-3 rounded">
            <div className="grid grid-cols-2 gap-y-1 text-xs">
              <span className="text-gray-500">วันที่ / Date:</span>
              <span>{format(new Date(props.date), "dd/MM/yyyy")}</span>
              {props.dueDate && (
                <>
                  <span className="text-gray-500">กำหนดชำระ / Due:</span>
                  <span>{format(new Date(props.dueDate), "dd/MM/yyyy")}</span>
                </>
              )}
              <span className="text-gray-500">สถานะ / Status:</span>
              <span className="font-medium">{props.status}</span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1.5 text-center w-10">ลำดับ</th>
              <th className="border px-2 py-1.5 text-left w-20">รหัส</th>
              <th className="border px-2 py-1.5 text-left">รายการ / Description</th>
              <th className="border px-2 py-1.5 text-right w-20">จำนวน</th>
              <th className="border px-2 py-1.5 text-right w-24">ราคา/หน่วย</th>
              <th className="border px-2 py-1.5 text-right w-28">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {props.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1 text-center">{idx + 1}</td>
                <td className="border px-2 py-1 font-mono text-xs">{item.product.sku}</td>
                <td className="border px-2 py-1">{item.product.nameTh || item.product.name}</td>
                <td className="border px-2 py-1 text-right">
                  {item.quantity} {item.product.unit?.abbr || ""}
                </td>
                <td className="border px-2 py-1 text-right">{formatPrice(item.unitPrice)}</td>
                <td className="border px-2 py-1 text-right">{formatPrice(item.total)}</td>
              </tr>
            ))}
            {/* Empty rows to fill space */}
            {props.items.length < 8 &&
              Array.from({ length: 8 - props.items.length }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="border px-2 py-1">&nbsp;</td>
                  <td className="border px-2 py-1"></td>
                  <td className="border px-2 py-1"></td>
                  <td className="border px-2 py-1"></td>
                  <td className="border px-2 py-1"></td>
                  <td className="border px-2 py-1"></td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Totals + Notes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-xs">
            {props.notes && (
              <div className="border p-2 rounded">
                <span className="text-gray-500">หมายเหตุ / Notes:</span>
                <p className="mt-1">{props.notes}</p>
              </div>
            )}
          </div>
          <div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-right pr-4">ยอดรวมก่อน VAT / Subtotal:</td>
                  <td className="py-1 text-right font-mono w-28">{formatPrice(props.subtotal)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-right pr-4">ภาษีมูลค่าเพิ่ม / VAT 7%:</td>
                  <td className="py-1 text-right font-mono">{formatPrice(props.vatAmount)}</td>
                </tr>
                <tr className="border-t-2 border-black font-bold text-base">
                  <td className="py-2 text-right pr-4">ยอดรวมสุทธิ / Grand Total:</td>
                  <td className="py-2 text-right font-mono">{formatPrice(props.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature lines */}
        <div className="grid grid-cols-2 gap-8 mt-12 text-center text-xs">
          <div>
            <div className="border-b border-black w-48 mx-auto mb-1"></div>
            <p>ผู้จัดทำ / Prepared By</p>
            <p className="text-gray-400">วันที่ / Date: ___/___/______</p>
          </div>
          <div>
            <div className="border-b border-black w-48 mx-auto mb-1"></div>
            <p>ผู้อนุมัติ / Approved By</p>
            <p className="text-gray-400">วันที่ / Date: ___/___/______</p>
          </div>
        </div>
      </div>

      {/* Print-specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 10mm;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </>
  );
}
