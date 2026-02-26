"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  TrendingUp,
  FileText,
  Settings,
  Truck,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface NavGroup {
  label: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
  href?: string;
}

export function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>([
    "purchasing",
    "sales",
  ]);

  const navGroups: NavGroup[] = [
    {
      label: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      label: t("products"),
      icon: Package,
      href: "/dashboard/products",
    },
    {
      label: t("inventory"),
      icon: Warehouse,
      href: "/dashboard/inventory",
    },
    {
      label: t("purchasing"),
      icon: ShoppingCart,
      children: [
        {
          label: t("purchaseOrders"),
          href: "/dashboard/purchasing",
          icon: FileText,
        },
        {
          label: t("suppliers"),
          href: "/dashboard/suppliers",
          icon: Truck,
        },
      ],
    },
    {
      label: t("sales"),
      icon: TrendingUp,
      children: [
        {
          label: t("salesOrders"),
          href: "/dashboard/sales",
          icon: FileText,
        },
        {
          label: t("customers"),
          href: "/dashboard/customers",
          icon: UserCircle,
        },
        {
          label: t("invoices"),
          href: "/dashboard/invoices",
          icon: FileText,
        },
      ],
    },
    {
      label: t("reports"),
      icon: Users,
      href: "/dashboard/reports",
    },
    {
      label: t("settings"),
      icon: Settings,
      href: "/dashboard/settings",
    },
  ];

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label)
        ? prev.filter((g) => g !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-64 border-r bg-card min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary">ERP Trading</h1>
        <p className="text-xs text-muted-foreground">ระบบจัดการธุรกิจ</p>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navGroups.map((group) => {
          if (group.children) {
            const isOpen = openGroups.includes(group.label);
            const hasActiveChild = group.children.some((child) =>
              isActive(child.href)
            );

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    hasActiveChild
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <group.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {group.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          isActive(child.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={group.href}
              href={group.href!}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(group.href!)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <group.icon className="h-4 w-4" />
              {group.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
