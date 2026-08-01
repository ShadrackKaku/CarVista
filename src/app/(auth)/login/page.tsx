import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthQueryToasts } from "@/components/auth/auth-query-toasts";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your CarVista account.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  return (
    <div>
      <Suspense fallback={null}>
        <AuthQueryToasts />
      </Suspense>

      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to manage your vehicles, imports and orders.
      </p>

      <div className="mt-8">
        <GoogleButton />
        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <LoginForm callbackUrl={searchParams.callbackUrl} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
