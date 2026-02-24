import { DocsArticle, DocsCallout, DocsSection } from "@/components/marketing/docs-content";

export default function DocsRolesPage() {
  return (
    <DocsArticle
      title="Roles & Permissions"
      intro="Permissions are enforced server-side. UI visibility alone is not treated as a security boundary."
    >
      <DocsSection title="RBAC model">
        Roles define allowed actions. Every mutation checks both tenant membership and permission
        before execution. Missing permission returns a controlled forbidden response.
      </DocsSection>

      <DocsSection title="Practical role expectations">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Trial or limited moderators: core moderation read/write only.</li>
          <li>Admins: operational and configuration management.</li>
          <li>Owners: sensitive controls (keys, role policy, bootstrap/security config).</li>
        </ul>
      </DocsSection>

      <DocsSection title="Permission groups you should define early">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Moderation queue and case lifecycle.</li>
          <li>Dispatch map editing and operational call controls.</li>
          <li>Audit read/export permissions (admin only).</li>
          <li>Access key and invite administration (owner/admin only).</li>
        </ul>
      </DocsSection>

      <DocsSection title="High-risk actions">
        Sensitive actions can be protected by approval workflow. This keeps one-click mistakes or
        abuse from bypassing policy.
      </DocsSection>

      <DocsSection title="Role review cadence">
        Review role grants at least monthly or after staffing changes. Remove permissions that are
        no longer operationally required to preserve least privilege.
      </DocsSection>

      <DocsCallout tone="warning">
        Never grant owner-equivalent permissions broadly. Keep least-privilege defaults and expand
        access only with clear operational need.
      </DocsCallout>

      <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
    </DocsArticle>
  );
}
