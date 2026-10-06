import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Create account | PetalPure" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-blush-50 px-4 py-12">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}