import Image from "next/image";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Copy, Pause, Play, Check } from "lucide-react";

import type { AvatarShape, ProfileConfig } from "@/lib/config";

interface ProfileHeaderProps {
  profile: ProfileConfig["profile"];
  avatarShape: AvatarShape;
  profileUrl: string;
  onCopyLink: () => void;
  linkCopied: boolean;
  onToggleAudio: () => void;
  audioPlaying: boolean;
  reducedMotion: boolean;
}

export function ProfileHeader({
  profile,
  avatarShape,
  profileUrl,
  onCopyLink,
  linkCopied,
  onToggleAudio,
  audioPlaying,
  reducedMotion,
}: ProfileHeaderProps) {
  const hasAudio = profile.audioPreviewUrl.trim().length > 0;

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <motion.div
          whileHover={reducedMotion ? undefined : { y: -2 }}
          className={clsx(
            "relative h-20 w-20 overflow-hidden border border-[var(--soft-border)] bg-white/70 shadow-lg dark:bg-black/20",
            avatarShape === "circle" ? "rounded-full" : "rounded-3xl",
          )}
        >
          <Image
            src={profile.avatarUrl}
            alt={`${profile.displayName} avatar`}
            fill
            className="object-cover"
            sizes="80px"
            priority
          />
        </motion.div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] sm:text-3xl">
            {profile.displayName}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">@{profile.username}</p>
          <p className="max-w-xl text-sm text-[var(--text-main)]/85">{profile.bio}</p>
          <span
            className="inline-flex items-center gap-2 rounded-full border border-[var(--soft-border)] bg-white/60 px-3 py-1 text-xs font-medium text-[var(--text-main)] shadow-sm dark:bg-black/30"
            style={{ boxShadow: `0 0 0 1px ${profile.statusColor}1A` }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: profile.statusColor }}
              aria-hidden
            />
            {profile.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onCopyLink} className="mac-button">
          {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{linkCopied ? "Copied" : "Copy link"}</span>
        </button>

        {hasAudio ? (
          <button type="button" onClick={onToggleAudio} className="mac-button">
            {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{audioPlaying ? "Pause" : "Play"}</span>
          </button>
        ) : null}

        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full border border-[var(--soft-border)] bg-white/45 px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:text-[var(--text-main)] dark:bg-black/30"
        >
          {profileUrl}
        </a>
      </div>
    </section>
  );
}
