import Image from "next/image";
import type { ReactElement } from "react";

const searchFeatures = [
  { title: "Find jobs that actually fit", description: "Search by title and location or paste a job link. Get matched roles you can quickly scan." },
  { title: "Know the Company Before You Apply", description: "Stop guessing what a company is about. NextRole browses their site and gives you everything you need to apply with confidence." },
  { title: "Keep track of every application", description: "Keep a clear view of every job you’ve found, tailored. Your activity and progress all stay in one simple place." },
];
const matchFeatures = [
  { title: "Understand your match score", description: "See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what’s missing." },
  { title: "AI-Powered Job Matching", description: "Stop guessing which jobs are worth applying to. NextRole scores every role against your actual skills so you can focus on the ones that matter." },
  { title: "Focus on the right roles", description: "Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying." },
];

export function Features(): ReactElement {
  return <>
    <section aria-labelledby="search-title" className="grid border-b border-border lg:grid-cols-2">
      <div className="lg:pl-12">
        <h2 id="search-title" className="landing-feature-heading">Manage Your Job<br className="hidden lg:block" /> Search With Ease</h2>
        {searchFeatures.map((feature, index) => <div key={feature.title} className={`landing-feature-copy ${index === 0 ? "border-l-accent" : "border-l-border"}`}>
          <h3 className="text-lg font-semibold tracking-tight text-text-darker">{feature.title}</h3>
          <p className="mt-3 text-base leading-[1.65] text-text-secondary lg:text-lg">{feature.description}</p>
        </div>)}
      </div>
      <div className="flex items-center justify-center border-l border-border bg-surface-muted px-6 py-16">
        <Image src="/images/jobs-lists.png" alt="Example matches for Vercel, Stripe, Linear, Notion, OpenAI, and Figma with scores, salaries, and sources" width={2364} height={1778} sizes="(max-width: 768px) 90vw, 590px" className="h-auto w-full" />
      </div>
    </section>
    <div className="landing-stripe" aria-hidden="true" />
    <section aria-labelledby="confidence-title" className="grid border-b border-border lg:grid-cols-2">
      <div className="order-2 flex items-center justify-center bg-surface-muted px-10 py-16 lg:order-none lg:px-12">
        <Image src="/images/agnet-log.png" alt="Illustration of the NextRole agent finding matching roles and filtering jobs" width={2144} height={1656} sizes="(max-width: 768px) 85vw, 540px" className="h-auto w-full" />
      </div>
      <div className="border-l border-border lg:pl-12">
        <h2 id="confidence-title" className="landing-feature-heading">Apply With More<br className="hidden lg:block" /> Confidence, Every Time</h2>
        {matchFeatures.map((feature, index) => <div key={feature.title} className={`landing-feature-copy ${index === 1 ? "border-l-success" : "border-l-border"}`}>
          <h3 className="text-lg font-semibold tracking-tight text-text-darker">{feature.title}</h3>
          <p className="mt-3 text-base leading-[1.65] text-text-secondary lg:text-lg">{feature.description}</p>
        </div>)}
      </div>
    </section>
  </>;
}

