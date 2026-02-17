import { existsSync, readdirSync } from "node:fs";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { format } from "date-fns";

export type DownloadPlatform = "win" | "mac" | "linux";

type DownloadCandidate = { file: string; label: string };

const DOWNLOAD_CANDIDATES: Record<DownloadPlatform, DownloadCandidate[]> = {
  win: [
    { file: "vsm-desktop-windows-x64.msi", label: "Windows Installer (.msi)" },
    { file: "vsm-desktop-windows-x64.exe", label: "Windows Portable (.exe)" },
    { file: "ess-desktop-windows-x64.msi", label: "Windows Installer (.msi)" },
    { file: "ess-desktop-windows-x64.exe", label: "Windows Portable (.exe)" },
  ],
  mac: [
    { file: "vsm-desktop-macos-universal.dmg", label: "macOS Universal (.dmg)" },
    { file: "vsm-desktop-macos-arm64.dmg", label: "macOS Apple Silicon (.dmg)" },
    { file: "vsm-desktop-macos-x64.dmg", label: "macOS Intel (.dmg)" },
    { file: "ess-desktop-macos-universal.dmg", label: "macOS Universal (.dmg)" },
  ],
  linux: [
    { file: "vsm-desktop-linux-amd64.AppImage", label: "Linux AppImage (.AppImage)" },
    { file: "vsm-desktop-linux-amd64.deb", label: "Linux Debian (.deb)" },
    { file: "ess-desktop-linux-amd64.AppImage", label: "Linux AppImage (.AppImage)" },
  ],
};

export type DownloadMatch = {
  platform: DownloadPlatform;
  file: string;
  label: string;
  url: string;
};

function downloadsDir() {
  return join(process.cwd(), "public", "downloads");
}

function fileExists(file: string) {
  return existsSync(join(downloadsDir(), file));
}

export function detectPlatformFromUserAgent(
  userAgent: string | null | undefined,
): DownloadPlatform {
  const ua = (userAgent ?? "").toLowerCase();
  if (ua.includes("mac os") || ua.includes("darwin")) return "mac";
  if (ua.includes("linux") || ua.includes("x11")) return "linux";
  return "win";
}

export function normalizeDownloadPlatform(
  value: string | null | undefined,
  userAgent?: string | null,
): DownloadPlatform {
  if (value === "win" || value === "mac" || value === "linux") return value;
  return detectPlatformFromUserAgent(userAgent);
}

export function resolveLatestDownload(platform: DownloadPlatform): DownloadMatch | null {
  const candidates = DOWNLOAD_CANDIDATES[platform];
  for (const candidate of candidates) {
    if (fileExists(candidate.file)) {
      return {
        platform,
        file: candidate.file,
        label: candidate.label,
        url: `/downloads/${candidate.file}`,
      };
    }
  }
  return null;
}

export function listAvailableDownloads(): Record<DownloadPlatform, DownloadCandidate[]> {
  const out: Record<DownloadPlatform, DownloadCandidate[]> = { win: [], mac: [], linux: [] };
  for (const platform of Object.keys(DOWNLOAD_CANDIDATES) as DownloadPlatform[]) {
    out[platform] = DOWNLOAD_CANDIDATES[platform].filter((item) => fileExists(item.file));
  }
  return out;
}

export function hasAnyDownloadBinary() {
  return (Object.keys(DOWNLOAD_CANDIDATES) as DownloadPlatform[]).some((platform) =>
    DOWNLOAD_CANDIDATES[platform].some((candidate) => fileExists(candidate.file)),
  );
}

export function listRawDownloadFiles(): string[] {
  try {
    return readdirSync(downloadsDir()).sort();
  } catch {
    return [];
  }
}

type DownloadReleaseManifest = {
  version?: string;
  releasedAt?: string; // ISO date or datetime
  checksumsSha256?: Record<string, string>;
};

export type DownloadReleaseInfo = {
  version: string;
  releasedAtLabel: string | null;
  checksumsSha256: Record<string, string> | null;
};

function safeReadJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function parseSha256Sums(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    // Common formats:
    // <hash>  <file>
    // SHA256(<file>)= <hash>
    const m1 = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (m1) {
      out[m1[2].trim()] = m1[1].toLowerCase();
      continue;
    }
    const m2 = line.match(/^SHA256\((.+)\)\s*=\s*([a-f0-9]{64})$/i);
    if (m2) {
      out[m2[1].trim()] = m2[2].toLowerCase();
    }
  }
  return out;
}

function getLatestDownloadsMtime(files: string[]): Date | null {
  let latest: Date | null = null;
  for (const file of files) {
    try {
      const st = statSync(join(downloadsDir(), file));
      const dt = st.mtime instanceof Date ? st.mtime : new Date(st.mtime);
      if (!latest || dt.getTime() > latest.getTime()) latest = dt;
    } catch {
      // Ignore.
    }
  }
  return latest;
}

function getPackageVersion(): string {
  try {
    const pkg = safeReadJson<{ version?: string }>(join(process.cwd(), "package.json"));
    const v = pkg?.version?.trim();
    return v ? v : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function getDownloadReleaseInfo(): DownloadReleaseInfo {
  const versionFallback = getPackageVersion();

  // Optional release metadata file. If present, it should live alongside uploaded binaries.
  // This keeps checksum generation out of the request path.
  const manifestPath = join(downloadsDir(), "release.json");
  const sumsPath = join(downloadsDir(), "SHA256SUMS.txt");

  const manifest = existsSync(manifestPath)
    ? safeReadJson<DownloadReleaseManifest>(manifestPath)
    : null;

  const availableFiles = listRawDownloadFiles();
  const latestMtime = getLatestDownloadsMtime(availableFiles);

  const releasedAtLabel = (() => {
    const raw = manifest?.releasedAt?.trim();
    if (raw) {
      const dt = new Date(raw);
      if (!Number.isNaN(dt.getTime())) return format(dt, "MMM d, yyyy");
    }
    if (latestMtime) return format(latestMtime, "MMM d, yyyy");
    return null;
  })();

  const checksums = (() => {
    if (manifest?.checksumsSha256 && Object.keys(manifest.checksumsSha256).length > 0) {
      return manifest.checksumsSha256;
    }
    if (!existsSync(sumsPath)) return null;
    try {
      return parseSha256Sums(readFileSync(sumsPath, "utf8"));
    } catch {
      return null;
    }
  })();

  return {
    version: manifest?.version?.trim() || versionFallback,
    releasedAtLabel,
    checksumsSha256: checksums && Object.keys(checksums).length > 0 ? checksums : null,
  };
}
