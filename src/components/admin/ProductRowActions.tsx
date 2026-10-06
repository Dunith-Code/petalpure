"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Could not delete");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="whitespace-nowrap text-right">
      <Link href={`/admin/products/${id}`} className="mr-3 font-medium text-rose-600 hover:underline">
        Edit
      </Link>
      <button onClick={remove} disabled={busy} className="text-muted hover:text-rose-600 hover:underline">
        Delete
      </button>
      {error && <p className="mt-1 max-w-56 whitespace-normal text-xs text-rose-600">{error}</p>}
    </div>
  );
}