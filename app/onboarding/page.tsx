import { redirect } from "next/navigation";

import { CreateCommunityCard } from "@/components/onboarding/create-community-card";
import { JoinCommunityCard } from "@/components/onboarding/join-community-card";
import { MacWindow } from "@/components/layout/mac-window";
import { listCommunitiesForUser } from "@/lib/services/community";
import { getSessionUser } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const communities = await listCommunitiesForUser(user.id);
  if (communities.length > 0) {
    redirect("/app/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.75),transparent_38%),radial-gradient(circle_at_15%_90%,rgba(214,220,232,0.55),transparent_42%),linear-gradient(160deg,rgba(245,246,249,0.72)_0%,rgba(236,238,242,0.62)_45%,rgba(225,230,238,0.72)_100%)] dark:bg-[radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.08),transparent_38%),radial-gradient(circle_at_15%_90%,rgba(255,255,255,0.05),transparent_42%),linear-gradient(160deg,#0f0f12_0%,#141416_55%,#0f0f12_100%)]" />

      <section className="relative w-full max-w-3xl space-y-3">
        <MacWindow
          title="Welcome to VSM"
          subtitle="Create a community or join with an access key/invite."
        >
          <p className="text-[13px] text-[color:var(--text-muted)]">
            Your account is signed in, but it is not a member of any VSM communities yet.
          </p>
          <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">
            First-time setup options are shown below. Use an invite/access key from an OWNER, or
            create a fresh community if you are starting one.
          </p>
        </MacWindow>

        <div className="grid gap-3 lg:grid-cols-2">
          <CreateCommunityCard />
          <JoinCommunityCard />
        </div>
      </section>
    </main>
  );
}
