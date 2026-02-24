import { DocsArticle, DocsCallout, DocsSection } from "@/components/marketing/docs-content";

export default function DocsIntegrationsPage() {
  return (
    <DocsArticle
      title="Integrations"
      intro="Integrations are staged behind secure token boundaries and explicit permission checks."
    >
      <DocsSection title="ERLC integration boundary">
        Current integration support is stub-oriented for safe validation. Tokens are hash-stored,
        shown once, and revocable. Event ingestion can be tested through sandbox tooling before
        enabling production traffic.
      </DocsSection>

      <DocsSection title="Integration token handling">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Tokens are never stored in plaintext.</li>
          <li>Creation displays raw value once for copy.</li>
          <li>Rotation and revoke actions are audited.</li>
          <li>Trial/limited roles cannot view secrets.</li>
        </ul>
      </DocsSection>

      <DocsSection title="Sandbox and event ingestion">
        Use sandbox tooling to send signed test events before enabling live traffic. Test events
        should map into safe tenant-scoped audit entries so operators can validate behavior without
        touching production game data.
      </DocsSection>

      <DocsSection title="Operational readiness checklist">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Enable rate limiting and signature verification.</li>
          <li>Confirm integration key ownership and revoke process.</li>
          <li>Validate event-to-audit mapping in a test tenant.</li>
          <li>Set alerting for ingestion failures and stale syncs.</li>
        </ul>
      </DocsSection>

      <DocsSection id="desktop" title="Desktop client notes">
        The desktop wrapper follows web-auth/session rules. It does not create an alternate auth
        model and does not require storing user passwords on the client.
      </DocsSection>

      <DocsCallout tone="warning">
        Do not expose integration endpoints publicly without rate limiting, signature verification,
        and tenant-safe event mapping.
      </DocsCallout>

      <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
    </DocsArticle>
  );
}
