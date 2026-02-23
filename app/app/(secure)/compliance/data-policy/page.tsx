import { MacWindow } from "@/components/layout/mac-window";
import { PageShell } from "@/components/shared/page-shell";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

function Item({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
      <p className="text-[13px] font-semibold text-[color:var(--text-main)]">{title}</p>
      <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">{body}</p>
    </div>
  );
}

export default async function ComplianceDataPolicyPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <PageShell
      title="Data Policy"
      description="What VSM collects, why we collect it, and how security-sensitive data is protected."
    >
      <MacWindow title="Collection boundaries" subtitle="Security-first defaults">
        <div className="grid gap-2 md:grid-cols-2">
          <Item
            title="No raw IP storage in audit logs"
            body="Audit records do not persist raw source IP addresses. Network identifiers are masked before storage and display."
          />
          <Item
            title="Secrets are never logged"
            body="Passwords, integration tokens, API keys, authorization headers, and cookie values are redacted before metadata is written."
          />
          <Item
            title="Access keys are hash-only"
            body="Integration and access keys are stored as one-way hashes and shown only once at creation. Revoked keys become immediately invalid."
          />
          <Item
            title="Least privilege visibility"
            body="Sensitive operational data (exports, integration management, key rotation) is restricted to Admin/Owner roles through server-side RBAC checks."
          />
        </div>
      </MacWindow>

      <MacWindow title="Retention summary" subtitle="Operational default posture">
        <ul className="space-y-1 text-[13px] text-[color:var(--text-muted)]">
          <li>Audit logs: retained for integrity and accountability, export-restricted.</li>
          <li>Sessions: active + historical session metadata retained for security review.</li>
          <li>Moderation records: retained per community policy and legal obligations.</li>
          <li>Sensitive fields: token-like values are redacted before persistence in audit metadata.</li>
        </ul>
      </MacWindow>
    </PageShell>
  );
}
