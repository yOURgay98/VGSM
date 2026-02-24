import { DocsArticle, DocsCallout, DocsSection } from "@/components/marketing/docs-content";

export default function DocsPrivacyPage() {
  return (
    <DocsArticle
      title="Privacy / Data Policy"
      intro="Vanguard collects only the data required for security, moderation operations, and accountability."
    >
      <DocsSection title="What we collect">
        Account identity (email/name), role and membership context, session metadata, moderation and
        dispatch actions, and audit events.
      </DocsSection>

      <DocsSection title="What we do not store as raw values">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>We do NOT store raw API keys or token secrets in logs.</li>
          <li>We do NOT store plaintext access keys.</li>
          <li>We do NOT store raw credential payloads in audit metadata.</li>
          <li>We do NOT store raw IP addresses in standard audit records.</li>
        </ul>
      </DocsSection>

      <DocsSection title="Why this data exists">
        Data supports authentication, abuse prevention, workflow execution, incident investigation,
        and post-incident integrity review.
      </DocsSection>

      <DocsSection title="Retention policy">
        Retention is driven by security and operational accountability requirements. Policy windows
        can be tightened by community configuration as retention controls mature, and older data is
        archived or pruned according to policy.
      </DocsSection>

      <DocsSection title="Access boundaries">
        Sensitive records are tenant-scoped and permission-gated. Trial/limited roles cannot access
        secret-bearing controls or export-sensitive datasets.
      </DocsSection>

      <DocsCallout>
        This policy page is the canonical docs statement for data behavior and is kept aligned with
        the live platform implementation.
      </DocsCallout>

      <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
    </DocsArticle>
  );
}
