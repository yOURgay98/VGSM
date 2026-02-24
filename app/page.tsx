import { LandingContent } from "@/components/marketing/landing-content";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { getSessionUser } from "@/lib/services/auth";

export default async function HomePage() {
  let sessionUser: Awaited<ReturnType<typeof getSessionUser>> = null;
  try {
    sessionUser = await getSessionUser();
  } catch {
    sessionUser = null;
  }

  return (
    <MarketingShell
      sessionUser={sessionUser}
      showHeader={false}
      footerVariant="none"
      className="vsm-landing-immersive"
      contentClassName="pt-0 pb-8"
    >
      <LandingContent isAuthed={Boolean(sessionUser)} />
    </MarketingShell>
  );
}
