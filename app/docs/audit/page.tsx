import { DocsArticle, DocsCallout, DocsSection } from "@/components/marketing/docs-content";

export default function DocsAuditPage() {
  return (
    <DocsArticle
      title="Audit & Logging"
      intro="Audit data is designed for accountability and verification, not surveillance."
    >
      <DocsSection title="What is logged">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Authentication events (success, failures, lockouts, session revocation).</li>
          <li>Role and permission changes.</li>
          <li>Invite/access key lifecycle events.</li>
          <li>Dispatch/case/report workflow transitions.</li>
          <li>Approval decisions and actor attribution.</li>
        </ul>
      </DocsSection>

      <DocsSection title="What is explicitly not logged as raw values">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>We do NOT store raw IP addresses in standard audit records.</li>
          <li>We do NOT store plaintext access keys or token secrets.</li>
          <li>We do NOT store raw credential payloads in action metadata.</li>
        </ul>
      </DocsSection>

      <DocsSection title="Integrity posture">
        Audit records are linked with integrity checks so tampering attempts are detectable.
        Exports remain permission-gated and tenant-scoped.
      </DocsSection>

      <DocsSection title="Retention posture">
        Retention windows are controlled by operational policy and can be tightened as compliance
        requirements evolve. Older low-value events can be archived or pruned based on policy.
      </DocsSection>

      <DocsSection title="Filter and export behavior">
        Audit views support pagination and scoped filters by actor, action type, severity, and
        date ranges. Export actions should remain available only to admin/owner roles.
      </DocsSection>

      <DocsCallout>
        No raw IP storage is used in standard audit records. Network signals, when needed for
        security, are sanitized before persistence.
      </DocsCallout>

      <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
    </DocsArticle>
  );
}
