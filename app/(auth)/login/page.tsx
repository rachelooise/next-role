import { Brand } from "@/components/layout/Brand";
import Link from "next/link";
import { Suspense, type ReactElement } from "react";
import { LoginContent } from "@/components/auth/LoginContent";

type Props = { searchParams: Promise<{ error?: string | string[] }> };

export default function LoginPage({ searchParams }: Props): ReactElement {
  return <main className="landing-glow flex min-h-screen items-center justify-center px-5 py-12">
    <section aria-labelledby="login-title" className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex justify-center"><Brand /></div>
      <h1 id="login-title" className="mt-8 text-center text-3xl font-semibold tracking-tight text-text-primary">Your next role starts here</h1>
      <p className="mt-3 text-center text-sm leading-6 text-text-secondary">Sign in to find your matches and get to know the companies behind them.</p>
      <Suspense fallback={<p role="status" className="py-8 text-center text-sm text-text-secondary">Preparing sign-in…</p>}><LoginContent searchParams={searchParams} /></Suspense>
      <Link href="/" className="mt-6 block text-center text-sm text-text-secondary hover:text-accent">Back to home</Link>
    </section>
  </main>;
}
