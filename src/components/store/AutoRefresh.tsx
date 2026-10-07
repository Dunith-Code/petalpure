"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// PayHere confirms payments in the background, so re-check the order for ~40 seconds
export default function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      router.refresh();
      if (++n >= 10) clearInterval(t);
    }, 4000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}