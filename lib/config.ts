export type ThemeMode = "light" | "dark" | "auto";
export type GlassLevel = "low" | "med" | "high";
export type LinksStyle = "compact" | "expanded";
export type AvatarShape = "circle" | "rounded";
export type WallpaperId = "aurora" | "mist" | "coast" | "sunset" | "night";
export type LinkIconKey =
  | "discord"
  | "youtube"
  | "github"
  | "tiktok"
  | "instagram"
  | "x"
  | "mail"
  | "globe";
export type HighlightIconKey = "folder" | "video" | "image" | "store" | "mail" | "sparkles";

export interface ProfileLink {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  icon: LinkIconKey;
}

export interface HighlightItem {
  id: string;
  title: string;
  url: string;
  icon: HighlightIconKey;
}

export interface ProfileConfig {
  profile: {
    displayName: string;
    username: string;
    avatarUrl: string;
    bio: string;
    status: string;
    statusColor: string;
    audioPreviewUrl: string;
  };
  theme: {
    mode: ThemeMode;
    accentColor: string;
    wallpaperId: WallpaperId;
    grainEnabled: boolean;
    animateBg: boolean;
    glassLevel: GlassLevel;
  };
  modules: {
    aboutEnabled: boolean;
    highlightsEnabled: boolean;
    galleryEnabled: boolean;
    linksStyle: LinksStyle;
    avatarShape: AvatarShape;
  };
  effects: {
    reducedMotion: boolean;
    cursorGlow: boolean;
    draggableWindow: boolean;
  };
  links: ProfileLink[];
  highlights: HighlightItem[];
  about: {
    text: string;
    tags: string[];
  };
  gallery: {
    images: string[];
  };
}

export const THEME_MODES: ThemeMode[] = ["light", "dark", "auto"];
export const GLASS_LEVELS: GlassLevel[] = ["low", "med", "high"];
export const LINK_STYLES: LinksStyle[] = ["compact", "expanded"];
export const AVATAR_SHAPES: AvatarShape[] = ["circle", "rounded"];

export const STATUS_OPTIONS = [
  { label: "Online", color: "#34C759" },
  { label: "Busy", color: "#FF9F0A" },
  { label: "Do not disturb", color: "#FF3B30" },
] as const;

export const ACCENT_PRESETS = [
  "#0A84FF",
  "#30D158",
  "#FF9F0A",
  "#BF5AF2",
  "#64D2FF",
  "#FF375F",
  "#4CD964",
  "#FFD60A",
] as const;

export const WALLPAPERS: Record<WallpaperId, { label: string; gradient: string }> = {
  // Customization point: add new wallpaper IDs and gradient recipes here.
  aurora: {
    label: "Aurora",
    gradient:
      "radial-gradient(120% 120% at 0% 0%, rgba(84, 160, 255, 0.38) 0%, transparent 45%), radial-gradient(120% 120% at 100% 0%, rgba(129, 236, 236, 0.32) 0%, transparent 48%), linear-gradient(140deg, #f4f8ff 0%, #dbeafe 40%, #ecfeff 100%)",
  },
  mist: {
    label: "Mist",
    gradient:
      "radial-gradient(120% 120% at 15% 15%, rgba(99, 102, 241, 0.2) 0%, transparent 52%), radial-gradient(110% 110% at 85% 10%, rgba(14, 165, 233, 0.24) 0%, transparent 48%), linear-gradient(145deg, #f8fafc 0%, #eef2ff 50%, #f1f5f9 100%)",
  },
  coast: {
    label: "Coast",
    gradient:
      "radial-gradient(120% 120% at 10% 10%, rgba(56, 189, 248, 0.25) 0%, transparent 45%), radial-gradient(120% 120% at 85% 20%, rgba(45, 212, 191, 0.28) 0%, transparent 40%), linear-gradient(150deg, #ecfeff 0%, #cffafe 40%, #e0f2fe 100%)",
  },
  sunset: {
    label: "Sunset",
    gradient:
      "radial-gradient(130% 110% at 20% 15%, rgba(253, 164, 175, 0.38) 0%, transparent 48%), radial-gradient(120% 110% at 80% 10%, rgba(251, 191, 36, 0.33) 0%, transparent 46%), linear-gradient(145deg, #fff1f2 0%, #ffedd5 48%, #ffe4e6 100%)",
  },
  night: {
    label: "Night",
    gradient:
      "radial-gradient(120% 120% at 0% 0%, rgba(34, 211, 238, 0.22) 0%, transparent 46%), radial-gradient(120% 120% at 95% 0%, rgba(59, 130, 246, 0.26) 0%, transparent 52%), linear-gradient(145deg, #0f172a 0%, #111827 45%, #0b1120 100%)",
  },
};

export const LINK_ICON_OPTIONS: LinkIconKey[] = [
  "discord",
  "youtube",
  "github",
  "tiktok",
  "instagram",
  "x",
  "mail",
  "globe",
];

