"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={signOut} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-blush-50 hover:text-rose-600">
      Sign out
    </button>
  );
}