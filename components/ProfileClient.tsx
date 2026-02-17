"use client";

import clsx from "clsx";
import { MotionConfig, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AboutCard } from "@/components/AboutCard";
import { Gallery } from "@/components/Gallery";
import { HighlightsGrid } from "@/components/HighlightsGrid";
import { LinkList } from "@/components/LinkList";
import { MacWindow } from "@/components/MacWindow";
import { ProfileHeader } from "@/components/ProfileHeader";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { ShareSheet } from "@/components/ShareSheet";
import {
  DEFAULT_CONFIG,
  WALLPAPERS,
  mergeProfileConfig,
  serializeConfig,
  type ProfileConfig,
} from "@/lib/config";
import { useMediaQuery } from "@/lib/hooks";
import { loadProfileConfig, saveProfileConfig } from "@/lib/storage";

function fileDownload(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyText(value: string): Promise<boolean> {
  if (!value) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const input = document.createElement("textarea");
      input.value = value;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.focus();
      input.select();
      const success = document.execCommand("copy");
      input.remove();
      return success;
    } catch {
      return false;
    }
  }
}

export function ProfileClient() {
  const [config, setConfig] = useState<ProfileConfig>(() =>
    typeof window === "undefined" ? DEFAULT_CONFIG : loadProfileConfig(),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [profileUrl] = useState(() =>
    typeof window === "undefined" ? "https://vice.201" : window.location.href,
  );
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const systemReducedMotion = useReducedMotion() ?? false;

  const effectiveReducedMotion = config.effects.reducedMotion || systemReducedMotion;

  useEffect(() => {
    saveProfileConfig(config);
  }, [config]);

  useEffect(() => {
    const shouldLockScroll = settingsOpen || shareOpen;
    document.body.style.overflow = shouldLockScroll ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [settingsOpen, shareOpen]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (!linkCopied) return;
    const timeout = window.setTimeout(() => setLinkCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [linkCopied]);

  const resolvedTheme =
    config.theme.mode === "auto" ? (prefersDark ? "dark" : "light") : config.theme.mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (!config.effects.cursorGlow || !isDesktop) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [config.effects.cursorGlow, isDesktop]);

  const normalizedQuery = spotlightQuery.trim().toLowerCase();

  const filteredLinks = useMemo(() => {
    if (!normalizedQuery) return config.links;
    return config.links.filter((link) => {
      const text = `${link.title} ${link.subtitle} ${link.url}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [config.links, normalizedQuery]);

  const filteredHighlights = useMemo(() => {
    if (!normalizedQuery) return config.highlights;
    return config.highlights.filter((item) => {
      const text = `${item.title} ${item.url}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [config.highlights, normalizedQuery]);

  const wallpaper = WALLPAPERS[config.theme.wallpaperId];

  const copyProfileLink = async () => {
    const ok = await copyText(profileUrl);
    if (ok) {
      setLinkCopied(true);
      setToastMessage("Profile link copied");
    }
  };

  const copyConfig = async () => {
    const ok = await copyText(serializeConfig(config));
    if (ok) {
      setToastMessage("Config copied");
    }
  };

  const downloadConfig = () => {
    // Customization point: rename the exported config filename if needed.
    fileDownload("vice-201-config.json", serializeConfig(config));
    setToastMessage("Config downloaded");
  };

  const importConfig = () => {
    try {
      const parsed = JSON.parse(importText);
      const merged = mergeProfileConfig(parsed);
      setConfig(merged);
      setImportError(null);
      setToastMessage("Config imported");
    } catch {
      setImportError("Invalid JSON. Please check the config and try again.");
    }
  };

  const toggleAudio = async () => {
    if (!audioRef.current) return;

    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setAudioPlaying(true);
    } catch {
      setToastMessage("Audio preview is unavailable.");
    }
  };

  return (
    <MotionConfig reducedMotion={effectiveReducedMotion ? "always" : "never"}>
      <div
        suppressHydrationWarning
        className={clsx(
          "relative min-h-screen overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10",
          config.theme.animateBg && !effectiveReducedMotion && "animated-wallpaper",
        )}
        style={
          {
            "--accent": config.theme.accentColor,
            backgroundImage: wallpaper.gradient,
            backgroundSize: "140% 140%",
          } as React.CSSProperties
        }
      >
        {config.theme.grainEnabled ? <div aria-hidden className="grain-overlay" /> : null}

        {config.effects.cursorGlow && isDesktop ? (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[1] hidden lg:block"
            style={{
              background: `radial-gradient(340px circle at ${cursorPosition.x}px ${cursorPosition.y}px, color-mix(in srgb, var(--accent) 28%, transparent), transparent 70%)`,
            }}
          />
        ) : null}

        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
          <MacWindow
            title="vice.201 - profile"
            glassLevel={config.theme.glassLevel}
            spotlightQuery={spotlightQuery}
            onSpotlightQueryChange={setSpotlightQuery}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenShare={() => setShareOpen(true)}
            draggable={config.effects.draggableWindow}
            reducedMotion={effectiveReducedMotion}
          >
            <ProfileHeader
              profile={config.profile}
              avatarShape={config.modules.avatarShape}
              profileUrl={profileUrl}
              onCopyLink={copyProfileLink}
              linkCopied={linkCopied}
              onToggleAudio={toggleAudio}
              audioPlaying={audioPlaying}
              reducedMotion={effectiveReducedMotion}
            />

            <LinkList
              links={filteredLinks}
              style={config.modules.linksStyle}
              reducedMotion={effectiveReducedMotion}
            />

            {config.modules.aboutEnabled ? (
              <AboutCard text={config.about.text} tags={config.about.tags} />
            ) : null}

            {config.modules.highlightsEnabled ? (
              <HighlightsGrid
                highlights={filteredHighlights}
                reducedMotion={effectiveReducedMotion}
              />
            ) : null}

            {config.modules.galleryEnabled ? (
              <Gallery images={config.gallery.images} reducedMotion={effectiveReducedMotion} />
            ) : null}

            <footer className="mt-2 flex flex-col items-start gap-1 border-t border-[var(--soft-border)] pt-4 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
              <span>{config.profile.username}</span>
              <span>{new Date().getFullYear()} vice.201. All rights reserved.</span>
              <a
                href="https://vice.201"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-[var(--text-main)]"
              >
                Made with Vice
              </a>
            </footer>
          </MacWindow>
        </main>

        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          config={config}
          reducedMotion={effectiveReducedMotion}
          importText={importText}
          importError={importError}
          onImportTextChange={(value) => {
            setImportText(value);
            if (importError) setImportError(null);
          }}
          onImportConfig={importConfig}
          onExportConfig={downloadConfig}
          onConfigChange={setConfig}
        />

        <ShareSheet
          open={shareOpen}
          reducedMotion={effectiveReducedMotion}
          onClose={() => setShareOpen(false)}
          onCopyLink={copyProfileLink}
          onCopyConfig={copyConfig}
          onDownloadConfig={downloadConfig}
        />

        <audio
          ref={audioRef}
          src={config.profile.audioPreviewUrl || undefined}
          preload="none"
          onPlay={() => setAudioPlaying(true)}
          onPause={() => setAudioPlaying(false)}
          onEnded={() => setAudioPlaying(false)}
        />

        {toastMessage ? (
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[var(--soft-border)] bg-white/85 px-4 py-2 text-sm text-[var(--text-main)] shadow-lg backdrop-blur-xl dark:bg-black/65">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              {toastMessage}
            </span>
          </div>
        ) : null}
      </div>
    </MotionConfig>
  );
}
