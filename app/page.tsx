import { Suspense, type ReactElement } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/homepage/Hero";
import { Features } from "@/components/homepage/Features";
import { Testimonial } from "@/components/homepage/Testimonial";
import { CallToAction } from "@/components/homepage/CallToAction";

export default function Home(): ReactElement {
  return <div className="min-h-screen bg-surface">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:block focus:p-4">Skip to content</a>
    <Suspense fallback={<div className="min-h-20 border-b border-border bg-surface" />}><Navbar /></Suspense>
    <main id="main-content" className="landing-frame mx-auto mt-8 border-x border-t border-border sm:mt-[60px]">
      <Hero />
      <div className="h-[72px] border-y border-border" aria-hidden="true" />
      <Features />
      <div className="landing-stripe" aria-hidden="true" />
      <Testimonial />
      <div className="landing-stripe" aria-hidden="true" />
      <CallToAction />
      <div className="landing-stripe" aria-hidden="true" />
    </main>
    <Footer />
  </div>;
}
