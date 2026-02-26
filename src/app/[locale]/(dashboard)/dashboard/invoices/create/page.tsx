"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  code: string;
  name: string;
}

interface SalesOrder {
  id: string;
  soNumber: string;
  date: string;
  status: string;
  total: number;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product: { sku: string; name: string; nameTh: string | null; unit: { abbr: string | null } | null };
  }[];
}

export default function CreateInvoicePage() {
  const t = useTranslations("invoices");
  const tc = useTranslations("common");
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selectedSOIds, setSelectedSOIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then(setCustomers);
  }, []);

  useEffect(() => {
    if (!customerId) {
      setSalesOrders([]);
      setSelectedSOIds([]);
      return;
    }
    fetch(`/api/sales-orders?customerId=${customerId}&forInvoice=true`)
      .then((r) => r.json())
      .then((data) => {
        setSalesOrders(data);
        setSelectedSOIds([]);
      });
  }, [customerId]);

  const toggleSO = (soId: string) => {
    setSelectedSOIds((prev) =>
      prev.includes(soId) ? prev.filter((id) => id !== soId) : [...prev, soId]
    );
  };

  const selectedOrders = salesOrders.filter((so) => selectedSOIds.includes(so.id));
  const allItems = selectedOrders.flatMap((so) => so.items);
  const subtotal = allItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = subtotal * 0.07;
  const total = subtotal + vatAmount;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);

  const handleCreate = async () => {
    if (!customerId || selectedSOIds.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        salesOrderIds: selectedSOIds,
        dueDate: dueDate || null,
        notes: notes || null,
      }),
    });
    const invoice = await res.json();
    setSaving(false);
    router.push(`/dashboard/invoices/${invoice.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("createInvoice")}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("selectCustomer")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectCustomer")} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label>{t("dueDate")}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{tc("notes")}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("grandTotal")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("vat")} (7%)</span>
                <span>{formatPrice(vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{t("grandTotal")}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              onClick={handleCreate}
              disabled={saving || selectedSOIds.length === 0}
            >
              {t("createInvoice")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {customerId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("selectSalesOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            {salesOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t("noSalesOrders")}</p>
            ) : (
              <div className="space-y-3">
                {salesOrders.map((so) => (
                  <div
                    key={so.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedSOIds.includes(so.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleSO(so.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selectedSOIds.includes(so.id)} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-medium">{so.soNumber}</span>
                          <span className="font-medium">{formatPrice(so.total)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(so.date), "dd/MM/yyyy")} | {so.items.length} items | {so.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSOIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("selectedSOs")} ({selectedSOIds.length})</CardTitle>
          </CardHeader>
          <CardContent>
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
                {allItems.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-mono">{item.product.sku}</TableCell>
                    <TableCell>{item.product.nameTh || item.product.name}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.product.unit?.abbr || ""}
                    </TableCell>
                    <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
