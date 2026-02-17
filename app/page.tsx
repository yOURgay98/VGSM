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
    <MarketingShell sessionUser={sessionUser}>
      <LandingContent isAuthed={Boolean(sessionUser)} />
    </MarketingShell>
  );
}
