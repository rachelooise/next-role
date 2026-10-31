"use client";

import { isPostHogConfigured } from "@/instrumentation-client";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";

type HomepageActionLinkProps = {
  children: ReactNode;
  className: string;
  destination: "/dashboard" | "/login";
  label: "get_started" | "find_your_first_match" | "start_for_free";
  placement: "hero" | "call_to_action" | "navbar";
};

export function HomepageActionLink({ children, className, destination, label, placement }: HomepageActionLinkProps) {
  const handleClick = () => {
    if (isPostHogConfigured) {
      posthog.capture("landing_cta_clicked", { cta_label: label, destination, placement }, {
        transport: "sendBeacon",
        send_instantly: true,
      });
    }
  };

  return <Link href={destination} onClick={handleClick} className={className}>{children}</Link>;
}
