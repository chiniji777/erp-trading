"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye } from "lucide-react";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string | null;
  status: string;
  total: number;
  customer: { name: string; code: string };
  salesOrders: { soNumber: string }[];
  _count: { items: number };
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  ISSUED: "outline",
  PAID: "default",
  CANCELLED: "destructive",
};

export default function InvoicesPage() {
  const t = useTranslations("invoices");
  const tc = useTranslations("common");
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchInvoices = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/invoices?${params}`);
    setInvoices(await res.json());
  }, [search, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => router.push("/dashboard/invoices/create")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("createInvoice")}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={`${tc("search")}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={tc("all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("all")}</SelectItem>
            <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
            <SelectItem value="ISSUED">{t("statusIssued")}</SelectItem>
            <SelectItem value="PAID">{t("statusPaid")}</SelectItem>
            <SelectItem value="CANCELLED">{t("statusCancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("invoiceNumber")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{tc("date")}</TableHead>
              <TableHead>{t("dueDate")}</TableHead>
              <TableHead className="text-center">SO</TableHead>
              <TableHead className="text-right">{t("grandTotal")}</TableHead>
              <TableHead className="text-center">{tc("status")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {tc("noData")}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    <div>{inv.customer.name}</div>
                    <div className="text-xs text-muted-foreground">{inv.customer.code}</div>
                  </TableCell>
                  <TableCell>{format(new Date(inv.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    {inv.dueDate ? format(new Date(inv.dueDate), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-muted-foreground">
                      {inv.salesOrders.map((so) => so.soNumber).join(", ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(inv.total)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusColors[inv.status]}>{statusLabel(inv.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
