"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NEXT_STATUSES, PAYMENT_STATUSES, STATUS_LABEL, type OrderStatusT, type PaymentStatusT } from "@/lib/orders";

export default function OrderControls({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: OrderStatusT;
  paymentStatus: PaymentStatusT;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState<PaymentStatusT>(paymentStatus);

  async function update(body: object) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Something went wrong");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function move(next: OrderStatusT) {
    if (next === "CANCELLED" && !confirm("Cancel this order? Reserved stock will be returned to inventory.")) return;
    update({ status: next });
  }

  const next = NEXT_STATUSES[status];
  const cancelled = status === "CANCELLED";

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">Order status</p>
        {next.length === 0 ? (
          <p className="text-sm text-muted">No further changes. This order is {STATUS_LABEL[status].toLowerCase()}.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {next.map((n) => (
              <button
                key={n}
                disabled={busy}
                onClick={() => move(n)}
                className={
                  n === "CANCELLED"
                    ? "rounded-xl border border-blush-200 px-4 py-2 text-sm text-muted transition hover:text-rose-600 disabled:opacity-50"
                    : "rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-50"
                }
              >
                {n === "CANCELLED" ? "Cancel order" : `Mark ${STATUS_LABEL[n].toLowerCase()}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="pay" className="mb-2 block text-sm font-medium">Payment status</label>
        <div className="flex gap-2">
          <select
            id="pay"
            value={pay}
            disabled={cancelled || busy}
            onChange={(e) => setPay(e.target.value as PaymentStatusT)}
            className="rounded-xl border border-blush-200 bg-white px-3 py-2 text-ink focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-blush-200 disabled:opacity-50"
          >
            {PAYMENT_STATUSES.map((p) => (
              <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <button
            disabled={cancelled || busy || pay === paymentStatus}
            onClick={() => update({ paymentStatus: pay })}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-blush-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      )}
    </div>
  );
}