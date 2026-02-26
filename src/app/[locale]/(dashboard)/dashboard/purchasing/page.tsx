"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Eye } from "lucide-react";
import { format } from "date-fns";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  status: string;
  total: number;
  supplier: { name: string };
  items: { id: string }[];
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  CONFIRMED: "outline",
  RECEIVED: "default",
  CANCELLED: "destructive",
};

export default function PurchaseOrdersPage() {
  const t = useTranslations("purchasing");
  const tc = useTranslations("common");
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOrders = useCallback(async () => {
    const params = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
    const res = await fetch(`/api/purchase-orders${params}`);
    setOrders(await res.json());
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: t("statusDraft"),
      CONFIRMED: t("statusConfirmed"),
      RECEIVED: t("statusReceived"),
      CANCELLED: t("statusCancelled"),
    };
    return map[s] || s;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href="/dashboard/purchasing/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("createPO")}
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc("all")}</SelectItem>
            <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
            <SelectItem value="CONFIRMED">{t("statusConfirmed")}</SelectItem>
            <SelectItem value="RECEIVED">{t("statusReceived")}</SelectItem>
            <SelectItem value="CANCELLED">{t("statusCancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("poNumber")}</TableHead>
              <TableHead>{tc("date")}</TableHead>
              <TableHead>{t("supplier")}</TableHead>
              <TableHead className="text-center">{tc("status")}</TableHead>
              <TableHead className="text-right">{t("grandTotal")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {tc("noData")}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">
                    {order.poNumber}
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{order.supplier.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusColors[order.status]}>
                      {statusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(order.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/purchasing/${order.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
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
