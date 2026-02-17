import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { RecommendedDownloadButton } from "@/components/marketing/recommended-download";
import {
  hasAnyDownloadBinary,
  getDownloadReleaseInfo,
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
  const release = getDownloadReleaseInfo();
  const availablePlatforms = (Object.keys(PLATFORM_LABELS) as Platform[]).filter(
    (platform) => available[platform].length > 0,
  );

  return (
    <MarketingShell>
      <section className="space-y-10">
        <header className="max-w-[52rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Download
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">VSM Desktop</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            A focused desktop wrapper for control-window workflows. Authentication and permissions
            remain enforced by the same VSM backend.
          </p>
        </header>

        {anyBinary ? (
          <div className="grid gap-4 lg:grid-cols-[0.62fr_0.38fr]">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-6">
              <p className="text-[13px] font-semibold text-white">Recommended download</p>
              <p className="mt-2 text-[13px] text-white/65">
                Version{" "}
                <span className="font-semibold text-white/85">v{release.version}</span>
                {release.releasedAtLabel ? (
                  <>
                    <span className="mx-2 text-white/30" aria-hidden>
                      •
                    </span>
                    Released{" "}
                    <span className="font-semibold text-white/85">{release.releasedAtLabel}</span>
                  </>
                ) : null}
              </p>
              <div className="mt-4">
                <RecommendedDownloadButton availablePlatforms={availablePlatforms} />
              </div>
              <div className="mt-4 text-xs text-white/55">
                <Link href="/docs/desktop#verify" className="mkt-link text-xs">
                  Verify downloads
                </Link>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Platforms
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-white/65">
                Need a different OS build? Choose a platform below. Files are served directly from{" "}
                <code className="text-white/80">/downloads</code>.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
                  Windows
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
                  macOS
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
                  Linux
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[13px] font-semibold text-white">Desktop builds not published yet</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/65">
              The web console is fully available right now. When a desktop release is uploaded, this
              page will automatically switch to one-click downloads.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href="/app" className="mkt-btn mkt-btn-primary">
                Open Web Console
              </Link>
              <Link href="/docs/desktop" className="mkt-btn mkt-btn-secondary">
                Build from source
              </Link>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((platform) => (
            <PlatformCard key={platform} platform={platform} entries={available[platform]} />
          ))}
        </div>

        {anyBinary ? (
          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Integrity
            </p>
            {release.checksumsSha256 ? (
              <>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">
                  Published SHA256 checksums are listed below. Use{" "}
                  <Link href="/docs/desktop#verify" className="mkt-link">
                    verification instructions
                  </Link>{" "}
                  to compare locally.
                </p>
                <div className="mt-4 overflow-auto rounded-[18px] border border-white/10 bg-black/25 p-4 text-[12px] text-white/80">
                  <div className="grid gap-2">
                    {Object.entries(release.checksumsSha256).map(([file, sum]) => (
                      <div key={file} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
                        <code className="break-all text-white/85">{file}</code>
                        <code className="break-all text-white/60">{sum}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-white/65">
                Checksums can be published with desktop releases (optional). If you uploaded a{" "}
                <code className="text-white/80">SHA256SUMS.txt</code> file in{" "}
                <code className="text-white/80">public/downloads</code>, they’ll appear here.
              </p>
            )}
          </div>
        ) : null}

        {isDev ? (
          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Dev visibility
            </p>
            <p className="mt-2 text-[12px] text-white/60">
              Files detected in <code className="text-white/80">public/downloads</code>:{" "}
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
    <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
      <p className="text-sm font-semibold text-white">{PLATFORM_LABELS[platform]}</p>
      <p className="mt-1 text-xs text-white/65">Desktop utility app</p>

      {entries.length === 0 ? (
        <>
          <button
            type="button"
            disabled
            className={cn(
              "ui-transition mt-4 inline-flex h-9 w-full items-center justify-center rounded-[var(--radius-control)] border px-4 text-[13px] font-semibold",
              "border-white/10 bg-white/[0.03] text-white/55 opacity-80",
            )}
          >
            Not available
          </button>
          <p className="mt-2 text-xs text-white/55">No uploaded binary detected for this platform.</p>
        </>
      ) : (
        <div className="mt-4 space-y-2">
          {entries.map((entry) => (
            <Link
              key={entry.file}
              href={`/downloads/${entry.file}`}
              className="ui-transition inline-flex h-9 w-full items-center justify-center rounded-[var(--radius-control)] border border-white/10 bg-white/[0.04] px-4 text-[13px] font-semibold text-white/85 hover:bg-white/[0.08] active:scale-[0.98]"
            >
              {entry.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
