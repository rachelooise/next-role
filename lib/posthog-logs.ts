import "server-only";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { after } from "next/server";
import { loggerProvider } from "@/instrumentation";

const logger = loggerProvider?.getLogger("posthog-wizard.oauth-callback");

type OAuthCallbackOutcome = "missing_or_rejected" | "exchange_failed" | "authenticated";

export function logOAuthCallback(outcome: OAuthCallbackOutcome): void {
  logger?.emit({
    body: "OAuth callback completed",
    severityNumber: outcome === "authenticated" ? SeverityNumber.INFO : SeverityNumber.WARN,
    attributes: { auth_flow: "oauth_callback", outcome },
  });
}

export function flushPostHogLogs(): void {
  const provider = loggerProvider;
  if (provider) {
    after(async () => {
      await provider.forceFlush();
    });
  }
}
