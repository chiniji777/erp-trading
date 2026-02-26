"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  nameTh: string | null;
  buyPrice: number;
  sellPrice: number;
  minStock: number;
  active: boolean;
  category: { id: string; name: string; nameTh: string | null } | null;
  unit: { id: string; name: string; nameTh: string | null; abbr: string | null } | null;
}

interface Category {
  id: string;
  name: string;
  nameTh: string | null;
}

interface Unit {
  id: string;
  name: string;
  nameTh: string | null;
  abbr: string | null;
}

const emptyForm = {
  sku: "",
  name: "",
  nameTh: "",
  description: "",
  categoryId: "",
  unitId: "",
  buyPrice: "",
  sellPrice: "",
  minStock: "0",
};

export default function ProductsPage() {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setProducts(data);
  }, [search]);

  const fetchMasterData = async () => {
    const [catRes, unitRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/units"),
    ]);
    setCategories(await catRes.json());
    setUnits(await unitRes.json());
  };

  useEffect(() => {
    fetchProducts();
    fetchMasterData();
  }, [fetchProducts]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      nameTh: product.nameTh || "",
      description: "",
      categoryId: product.category?.id || "",
      unitId: product.unit?.id || "",
      buyPrice: product.buyPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      minStock: product.minStock.toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    setDialogOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(price);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addProduct")}
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={`${tc("search")}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("sku")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("unit")}</TableHead>
              <TableHead className="text-right">{t("buyPrice")}</TableHead>
              <TableHead className="text-right">{t("sellPrice")}</TableHead>
              <TableHead className="text-center">{tc("status")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {tc("noData")}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono">{product.sku}</TableCell>
                  <TableCell>
                    <div>{product.name}</div>
                    {product.nameTh && (
                      <div className="text-sm text-muted-foreground">
                        {product.nameTh}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{product.category?.name || "-"}</TableCell>
                  <TableCell>{product.unit?.abbr || product.unit?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(product.buyPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(product.sellPrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? tc("active") : tc("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("editProduct") : t("addProduct")}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("sku")}</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="SKU001"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("unit")}</Label>
                <Select
                  value={form.unitId}
                  onValueChange={(v) => setForm({ ...form, unitId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.nameTh || unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("nameEn")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("nameTh")}</Label>
              <Input
                value={form.nameTh}
                onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("category")}</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameTh || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("buyPrice")}</Label>
                <Input
                  type="number"
                  value={form.buyPrice}
                  onChange={(e) =>
                    setForm({ ...form, buyPrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("sellPrice")}</Label>
                <Input
                  type="number"
                  value={form.sellPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellPrice: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("minStock")}</Label>
              <Input
                type="number"
                value={form.minStock}
                onChange={(e) =>
                  setForm({ ...form, minStock: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
