import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DEFAULT_ACCESS_TOKEN_COOKIE } from "@insforge/sdk/ssr";
import { createInsforgeServer } from "@/lib/insforge-server";

export type AuthUser = { id: string; email: string };

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  // SDK validation reads the clock; never run session checks during prerendering.
  await connection();
  if (!(await cookies()).get(DEFAULT_ACCESS_TOKEN_COOKIE)?.value) return null;
  const client = await createInsforgeServer();
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email };
});

export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}
