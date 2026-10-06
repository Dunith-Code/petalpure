"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Mode = "login" | "register";

function safeNext(next: string | null) {
  // only allow same-site paths (prevents open redirects)
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        const fieldMsg = json.details && Object.values<string[]>(json.details)[0]?.[0];
        setError(fieldMsg || json.error || "Something went wrong");
        return;
      }

      const dest =
        safeNext(params.get("next")) ?? (json.user?.role === "ADMIN" ? "/admin" : "/");
      router.push(dest);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-xl border border-blush-200 bg-white px-4 py-2.5 text-ink placeholder:text-muted/60 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-blush-200";

  return (
    <div className="w-full max-w-md rounded-card border border-blush-100 bg-white p-8 shadow-sm">
      <h1 className="text-center text-3xl font-semibold">
        {isLogin ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-center text-sm text-muted">
        {isLogin ? "Sign in to your PetalPure account" : "Join PetalPure for gentle, glowing care"}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {!isLogin && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">Full name</label>
            <input id="name" name="name" autoComplete="name" required className={input} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={input} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            className={input}
          />
          {!isLogin && (
            <p className="mt-1 text-xs text-muted">At least 8 characters, with a letter and a number.</p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-blush-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-rose-500 py-2.5 font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {isLogin ? "New to PetalPure? " : "Already have an account? "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-rose-600 hover:underline"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}