export const HIGHLIGHT_ICON_OPTIONS: HighlightIconKey[] = [
  "folder",
  "video",
  "image",
  "store",
  "mail",
  "sparkles",
];

export const CONFIG_STORAGE_KEY = "vice201.profile.config.v1";

// Customization point: this is the starter profile shown on first visit.
export const DEFAULT_CONFIG: ProfileConfig = {
  profile: {
    displayName: "Vice",
    username: "vice.201",
    avatarUrl: "/avatar-vice.svg",
    bio: "Design-minded creator building clean interfaces, clips, and tiny experiments.",
    status: "Online",
    statusColor: "#34C759",
    audioPreviewUrl: "/audio-preview.wav",
  },
  theme: {
    mode: "auto",
    accentColor: "#0A84FF",
    wallpaperId: "aurora",
    grainEnabled: true,
    animateBg: true,
    glassLevel: "med",
  },
  modules: {
    aboutEnabled: true,
    highlightsEnabled: true,
    galleryEnabled: true,
    linksStyle: "expanded",
    avatarShape: "circle",
  },
  effects: {
    reducedMotion: false,
    cursorGlow: true,
    draggableWindow: true,
  },
  links: [
    {
      id: "discord",
      title: "Discord",
      subtitle: "Join my server",
      url: "https://discord.com",
      icon: "discord",
    },
    {
      id: "youtube",
      title: "YouTube",
      subtitle: "Latest edits and videos",
      url: "https://youtube.com",
      icon: "youtube",
    },
    {
      id: "github",
      title: "GitHub",
      subtitle: "Code, UI prototypes, and experiments",
      url: "https://github.com",
      icon: "github",
    },
    {
      id: "tiktok",
      title: "TikTok",
      subtitle: "Short clips and previews",
      url: "https://tiktok.com",
      icon: "tiktok",
    },
  ],
  highlights: [
    { id: "projects", title: "Projects", url: "https://example.com", icon: "folder" },
    { id: "clips", title: "Clips", url: "https://example.com", icon: "video" },
    { id: "gallery", title: "Gallery", url: "https://example.com", icon: "image" },
    { id: "store", title: "Store", url: "https://example.com", icon: "store" },
    { id: "contact", title: "Contact", url: "mailto:hello@example.com", icon: "mail" },
  ],
  about: {
    text: "I focus on refined product design, profile pages, and short-form visuals with a clean and premium style.",
    tags: ["UI design", "Animation", "Video edits", "TypeScript", "Branding"],
  },
  gallery: {
    images: [
      "/gallery/01.svg",
      "/gallery/02.svg",
      "/gallery/03.svg",
      "/gallery/04.svg",
      "/gallery/05.svg",
      "/gallery/06.svg",
    ],
  },
};

function cloneDefault(): ProfileConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ProfileConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function sanitizeOptionalString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed) ? trimmed : fallback;
}

function sanitizeMode(value: unknown, fallback: ThemeMode): ThemeMode {
  return THEME_MODES.includes(value as ThemeMode) ? (value as ThemeMode) : fallback;
}

function sanitizeWallpaper(value: unknown, fallback: WallpaperId): WallpaperId {
  return typeof value === "string" && value in WALLPAPERS ? (value as WallpaperId) : fallback;
}

function sanitizeGlass(value: unknown, fallback: GlassLevel): GlassLevel {
  return GLASS_LEVELS.includes(value as GlassLevel) ? (value as GlassLevel) : fallback;
}

function sanitizeLinksStyle(value: unknown, fallback: LinksStyle): LinksStyle {
  return LINK_STYLES.includes(value as LinksStyle) ? (value as LinksStyle) : fallback;
}

function sanitizeAvatarShape(value: unknown, fallback: AvatarShape): AvatarShape {
  return AVATAR_SHAPES.includes(value as AvatarShape) ? (value as AvatarShape) : fallback;
}

function sanitizeLinkIcon(value: unknown, fallback: LinkIconKey): LinkIconKey {
  return LINK_ICON_OPTIONS.includes(value as LinkIconKey) ? (value as LinkIconKey) : fallback;
}

function sanitizeHighlightIcon(value: unknown, fallback: HighlightIconKey): HighlightIconKey {
  return HIGHLIGHT_ICON_OPTIONS.includes(value as HighlightIconKey)
    ? (value as HighlightIconKey)
    : fallback;
}

function sanitizeLinks(value: unknown, fallback: ProfileLink[]): ProfileLink[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;

  const links = value
    .slice(0, 12)
    .map((item, index) => {
      if (!isRecord(item)) return null;
      return {
        id: sanitizeString(item.id, `link-${index + 1}`),
        title: sanitizeString(item.title, `Link ${index + 1}`),
        subtitle: sanitizeOptionalString(item.subtitle),
        url: sanitizeString(item.url, "https://example.com"),
        icon: sanitizeLinkIcon(item.icon, "globe"),
      } satisfies ProfileLink;
    })
    .filter((item): item is ProfileLink => item !== null);

  return links.length > 0 ? links : fallback;
}

