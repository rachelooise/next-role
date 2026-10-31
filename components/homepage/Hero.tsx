import Image from "next/image";
import { Suspense, type ReactElement } from "react";
import { HomepageActions } from "@/components/homepage/HomepageActions";

export function Hero(): ReactElement {
  return <section aria-labelledby="hero-title">
    <div className="landing-glow flex min-h-[416px] flex-col items-center justify-center px-5 py-16 text-center">
      <h1 id="hero-title" className="max-w-[920px] text-4xl font-bold leading-[1.08] tracking-[-0.055em] text-text-slate sm:text-5xl lg:text-[64px]">Job hunting is hard.<br />Your tools shouldn’t be.</h1>
      <p className="mb-6 mt-6 max-w-[620px] text-base leading-7 text-text-secondary lg:text-lg">Stop applying blind. NextRole finds the jobs, researches the companies, and gives you everything you need to stand out.</p>
      <Suspense fallback={<p className="min-h-10 text-sm text-text-secondary">Loading…</p>}><HomepageActions placement="hero" /></Suspense>
    </div>
    <div className="border-t border-border bg-surface-secondary px-4 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
      <Image src="/images/dashboard-demo.png" alt="NextRole dashboard preview with job match statistics, recent activity, and company research activity" width={4788} height={2416} sizes="(max-width: 768px) 94vw, 1180px" preload className="h-auto w-full" />
    </div>
  </section>;
}
