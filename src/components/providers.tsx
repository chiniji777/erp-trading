"use client";

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          dedupingInterval: 5000,
        }}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