function sanitizeHighlights(value: unknown, fallback: HighlightItem[]): HighlightItem[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;

  const highlights = value
    .slice(0, 8)
    .map((item, index) => {
      if (!isRecord(item)) return null;
      return {
        id: sanitizeString(item.id, `highlight-${index + 1}`),
        title: sanitizeString(item.title, `Highlight ${index + 1}`),
        url: sanitizeString(item.url, "https://example.com"),
        icon: sanitizeHighlightIcon(item.icon, "sparkles"),
      } satisfies HighlightItem;
    })
    .filter((item): item is HighlightItem => item !== null);

  return highlights.length > 0 ? highlights : fallback;
}

function sanitizeTags(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const tags = value
    .slice(0, 12)
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);

  return tags.length > 0 ? tags : fallback;
}

function sanitizeGalleryImages(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const images = value
    .slice(0, 12)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return images.length > 0 ? images : fallback;
}

export function mergeProfileConfig(input: unknown): ProfileConfig {
  const merged = cloneDefault();

  if (!isRecord(input)) {
    return merged;
  }

  if (isRecord(input.profile)) {
    merged.profile.displayName = sanitizeString(
      input.profile.displayName,
      merged.profile.displayName,
    );
    merged.profile.username = sanitizeString(input.profile.username, merged.profile.username);
    merged.profile.avatarUrl = sanitizeString(input.profile.avatarUrl, merged.profile.avatarUrl);
    merged.profile.bio = sanitizeString(input.profile.bio, merged.profile.bio);
    merged.profile.status = sanitizeString(input.profile.status, merged.profile.status);
    merged.profile.statusColor = sanitizeHexColor(
      input.profile.statusColor,
      merged.profile.statusColor,
    );
    merged.profile.audioPreviewUrl = sanitizeOptionalString(
      input.profile.audioPreviewUrl,
      merged.profile.audioPreviewUrl,
    );
  }

  if (isRecord(input.theme)) {
    merged.theme.mode = sanitizeMode(input.theme.mode, merged.theme.mode);
    merged.theme.accentColor = sanitizeHexColor(input.theme.accentColor, merged.theme.accentColor);
    merged.theme.wallpaperId = sanitizeWallpaper(input.theme.wallpaperId, merged.theme.wallpaperId);
    merged.theme.grainEnabled = sanitizeBoolean(
      input.theme.grainEnabled,
      merged.theme.grainEnabled,
    );
    merged.theme.animateBg = sanitizeBoolean(input.theme.animateBg, merged.theme.animateBg);
    merged.theme.glassLevel = sanitizeGlass(input.theme.glassLevel, merged.theme.glassLevel);
  }

  if (isRecord(input.modules)) {
    merged.modules.aboutEnabled = sanitizeBoolean(
      input.modules.aboutEnabled,
      merged.modules.aboutEnabled,
    );
    merged.modules.highlightsEnabled = sanitizeBoolean(
      input.modules.highlightsEnabled,
      merged.modules.highlightsEnabled,
    );
    merged.modules.galleryEnabled = sanitizeBoolean(
      input.modules.galleryEnabled,
      merged.modules.galleryEnabled,
    );
    merged.modules.linksStyle = sanitizeLinksStyle(
      input.modules.linksStyle,
      merged.modules.linksStyle,
    );
    merged.modules.avatarShape = sanitizeAvatarShape(
      input.modules.avatarShape,
      merged.modules.avatarShape,
    );
  }

  if (isRecord(input.effects)) {
    merged.effects.reducedMotion = sanitizeBoolean(
      input.effects.reducedMotion,
      merged.effects.reducedMotion,
    );
    merged.effects.cursorGlow = sanitizeBoolean(
      input.effects.cursorGlow,
      merged.effects.cursorGlow,
    );
    merged.effects.draggableWindow = sanitizeBoolean(
      input.effects.draggableWindow,
      merged.effects.draggableWindow,
    );
  }

  merged.links = sanitizeLinks(input.links, merged.links);
  merged.highlights = sanitizeHighlights(input.highlights, merged.highlights);

  if (isRecord(input.about)) {
    merged.about.text = sanitizeString(input.about.text, merged.about.text);
    merged.about.tags = sanitizeTags(input.about.tags, merged.about.tags);
  }

  if (isRecord(input.gallery)) {
    merged.gallery.images = sanitizeGalleryImages(input.gallery.images, merged.gallery.images);
  }

  return merged;
}

export function serializeConfig(config: ProfileConfig): string {
  return JSON.stringify(config, null, 2);
}
