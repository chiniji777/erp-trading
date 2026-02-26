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
import { ArrowLeft, CheckCircle, Printer, Truck, XCircle } from "lucide-react";
import { format } from "date-fns";

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
  customer: { name: string; code: string; phone: string | null };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    deliveredQty: number;
    product: { sku: string; name: string; nameTh: string | null; unit: { abbr: string | null } | null };
  }[];
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  CONFIRMED: "outline",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

export default function SalesOrderDetailPage() {
  const t = useTranslations("sales");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<SalesOrder | null>(null);

  useEffect(() => {
    fetch(`/api/sales-orders/${params.id}`)
      .then((r) => r.json())
      .then(setOrder);
  }, [params.id]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/sales-orders/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const res = await fetch(`/api/sales-orders/${params.id}`);
    setOrder(await res.json());
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: t("statusDraft"),
      CONFIRMED: t("statusConfirmed"),
      DELIVERED: t("statusDelivered"),
      CANCELLED: t("statusCancelled"),
    };
    return map[s] || s;
  };

  if (!order) {
    return <div className="flex items-center justify-center py-8">{tc("loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/sales")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.soNumber}</h1>
            <Badge variant={statusColors[order.status]}>{statusLabel(order.status)}</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/sales/${params.id}/print`)}>
            <Printer className="mr-2 h-4 w-4" />{tc("print")}
          </Button>
          {order.status === "DRAFT" && (
            <>
              <Button variant="outline" onClick={() => updateStatus("CANCELLED")}>
                <XCircle className="mr-2 h-4 w-4" />{t("statusCancelled")}
              </Button>
              <Button onClick={() => updateStatus("CONFIRMED")}>
                <CheckCircle className="mr-2 h-4 w-4" />{t("statusConfirmed")}
              </Button>
            </>
          )}
          {order.status === "CONFIRMED" && (
            <Button onClick={() => updateStatus("DELIVERED")}>
              <Truck className="mr-2 h-4 w-4" />{t("deliver")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("customer")}</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-muted-foreground">{order.customer.code}</p>
            {order.customer.phone && <p>{order.customer.phone}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">{tc("date")}</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{tc("date")}: {format(new Date(order.date), "dd/MM/yyyy")}</p>
            {order.dueDate && <p>{t("dueDate")}: {format(new Date(order.dueDate), "dd/MM/yyyy")}</p>}
            {order.notes && <p className="mt-2 text-muted-foreground">{order.notes}</p>}
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
              {order.items.map((item, idx) => (
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
                <span>{t("subtotal")}</span><span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("vat")} (7%)</span><span>{formatPrice(order.vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{t("grandTotal")}</span><span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
