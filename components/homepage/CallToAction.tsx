import { Suspense, type ReactElement } from "react";
import { HomepageActions } from "@/components/homepage/HomepageActions";

export function CallToAction(): ReactElement {
  return <section aria-labelledby="cta-title" className="landing-glow flex min-h-[408px] flex-col items-center justify-center px-6 py-16 text-center">
    <h2 id="cta-title" className="max-w-[850px] text-4xl font-semibold leading-[1.1] tracking-[-0.055em] text-text-slate lg:text-[56px]">Your next job search can feel a<br className="hidden lg:block" /> lot less overwhelming</h2>
    <p className="mb-7 mt-7 text-base leading-7 text-text-dark lg:text-lg">Set up your profile, upload your resume, and start finding matches in minutes.</p>
    <Suspense fallback={<p className="min-h-10 text-sm text-text-secondary">Loading…</p>}><HomepageActions placement="call_to_action" /></Suspense>
  </section>;
}
