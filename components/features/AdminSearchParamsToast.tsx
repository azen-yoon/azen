"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminActionToast } from "@/components/features/AdminActionToast";
import {
  getAdminToastMessage,
  inferAdminToastScope,
  isAdminToastCode,
  type AdminToastScope,
} from "@/lib/admin-toast";

export const AdminSearchParamsToast = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const handledToastRef = useRef<string | null>(null);

  useEffect(() => {
    const toastCode = searchParams.get("toast");
    if (!isAdminToastCode(toastCode)) {
      handledToastRef.current = null;
      return;
    }

    const toastKey = searchParams.toString();
    if (handledToastRef.current === toastKey) {
      return;
    }
    handledToastRef.current = toastKey;

    const scopeParam = searchParams.get("scope");
    const scope: AdminToastScope =
      scopeParam === "product" || scopeParam === "service" ? scopeParam : inferAdminToastScope(pathname);

    setMessage(getAdminToastMessage(toastCode, scope));

    const next = new URLSearchParams(searchParams.toString());
    next.delete("toast");
    next.delete("scope");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (!message) {
    return null;
  }

  return <AdminActionToast message={message} onClose={() => setMessage(null)} />;
};
