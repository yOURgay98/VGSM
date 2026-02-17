import type { LucideIcon } from "lucide-react";
import {
  Disc3,
  FolderKanban,
  Github,
  Globe,
  ImageIcon,
  Instagram,
  Mail,
  PlaySquare,
  ShoppingBag,
  Sparkles,
  Tv,
  Video,
} from "lucide-react";

import type { HighlightIconKey, LinkIconKey } from "@/lib/config";

const linkIcons: Record<LinkIconKey, LucideIcon> = {
  discord: Disc3,
  youtube: PlaySquare,
  github: Github,
  tiktok: Video,
  instagram: Instagram,
  x: Tv,
  mail: Mail,
  globe: Globe,
};

const highlightIcons: Record<HighlightIconKey, LucideIcon> = {
  folder: FolderKanban,
  video: Video,
  image: ImageIcon,
  store: ShoppingBag,
  mail: Mail,
  sparkles: Sparkles,
};

export function getLinkIcon(icon: LinkIconKey): LucideIcon {
  return linkIcons[icon] ?? Globe;
}

export function getHighlightIcon(icon: HighlightIconKey): LucideIcon {
  return highlightIcons[icon] ?? Sparkles;
}
