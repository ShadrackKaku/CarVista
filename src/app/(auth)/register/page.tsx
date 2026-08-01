import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your free CarVista account.",
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Join CarVista to buy, sell, import and maintain vehicles.
      </p>

      <div className="mt-8">
        <GoogleButton label="Sign up with Google" />
        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <RegisterForm callbackUrl={searchParams.callbackUrl} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
