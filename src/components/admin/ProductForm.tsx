"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Variant = { id?: string; label: string; sku: string; price: string; stock: string };

export type ProductFormData = {
  id?: string;
  name: string;
  brand: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  images: string[];
  variants: Variant[];
};

const MAX_IMAGES = 6;
const MAX_MB = 5;

const input =
  "w-full rounded-xl border border-blush-200 bg-white px-3 py-2 text-ink focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-blush-200";
const label = "mb-1 block text-sm font-medium";

export default function ProductForm({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial?: ProductFormData;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "PetalPure");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [variants, setVariants] = useState<Variant[]>(
    initial?.variants ?? [{ label: "", sku: "", price: "", stock: "0" }],
  );
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateVariant(i: number, patch: Partial<Variant>) {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
    setError("");
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");

    const list = Array.from(files);
    if (images.length + list.length > MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    for (const f of list) {
      if (!f.type.startsWith("image/")) return setError("Only image files are allowed.");
      if (f.size > MAX_MB * 1024 * 1024) return setError(`Each image must be under ${MAX_MB}MB.`);
    }

    setUploading(true);
    try {
      const signRes = await fetch("/api/admin/upload/sign", { method: "POST" });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error || "Could not start upload");

      const urls: string[] = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sign.apiKey);
        fd.append("timestamp", String(sign.timestamp));
        fd.append("signature", sign.signature);
        fd.append("folder", sign.folder);

        const up = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
          method: "POST",
          body: fd,
        });
        const data = await up.json();
        if (!up.ok) throw new Error(data.error?.message || "Upload failed");
        urls.push(data.secure_url);
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brand, description, categoryId, isActive, images, variants }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Something went wrong");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-3xl space-y-6" noValidate>
      <section className="space-y-4 rounded-card border border-blush-100 bg-white p-5">
        <h2 className="text-xl font-semibold">Details</h2>
        <div>
          <label htmlFor="name" className={label}>Product name</label>
          <input id="name" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} className={input} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={label}>Category</label>
            <select id="category" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setError(""); }} className={input}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="brand" className={label}>Brand</label>
            <input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="description" className={label}>Description</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(""); }}
            className={input}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-rose-500" />
          Visible in the store
        </label>
      </section>

      <section className="space-y-4 rounded-card border border-blush-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Images</h2>
          <span className="text-xs text-muted">{images.length}/{MAX_IMAGES}</span>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Product image ${i + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium">Main</span>
                )}
                <button
                  type="button"
                  onClick={() => setImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                  aria-label={`Remove image ${i + 1}`}
                  className="absolute right-1 top-1 rounded-full bg-white/90 px-2 text-sm text-rose-600 hover:bg-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading || images.length >= MAX_IMAGES}
            onChange={(e) => {
              uploadFiles(e.target.files);
              e.target.value = "";
            }}
            aria-label="Upload product images"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blush-100 file:px-4 file:py-2 file:font-medium file:text-rose-600 hover:file:bg-blush-200"
          />
          <p className="mt-1 text-xs text-muted">
            {uploading ? "Uploading…" : `JPG or PNG, up to ${MAX_MB}MB each. The first image is the main one.`}
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-card border border-blush-100 bg-white p-5">
        <h2 className="text-xl font-semibold">Variants</h2>
        <p className="text-xs text-muted">
          Each size or shade has its own price and stock. SKUs must be unique.
        </p>

        {variants.map((v, i) => (
          <div key={v.id ?? i} className="grid grid-cols-2 gap-3 rounded-xl border border-blush-100 p-3 sm:grid-cols-5">
            <div>
              <label className={label} htmlFor={`label-${i}`}>Label</label>
              <input id={`label-${i}`} value={v.label} onChange={(e) => updateVariant(i, { label: e.target.value })} placeholder="50ml" className={input} />
            </div>
            <div>
              <label className={label} htmlFor={`sku-${i}`}>SKU</label>
              <input id={`sku-${i}`} value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} placeholder="RHFC-50" className={input} />
            </div>
            <div>
              <label className={label} htmlFor={`price-${i}`}>Price (Rs.)</label>
              <input id={`price-${i}`} type="number" min="0" step="0.01" inputMode="decimal" value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label} htmlFor={`stock-${i}`}>Stock</label>
              <input id={`stock-${i}`} type="number" min="0" step="1" inputMode="numeric" value={v.stock} onChange={(e) => updateVariant(i, { stock: e.target.value })} className={input} />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                disabled={variants.length === 1}
                onClick={() => setVariants((vs) => vs.filter((_, idx) => idx !== i))}
                className="w-full rounded-xl border border-blush-200 px-3 py-2 text-sm text-muted transition hover:text-rose-600 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setVariants((vs) => [...vs, { label: "", sku: "", price: "", stock: "0" }])}
          className="rounded-xl border border-dashed border-rose-500/50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-blush-50"
        >
          + Add variant
        </button>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-blush-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          disabled={saving || uploading}
          className="rounded-xl bg-rose-500 px-6 py-2.5 font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-xl px-5 py-2.5 text-muted transition hover:text-rose-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}