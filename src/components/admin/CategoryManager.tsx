"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cat = { id: string; name: string; slug: string; productCount: number };

const input =
  "rounded-xl border border-blush-200 bg-white px-3 py-2 text-ink focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-blush-200";

export default function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: object) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Something went wrong");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (await call("/api/admin/categories", "POST", { name })) setName("");
  }

  async function save(id: string) {
    if (await call(`/api/admin/categories/${id}`, "PATCH", { name: editName })) {
      setEditingId(null);
    }
  }

  async function remove(c: Cat) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    await call(`/api/admin/categories/${c.id}`, "DELETE");
  }

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="New category name"
          aria-label="New category name"
          className={`${input} flex-1`}
        />
        <button
          disabled={busy}
          className="rounded-xl bg-rose-500 px-5 py-2 font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          Add category
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-lg bg-blush-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-card border border-blush-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush-50 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No categories yet. Add your first one above.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-blush-100">
                <td className="px-4 py-3">
                  {editingId === c.id ? (
                    <input
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setError("");
                      }}
                      aria-label="Category name"
                      className={input}
                      autoFocus
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{c.slug}</td>
                <td className="px-4 py-3">{c.productCount}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {editingId === c.id ? (
                    <>
                      <button
                        onClick={() => save(c.id)}
                        disabled={busy}
                        className="mr-3 font-medium text-rose-600 hover:underline"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setError("");
                        }}
                        className="text-muted hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setEditName(c.name);
                          setError("");
                        }}
                        className="mr-3 font-medium text-rose-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(c)}
                        disabled={busy}
                        className="text-muted hover:text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}