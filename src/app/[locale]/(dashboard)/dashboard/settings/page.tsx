"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Company {
  id: string;
  name: string;
  nameTh: string | null;
  address: string | null;
  addressTh: string | null;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  vatRate: number;
  logo: string | null;
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { data: serverCompany } = useSWR<Company>("/api/settings/company");
  const [company, setCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (serverCompany && !company) setCompany(serverCompany);
  }, [serverCompany, company]);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    await fetch("/api/settings/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    });
    setSaving(false);
  };

  if (!company) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("company")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("companyName")} (EN)</Label>
              <Input
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("companyName")} (TH)</Label>
              <Input
                value={company.nameTh || ""}
                onChange={(e) => setCompany({ ...company, nameTh: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("taxId")}</Label>
              <Input
                value={company.taxId || ""}
                onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input
                value={company.phone || ""}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("address")} (EN)</Label>
              <Input
                value={company.address || ""}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("address")} (TH)</Label>
              <Input
                value={company.addressTh || ""}
                onChange={(e) => setCompany({ ...company, addressTh: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={company.email || ""}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("vatRate")}</Label>
              <Input
                type="number"
                className="w-32"
                value={company.vatRate}
                onChange={(e) => setCompany({ ...company, vatRate: parseFloat(e.target.value) || 7 })}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {tc("save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
