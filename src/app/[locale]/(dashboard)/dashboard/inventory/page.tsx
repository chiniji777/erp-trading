"use client";

import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/shared/page-loading";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductWithStock {
  id: string;
  sku: string;
  name: string;
  nameTh: string | null;
  minStock: number;
  category: { name: string } | null;
  unit: { abbr: string | null; name: string } | null;
  inventory: { quantity: number; warehouse: { name: string } }[];
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  product: { sku: string; name: string; nameTh: string | null };
  warehouse: { name: string };
}

const typeColors: Record<string, "default" | "secondary" | "destructive"> = {
  IN: "default",
  OUT: "destructive",
  ADJUST: "secondary",
};

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const tc = useTranslations("common");
  const { data: products = [], isLoading: loadingProducts } = useSWR<ProductWithStock[]>("/api/inventory");
  const { data: movements = [], isLoading: loadingMovements } = useSWR<StockMovement[]>("/api/inventory/movements");

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      IN: t("typeIn"),
      OUT: t("typeOut"),
      ADJUST: t("typeAdjust"),
    };
    return map[type] || type;
  };

  if (loadingProducts && loadingMovements) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">{t("currentStock")}</TabsTrigger>
          <TabsTrigger value="movements">{t("movements")}</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>{tc("all")}</TableHead>
                  <TableHead>{t("warehouse")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-center">{tc("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {tc("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const totalQty = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
                    const isLow = totalQty <= product.minStock && product.minStock > 0;
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono">{product.sku}</TableCell>
                        <TableCell>
                          <div>{product.nameTh || product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {product.category?.name || ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.inventory.length > 0
                            ? product.inventory.map((inv) => inv.warehouse.name).join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {totalQty} {product.unit?.abbr || ""}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {product.minStock}
                        </TableCell>
                        <TableCell className="text-center">
                          {isLow ? (
                            <Badge variant="destructive">{t("lowStockAlert")}</Badge>
                          ) : (
                            <Badge variant="default">{tc("active")}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tc("date")}</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>{tc("all")}</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead>{t("reference")}</TableHead>
                  <TableHead>{tc("notes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {tc("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{format(new Date(m.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell className="font-mono">{m.product.sku}</TableCell>
                      <TableCell>{m.product.nameTh || m.product.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={typeColors[m.type]}>{typeLabel(m.type)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                      <TableCell className="font-mono">{m.reference || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{m.notes || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
