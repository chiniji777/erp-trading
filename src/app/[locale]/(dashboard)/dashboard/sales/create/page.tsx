"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

interface Customer {
  id: string;
  code: string;
  name: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  nameTh: string | null;
  sellPrice: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateSalesOrderPage() {
  const t = useTranslations("sales");
  const tc = useTranslations("common");
  const router = useRouter();
  const { data: customers = [] } = useSWR<Customer[]>("/api/customers");
  const { data: products = [] } = useSWR<Product[]>("/api/products");
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value as string,
        unitPrice: product?.sellPrice || 0,
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: Number(value) };
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vatAmount = subtotal * 0.07;
  const total = subtotal + vatAmount;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);

  const handleSubmit = async () => {
    if (!customerId || items.length === 0) return;
    setLoading(true);

    await fetch("/api/sales-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        date,
        dueDate: dueDate || null,
        notes,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }),
    });

    setLoading(false);
    router.push("/dashboard/sales");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/sales")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("createSO")}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("customer")}</CardTitle></CardHeader>
          <CardContent>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{tc("date")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{tc("date")}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("dueDate")}</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{tc("notes")}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("addItem")}</CardTitle>
          <Button size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addItem")}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>{t("product")}</TableHead>
                <TableHead className="w-32">{t("quantity")}</TableHead>
                <TableHead className="w-40">{t("unitPrice")}</TableHead>
                <TableHead className="w-40 text-right">{t("lineTotal")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{tc("noData")}</TableCell>
                </TableRow>
              ) : (
                items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Select value={item.productId} onValueChange={(v) => updateItem(idx, "productId", v)}>
                        <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.sku} - {p.nameTh || p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(item.quantity * item.unitPrice)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("vat")} (7%)</span><span>{formatPrice(vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{t("grandTotal")}</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/dashboard/sales")}>{tc("cancel")}</Button>
        <Button onClick={handleSubmit} disabled={loading || !customerId || items.length === 0}>{tc("save")}</Button>
      </div>
    </div>
  );
}
