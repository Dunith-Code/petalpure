"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cartStore";

// The order is paid, so the cart is no longer needed
export default function ClearCartWhenPaid() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}