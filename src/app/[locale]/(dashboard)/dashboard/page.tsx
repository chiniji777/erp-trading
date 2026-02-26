"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardData {
  salesThisMonth: number;
  purchasesThisMonth: number;
  totalProducts: number;
  lowStockCount: number;
  recentSales: {
    id: string;
    soNumber: string;
    total: number;
    status: string;
    date: string;
    customer: { name: string };
  }[];
  recentPurchases: {
    id: string;
    poNumber: string;
    total: number;
    status: string;
    date: string;
    supplier: { name: string };
  }[];
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data } = useSWR<DashboardData>("/api/dashboard");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);

  const stats = [
    {
      title: t("salesThisMonth"),
      value: formatPrice(data?.salesThisMonth || 0),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: t("purchasesThisMonth"),
      value: formatPrice(data?.purchasesThisMonth || 0),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: t("totalProducts"),
      value: String(data?.totalProducts || 0),
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: t("lowStock"),
      value: String(data?.lowStockCount || 0),
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("recentSales")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.recentSales?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">-</p>
            ) : (
              <div className="space-y-3">
                {data.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-mono font-medium">{sale.soNumber}</span>
                      <span className="text-muted-foreground ml-2">{sale.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{sale.status}</Badge>
                      <span className="font-medium">{formatPrice(sale.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("recentPurchases")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.recentPurchases?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">-</p>
            ) : (
              <div className="space-y-3">
                {data.recentPurchases.map((po) => (
                  <div key={po.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-mono font-medium">{po.poNumber}</span>
                      <span className="text-muted-foreground ml-2">{po.supplier.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{po.status}</Badge>
                      <span className="font-medium">{formatPrice(po.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
