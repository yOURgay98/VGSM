import Link from "next/link";

import { DownloadDesktopCta } from "@/components/marketing/download-desktop-cta";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  hasAnyDownloadBinary,
  listAvailableDownloads,
  listRawDownloadFiles,
} from "@/lib/downloads";
import { cn } from "@/lib/utils";

type Platform = "win" | "mac" | "linux";

const PLATFORM_LABELS: Record<Platform, string> = {
  win: "Windows",
  mac: "macOS",
  linux: "Linux",
};

export default function DownloadPage() {
  const isDev = process.env.NODE_ENV !== "production";
  const available = listAvailableDownloads();
  const anyBinary = hasAnyDownloadBinary();

  return (
    <MarketingShell>
      <section className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Desktop
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          VSM Desktop
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--text-muted)]">
          Download the desktop utility wrapper for a focused control-window workflow. Authentication
          and permissions remain enforced by the same VSM backend.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <DownloadDesktopCta />
          <Link
            href="/app"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-semibold text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
          >
            Open Web App
          </Link>
        </div>

        {!anyBinary ? (
          <div className="mt-4 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
              Desktop build not uploaded yet
            </p>
            <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">
              Web access is fully available right now. Desktop builds can be added at any time and
              will immediately activate one-click download.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Link
                href="/app"
                className="ui-transition inline-flex h-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-[12px] font-semibold text-white hover:brightness-[1.04]"
              >
                Continue in web app
              </Link>
              {isDev ? (
                <Link
                  href="/docs/desktop"
                  className="ui-transition inline-flex h-8 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] px-3 text-[12px] font-semibold text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                >
                  Build desktop locally
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((platform) => (
            <PlatformCard key={platform} platform={platform} entries={available[platform]} />
          ))}
        </div>

        {isDev ? (
          <div className="mt-4 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
              Dev visibility
            </p>
            <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">
              Files currently detected in <code>public/downloads</code>:{" "}
              {listRawDownloadFiles().join(", ") || "none"}
            </p>
          </div>
        ) : null}
      </section>
    </MarketingShell>
  );
}

function PlatformCard({
  platform,
  entries,
}: {
  platform: Platform;
  entries: Array<{ file: string; label: string }>;
}) {
  return (
    <div className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-[var(--panel-shadow)] backdrop-blur-xl">
      <p className="text-sm font-semibold text-[color:var(--text-main)]">
        {PLATFORM_LABELS[platform]}
      </p>
      <p className="mt-1 text-xs text-[color:var(--text-muted)]">Desktop utility app</p>

      {entries.length === 0 ? (
        <>
          <button
            type="button"
            disabled
            className={cn(
              "ui-transition mt-4 inline-flex h-9 w-full items-center justify-center rounded-[var(--radius-control)] border px-4 text-[13px] font-semibold",
              "border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--text-muted)] opacity-70",
            )}
          >
            Not available
          </button>
          <p className="mt-2 text-xs text-[color:var(--text-muted)]">
            No uploaded binary detected for this platform yet.
          </p>
        </>
      ) : (
        <div className="mt-4 space-y-2">
          {entries.map((entry) => (
            <Link
              key={entry.file}
              href={`/downloads/${entry.file}`}
              className="ui-transition inline-flex h-9 w-full items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-semibold text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
            >
              {entry.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
