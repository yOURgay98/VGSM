import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

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
