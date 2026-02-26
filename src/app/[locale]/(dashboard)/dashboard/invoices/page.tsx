"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function InvoicesPage() {
  const t = useTranslations("nav");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("invoices")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("invoices")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            ใบแจ้งหนี้จะถูกสร้างอัตโนมัติเมื่อส่งสินค้า (Deliver) จากใบสั่งขาย
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
