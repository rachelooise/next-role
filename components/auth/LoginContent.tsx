import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

type Props = { searchParams: Promise<{ error?: string | string[] }> };

export async function LoginContent({ searchParams }: Props): Promise<ReactElement> {
  if (await getAuthUser()) redirect("/dashboard");
  const params = await searchParams;
  return <LoginForm callbackFailed={params.error === "oauth"} />;
}
