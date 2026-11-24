import { Suspense, type ReactElement } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { requireAuthUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { Profile } from "@/types/database";

async function ProfileContent(): Promise<ReactElement> {
  const user = await requireAuthUser();
  const client = await createInsforgeServer();
  const { data, error } = await client.database.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (error) return <section className="app-card"><h1 className="app-heading">Could not load your profile</h1><p role="alert" className="mt-3 app-muted">Please reload to try again. Your saved profile has not been changed.</p></section>;
  return <ProfileForm email={user.email} profile={data} />;
}

export default function ProfilePage(): ReactElement {
  return <><Suspense fallback={<div className="min-h-16 border-b bg-surface" />}><Navbar /></Suspense><main className="mx-auto w-full max-w-[1440px] p-8"><Suspense fallback={<p role="status">Loading your profile…</p>}><ProfileContent /></Suspense></main></>;
}
