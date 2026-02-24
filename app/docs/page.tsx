import Link from "next/link";

import { DocsArticle, DocsSection } from "@/components/marketing/docs-content";
import { DOCS_NAV } from "@/components/marketing/docs-nav";

export default function DocsRootPage() {
  return (
    <DocsArticle
      title="Documentation"
      intro="Operational reference for Vanguard Security & Management. Start here, then move through each guide in order."
    >
      <DocsSection title="What this docs set is for">
        This documentation is written for community owners, admin teams, and moderators who need
        clear operating rules without digging through code. Each page focuses on practical setup
        and day-to-day use.
      </DocsSection>

      <DocsSection title="Read in this order">
        <ol className="space-y-1.5">
          {DOCS_NAV.map((item, index) => (
            <li key={item.href}>
              {index + 1}.{" "}
              <Link href={item.href} className="ui-transition text-white/80 hover:text-white">
                {item.label}
              </Link>
            </li>
          ))}
        </ol>
      </DocsSection>

      <DocsSection title="Quick goals before you invite staff">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Confirm your owner account security baseline (password + 2FA).</li>
          <li>Define at least one non-owner role with least-privilege defaults.</li>
          <li>Run one full report-to-case flow and verify audit visibility.</li>
          <li>Test invite and access key flows from a non-admin account.</li>
        </ul>
      </DocsSection>

      <DocsSection id="shortcuts" title="Keyboard shortcuts">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <code>Ctrl/Cmd + K</code>: open command palette.
          </li>
          <li>
            <code>Esc</code>: close active dialog or panel.
          </li>
          <li>
            <code>Shift + ?</code>: open in-app shortcut hint menu (if enabled for your role).
          </li>
        </ul>
      </DocsSection>

      <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
    </DocsArticle>
  );
}
