"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle, Printer, Banknote, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Invoice {
  id: string;
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
    code: string;
    phone: string | null;
    address: string | null;
    taxId: string | null;
  };
  salesOrders: {
    id: string;
    soNumber: string;
    date: string;
    status: string;
    total: number;
  }[];
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product: { sku: string; name: string; nameTh: string | null; unit: { abbr: string | null } | null };
  }[];
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  ISSUED: "outline",
  PAID: "default",
  CANCELLED: "destructive",
};

export default function InvoiceDetailPage() {
  const t = useTranslations("invoices");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then((r) => r.json())
      .then(setInvoice);
  }, [params.id]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/invoices/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const res = await fetch(`/api/invoices/${params.id}`);
    setInvoice(await res.json());
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: t("statusDraft"),
      ISSUED: t("statusIssued"),
      PAID: t("statusPaid"),
      CANCELLED: t("statusCancelled"),
    };
    return map[s] || s;
  };

  if (!invoice) {
    return <div className="flex items-center justify-center py-8">{tc("loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <Badge variant={statusColors[invoice.status]}>{statusLabel(invoice.status)}</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/invoices/${params.id}/print`)}>
            <Printer className="mr-2 h-4 w-4" />{tc("print")}
          </Button>
          {invoice.status === "DRAFT" && (
            <>
              <Button variant="outline" onClick={() => updateStatus("CANCELLED")}>
                <XCircle className="mr-2 h-4 w-4" />{t("statusCancelled")}
              </Button>
              <Button onClick={() => updateStatus("ISSUED")}>
                <CheckCircle className="mr-2 h-4 w-4" />{t("issue")}
              </Button>
            </>
          )}
          {invoice.status === "ISSUED" && (
            <Button onClick={() => updateStatus("PAID")}>
              <Banknote className="mr-2 h-4 w-4" />{t("markPaid")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("customer")}</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{invoice.customer.name}</p>
            <p className="text-muted-foreground">{invoice.customer.code}</p>
            {invoice.customer.address && <p className="text-xs">{invoice.customer.address}</p>}
            {invoice.customer.taxId && <p className="text-xs">Tax ID: {invoice.customer.taxId}</p>}
            {invoice.customer.phone && <p>{invoice.customer.phone}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">{tc("date")}</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{tc("date")}: {format(new Date(invoice.date), "dd/MM/yyyy")}</p>
            {invoice.dueDate && <p>{t("dueDate")}: {format(new Date(invoice.dueDate), "dd/MM/yyyy")}</p>}
            <div className="mt-2">
              <p className="text-muted-foreground text-xs mb-1">{t("relatedSOs")}:</p>
              {invoice.salesOrders.map((so) => (
                <Badge key={so.id} variant="outline" className="mr-1 mb-1 cursor-pointer"
                  onClick={() => router.push(`/dashboard/sales/${so.id}`)}
                >
                  {so.soNumber}
                </Badge>
              ))}
            </div>
            {invoice.notes && <p className="mt-2 text-muted-foreground">{invoice.notes}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>{t("product")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
                <TableHead className="text-right">{t("unitPrice")}</TableHead>
                <TableHead className="text-right">{t("lineTotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-mono">{item.product.sku}</TableCell>
                  <TableCell>{item.product.nameTh || item.product.name}</TableCell>
                  <TableCell className="text-right">{item.quantity} {item.product.unit?.abbr || ""}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span><span>{formatPrice(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("vat")} (7%)</span><span>{formatPrice(invoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{t("grandTotal")}</span><span>{formatPrice(invoice.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
