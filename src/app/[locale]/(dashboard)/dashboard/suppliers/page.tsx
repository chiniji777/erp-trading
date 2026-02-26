"use client";

import { useTranslations } from "next-intl";
import { ContactPage } from "@/components/shared/contact-page";

export default function SuppliersPage() {
  const t = useTranslations("suppliers");
  const tc = useTranslations("common");

  return (
    <ContactPage
      title={t("title")}
      addLabel={t("addSupplier")}
      editLabel={t("editSupplier")}
      apiPath="/api/suppliers"
      labels={{
        code: t("code"),
        name: t("name"),
        contact: t("contact"),
        phone: t("phone"),
        email: t("email"),
        address: t("address"),
        taxId: t("taxId"),
      }}
      commonLabels={{
        search: tc("search"),
        save: tc("save"),
        cancel: tc("cancel"),
        noData: tc("noData"),
        actions: tc("actions"),
        status: tc("status"),
        active: tc("active"),
        inactive: tc("inactive"),
      }}
    />
  );
}
