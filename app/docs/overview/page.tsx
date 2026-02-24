import { DocsArticle, DocsSection } from "@/components/marketing/docs-content";

export default function DocsOverviewPage() {
  return (
    <DocsArticle
      title="Overview"
      intro="Vanguard is built for communities that need controlled moderation and operational command in one system."
    >
      <DocsSection title="Product scope">
        Vanguard combines moderation operations, command workflows, and security enforcement in one
        panel. It is not a generic community dashboard; the system is designed around controlled
        actions and accountable operator behavior.
      </DocsSection>

      <DocsSection title="Core operating model">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Tenant-scoped data boundaries and server-side permission checks.</li>
          <li>Role-based moderation and dispatch workflows.</li>
          <li>Approval gates for sensitive actions.</li>
          <li>Auditable activity history with integrity verification.</li>
        </ul>
      </DocsSection>

      <DocsSection title="Who should use which area">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Moderation teams: inbox, reports, cases, players, actions.</li>
          <li>Operations teams: dispatch, map tooling, call management.</li>
          <li>Security/admin owners: audit, SOC, roles, invites, integrations.</li>
        </ul>
      </DocsSection>

      <DocsSection title="Safe defaults">
        New deployments should begin with invite-gated access, strict role boundaries, and owner
        account hardening before adding broader staff access.
      </DocsSection>

      <DocsSection title="What this documentation covers">
        This set explains onboarding, role architecture, audit behavior, integration boundaries,
        and privacy/data policy commitments. It is written for operators, admins, and owners.
      </DocsSection>

      <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
    </DocsArticle>
  );
}
