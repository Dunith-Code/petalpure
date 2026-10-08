"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type InvRow = {
  id: string;
  product: string;
  active: boolean;
  label: string;
  sku: string;
  stock: number;
};

const LOW = 5;

export default function InventoryTable({ rows }: { rows: InvRow[] }) {
  const router = useRouter();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      (!lowOnly || r.stock <= LOW) &&
      (!q || r.product.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)),
  );

  async function save(r: InvRow) {
    const value = edits[r.id];
    if (value === undefined) return;
    setBusyId(r.id);
    setErrors((e) => ({ ...e, [r.id]: "" }));
    try {
      const res = await fetch(`/api/admin/inventory/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: value }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors((e) => ({ ...e, [r.id]: json.error || "Could not save" }));
        return;
      }
      setEdits((e) => {
        const next = { ...e };
        delete next[r.id];
        return next;
      });
      router.refresh();
    } catch {
      setErrors((e) => ({ ...e, [r.id]: "Network error" }));
    } finally {
      setBusyId(null);
    }
  }

  const input =
    "w-24 rounded-xl border border-blush-200 bg-white px-3 py-1.5 text-ink focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-blush-200";

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search product or SKU"
          aria-label="Search inventory"
          className="w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-ink focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-blush-200 sm:max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
            className="h-4 w-4 accent-rose-500"
          />
          Low stock only (≤ {LOW})
        </label>
      </div>

      <div className="overflow-x-auto rounded-card border border-blush-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush-50 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Nothing matches.
                </td>
              </tr>
            )}
            {visible.map((r) => {
              const dirty = edits[r.id] !== undefined && edits[r.id] !== String(r.stock);
              return (
                <tr key={r.id} className="border-t border-blush-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.product}</p>
                    {!r.active && <p className="text-xs text-muted">Hidden from store</p>}
                  </td>
                  <td className="px-4 py-3">{r.label}</td>
                  <td className="px-4 py-3 text-muted">{r.sku}</td>
                  <td className="px-4 py-3">
                    {r.stock === 0 ? (
                      <span className="rounded-full bg-blush-100 px-2.5 py-0.5 text-xs font-medium text-rose-600">Out of stock</span>
                    ) : r.stock <= LOW ? (
                      <span className="rounded-full bg-blush-100 px-2.5 py-0.5 text-xs font-medium text-rose-600">Low</span>
                    ) : (
                      <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium">In stock</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      aria-label={`Stock for ${r.product} ${r.label}`}
                      value={edits[r.id] ?? String(r.stock)}
                      onChange={(e) => {
                        setEdits((x) => ({ ...x, [r.id]: e.target.value }));
                        setErrors((x) => ({ ...x, [r.id]: "" }));
                      }}
                      className={input}
                    />
                    {errors[r.id] && <p className="mt-1 text-xs text-rose-600">{errors[r.id]}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => save(r)}
                      disabled={!dirty || busyId === r.id}
                      className="rounded-lg bg-rose-500 px-4 py-1.5 font-medium text-white transition hover:bg-rose-600 disabled:opacity-40"
                    >
                      {busyId === r.id ? "Saving…" : "Save"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}