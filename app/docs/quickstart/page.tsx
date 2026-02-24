import Link from "next/link";

import { DocsArticle, DocsCallout, DocsCode, DocsSection } from "@/components/marketing/docs-content";

export default function DocsQuickstartPage() {
  return (
    <DocsArticle
      title="Quickstart"
      intro="Use this checklist to bring a new community online safely and verify the core workflow."
    >
      <DocsSection title="1. Sign in and secure your account">
        Use your invite/access key flow, sign in, then complete required security steps (password
        update and 2FA when prompted). Owner/admin accounts should always keep 2FA enabled.
      </DocsSection>

      <DocsSection title="2. Validate your effective role">
        Open your dashboard and confirm visible modules match your expected permissions. Trial or
        limited roles should not see sensitive admin/security tools.
      </DocsSection>

      <DocsSection title="3. Run the operational loop">
        <ol className="space-y-1.5">
          <li>1. Create a report.</li>
          <li>2. Promote report to case.</li>
          <li>3. Assign ownership.</li>
          <li>4. Add case note and resolution.</li>
          <li>5. Verify corresponding audit events.</li>
        </ol>
      </DocsSection>

      <DocsSection title="4. Validate what staff can and cannot see">
        Sign in as a trial or limited-role account and confirm sensitive sections (admin, keys,
        exports) are hidden or denied. This verifies UI and server-side RBAC both enforce access.
      </DocsSection>

      <DocsSection title="Local development bootstrap">
        <DocsCode>{`npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev`}</DocsCode>
      </DocsSection>

      <DocsSection id="deploy" title="Deployment baseline">
        Configure production secrets and run migrations before opening access:
        <DocsCode>{`DATABASE_URL=<postgres-url>
NEXTAUTH_URL=<your-domain>
NEXTAUTH_SECRET=<secret>
AUTH_ENCRYPTION_KEY=<secret>
npx prisma migrate deploy`}</DocsCode>
        <p className="mt-2">
          For full host setup details, continue to{" "}
          <Link href="/docs/integrations" className="text-white/82 hover:text-white">
            Integrations
          </Link>
          .
        </p>
      </DocsSection>

      <DocsCallout>
        Keep production deploys behind HTTPS only. Do not reuse local secrets in hosted
        environments.
      </DocsCallout>

      <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
    </DocsArticle>
  );
}
