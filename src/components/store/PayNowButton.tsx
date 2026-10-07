"use client";

import { useState } from "react";
import { startPayHere } from "@/lib/payhereClient";

export default function PayNowButton({ orderId, label = "Pay now" }: { orderId: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      await startPayHere(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={pay}
        disabled={busy}
        className="rounded-full bg-rose-500 px-8 py-3 font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
      >
        {busy ? "Redirecting to PayHere…" : label}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}