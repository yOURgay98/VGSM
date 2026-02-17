import { LandingContent } from "@/components/marketing/landing-content";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default async function HomePage() {
  return (
    <MarketingShell>
      <LandingContent />
    </MarketingShell>
  );
}
