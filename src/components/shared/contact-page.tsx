"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface Contact {
  id: string;
  code: string;
  name: string;
  nameTh: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  active: boolean;
}

const emptyForm = {
  code: "",
  name: "",
  nameTh: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
  taxId: "",
};

interface ContactPageProps {
  title: string;
  addLabel: string;
  editLabel: string;
  apiPath: string;
  labels: {
    code: string;
    name: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    taxId: string;
  };
  commonLabels: {
    search: string;
    save: string;
    cancel: string;
    noData: string;
    actions: string;
    status: string;
    active: string;
    inactive: string;
  };
}

export function ContactPage({
  title,
  addLabel,
  editLabel,
  apiPath,
  labels,
  commonLabels,
}: ContactPageProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchContacts = useCallback(async () => {
    const res = await fetch(`${apiPath}?search=${encodeURIComponent(search)}`);
    setContacts(await res.json());
  }, [search, apiPath]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      name: c.name,
      nameTh: c.nameTh || "",
      contact: c.contact || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      taxId: c.taxId || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const url = editingId ? `${apiPath}/${editingId}` : apiPath;
    const method = editingId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setDialogOpen(false);
    fetchContacts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบข้อมูลนี้ใช่หรือไม่?")) return;
    await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    fetchContacts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={`${commonLabels.search}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{labels.code}</TableHead>
              <TableHead>{labels.name}</TableHead>
              <TableHead>{labels.contact}</TableHead>
              <TableHead>{labels.phone}</TableHead>
              <TableHead>{labels.email}</TableHead>
              <TableHead className="text-center">{commonLabels.status}</TableHead>
              <TableHead className="text-right">{commonLabels.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {commonLabels.noData}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.code}</TableCell>
                  <TableCell>
                    <div>{c.name}</div>
                    {c.nameTh && <div className="text-sm text-muted-foreground">{c.nameTh}</div>}
                  </TableCell>
                  <TableCell>{c.contact || "-"}</TableCell>
                  <TableCell>{c.phone || "-"}</TableCell>
                  <TableCell>{c.email || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={c.active ? "default" : "secondary"}>
                      {c.active ? commonLabels.active : commonLabels.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? editLabel : addLabel}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{labels.code}</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{labels.taxId}</Label>
                <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.name} (EN)</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{labels.name} (TH)</Label>
              <Input value={form.nameTh} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{labels.contact}</Label>
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{labels.phone}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.email}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{labels.address}</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{commonLabels.cancel}</Button>
            <Button onClick={handleSave} disabled={loading}>{commonLabels.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
