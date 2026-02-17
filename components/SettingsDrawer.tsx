"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Import, Plus, X } from "lucide-react";
import { useMemo } from "react";

import {
  ACCENT_PRESETS,
  AVATAR_SHAPES,
  GLASS_LEVELS,
  HIGHLIGHT_ICON_OPTIONS,
  LINK_ICON_OPTIONS,
  LINK_STYLES,
  STATUS_OPTIONS,
  THEME_MODES,
  WALLPAPERS,
  type HighlightItem,
  type ProfileConfig,
  type ProfileLink,
} from "@/lib/config";
import { ToggleSwitch } from "@/components/ToggleSwitch";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  config: ProfileConfig;
  reducedMotion: boolean;
  importText: string;
  importError: string | null;
  onImportTextChange: (value: string) => void;
  onImportConfig: () => void;
  onExportConfig: () => void;
  onConfigChange: (next: ProfileConfig) => void;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SettingsDrawer({
  open,
  onClose,
  config,
  reducedMotion,
  importText,
  importError,
  onImportTextChange,
  onImportConfig,
  onExportConfig,
  onConfigChange,
}: SettingsDrawerProps) {
  const aboutTagsInput = useMemo(() => config.about.tags.join(", "), [config.about.tags]);

  const setTheme = (patch: Partial<ProfileConfig["theme"]>) => {
    onConfigChange({ ...config, theme: { ...config.theme, ...patch } });
  };

  const setModules = (patch: Partial<ProfileConfig["modules"]>) => {
    onConfigChange({ ...config, modules: { ...config.modules, ...patch } });
  };

  const setEffects = (patch: Partial<ProfileConfig["effects"]>) => {
    onConfigChange({ ...config, effects: { ...config.effects, ...patch } });
  };

  const setProfile = (patch: Partial<ProfileConfig["profile"]>) => {
    onConfigChange({ ...config, profile: { ...config.profile, ...patch } });
  };

  const setAbout = (patch: Partial<ProfileConfig["about"]>) => {
    onConfigChange({ ...config, about: { ...config.about, ...patch } });
  };

  const updateLink = (id: string, patch: Partial<ProfileLink>) => {
    onConfigChange({
      ...config,
      links: config.links.map((link) => (link.id === id ? { ...link, ...patch } : link)),
    });
  };

  const removeLink = (id: string) => {
    onConfigChange({ ...config, links: config.links.filter((link) => link.id !== id) });
  };

  const addLink = () => {
    onConfigChange({
      ...config,
      links: [
        ...config.links,
        {
          id: createId("link"),
          title: "New Link",
          subtitle: "Short description",
          url: "https://example.com",
          icon: "globe",
        },
      ],
    });
  };

  const updateHighlight = (id: string, patch: Partial<HighlightItem>) => {
    onConfigChange({
      ...config,
      highlights: config.highlights.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const removeHighlight = (id: string) => {
    onConfigChange({
      ...config,
      highlights: config.highlights.filter((item) => item.id !== id),
    });
  };

  const addHighlight = () => {
    onConfigChange({
      ...config,
      highlights: [
        ...config.highlights,
        {
          id: createId("highlight"),
          title: "New Highlight",
          url: "https://example.com",
          icon: "sparkles",
        },
      ],
    });
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close settings"
            className="fixed inset-0 z-40 bg-black/35"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={reducedMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reducedMotion ? { x: "100%" } : { x: "100%" }}
            transition={
              reducedMotion ? { duration: 0 } : { type: "spring", damping: 28, stiffness: 280 }
            }
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-[var(--soft-border)] bg-white/90 p-4 shadow-2xl backdrop-blur-2xl dark:bg-[#0B1220]/88"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Settings</h2>
              <button type="button" className="mac-button" onClick={onClose}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <section className="space-y-3 rounded-3xl border border-[var(--soft-border)] bg-white/45 p-4 dark:bg-black/20">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Theme
                </h3>

                <div className="segmented-control">
                  {THEME_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTheme({ mode })}
                      className={clsx(
                        "segmented-option",
                        config.theme.mode === mode && "segmented-option-active",
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-xs text-[var(--text-muted)]">Accent color</p>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTheme({ accentColor: color })}
                        className={clsx(
                          "h-8 w-8 rounded-full border transition",
                          config.theme.accentColor === color
                            ? "scale-105 border-white shadow"
                            : "border-white/60",
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Use accent ${color}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      key={`accent-${config.theme.accentColor}`}
                      defaultValue={config.theme.accentColor}
                      onBlur={(event) => {
                        const raw = event.target.value.trim();
                        const normalized = raw.startsWith("#") ? raw : `#${raw}`;
                        if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(normalized)) {
                          setTheme({ accentColor: normalized });
                          event.target.value = normalized;
                          return;
                        }
                        event.target.value = config.theme.accentColor;
                      }}
                      className="w-full rounded-xl border border-[var(--soft-border)] bg-white/60 px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] dark:bg-black/25"
                      placeholder="#0A84FF"
                      aria-label="Custom accent color"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs text-[var(--text-muted)]">Wallpaper</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(WALLPAPERS).map(([id, wallpaper]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setTheme({ wallpaperId: id as ProfileConfig["theme"]["wallpaperId"] })
                        }
                        className={clsx(
                          "h-16 rounded-xl border p-2 text-left text-xs font-medium text-[var(--text-main)]",
                          config.theme.wallpaperId === id
                            ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                            : "border-[var(--soft-border)]",
                        )}
                        style={{ background: wallpaper.gradient }}
                      >
                        <span className="rounded-md bg-white/55 px-2 py-0.5 dark:bg-black/35">
                          {wallpaper.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <ToggleSwitch
                  id="grain-toggle"
                  label="Noise grain overlay"
                  checked={config.theme.grainEnabled}
                  onChange={(grainEnabled) => setTheme({ grainEnabled })}
                />
                <ToggleSwitch
                  id="animate-bg-toggle"
                  label="Subtle animated background"
                  checked={config.theme.animateBg}
                  onChange={(animateBg) => setTheme({ animateBg })}
                />
              </section>

              <section className="space-y-3 rounded-3xl border border-[var(--soft-border)] bg-white/45 p-4 dark:bg-black/20">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Layout & Effects
                </h3>

                <ToggleSwitch
                  id="about-toggle"
                  label="Show About module"
                  checked={config.modules.aboutEnabled}
                  onChange={(aboutEnabled) => setModules({ aboutEnabled })}
                />
                <ToggleSwitch
                  id="highlights-toggle"
                  label="Show Highlights module"
                  checked={config.modules.highlightsEnabled}
                  onChange={(highlightsEnabled) => setModules({ highlightsEnabled })}
                />
                <ToggleSwitch
                  id="gallery-toggle"
                  label="Show Gallery module"
                  checked={config.modules.galleryEnabled}
                  onChange={(galleryEnabled) => setModules({ galleryEnabled })}
                />

                <div>
                  <p className="mb-2 text-xs text-[var(--text-muted)]">Link style</p>
                  <div className="segmented-control">
                    {LINK_STYLES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setModules({ linksStyle: style })}
                        className={clsx(
                          "segmented-option",
                          config.modules.linksStyle === style && "segmented-option-active",
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs text-[var(--text-muted)]">Avatar shape</p>
                  <div className="segmented-control">
                    {AVATAR_SHAPES.map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => setModules({ avatarShape: shape })}
                        className={clsx(
                          "segmented-option",
                          config.modules.avatarShape === shape && "segmented-option-active",
                        )}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs text-[var(--text-muted)]">Glass blur</p>
                  <div className="segmented-control">
                    {GLASS_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setTheme({ glassLevel: level })}
                        className={clsx(
                          "segmented-option",
                          config.theme.glassLevel === level && "segmented-option-active",
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <ToggleSwitch
                  id="reduced-motion-toggle"
                  label="Reduced motion"
                  checked={config.effects.reducedMotion}
                  onChange={(reducedMotionValue) =>
                    setEffects({ reducedMotion: reducedMotionValue })
                  }
                />
                <ToggleSwitch
                  id="cursor-glow-toggle"
                  label="Desktop cursor glow"
                  checked={config.effects.cursorGlow}
                  onChange={(cursorGlow) => setEffects({ cursorGlow })}
                />
                <ToggleSwitch
                  id="draggable-toggle"
                  label="Draggable window mode"
                  checked={config.effects.draggableWindow}
                  onChange={(draggableWindow) => setEffects({ draggableWindow })}
                />
              </section>

              <section className="space-y-3 rounded-3xl border border-[var(--soft-border)] bg-white/45 p-4 dark:bg-black/20">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Content
                </h3>

                <label className="settings-field">
                  <span>Display name</span>
                  <input
                    value={config.profile.displayName}
                    onChange={(event) => setProfile({ displayName: event.target.value })}
                    className="settings-input"
                  />
                </label>

                <label className="settings-field">
                  <span>Username</span>
                  <input
                    value={config.profile.username}
                    onChange={(event) => setProfile({ username: event.target.value })}
                    className="settings-input"
                  />
                </label>

                <label className="settings-field">
                  <span>Bio</span>
                  <textarea
                    value={config.profile.bio}
                    onChange={(event) => setProfile({ bio: event.target.value })}
                    className="settings-input min-h-20 resize-y"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="settings-field">
                    <span>Status</span>
                    <select
                      value={config.profile.status}
                      onChange={(event) => {
                        const picked = STATUS_OPTIONS.find(
                          (item) => item.label === event.target.value,
                        );
                        setProfile({
                          status: event.target.value,
                          statusColor: picked?.color ?? config.profile.statusColor,
                        });
                      }}
                      className="settings-input"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.label} value={status.label}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="settings-field">
                    <span>Status color</span>
                    <input
                      value={config.profile.statusColor}
                      onChange={(event) => setProfile({ statusColor: event.target.value })}
                      className="settings-input"
                    />
                  </label>
                </div>

                <label className="settings-field">
                  <span>Audio URL (optional)</span>
                  <input
                    value={config.profile.audioPreviewUrl}
                    onChange={(event) => setProfile({ audioPreviewUrl: event.target.value })}
                    className="settings-input"
                  />
                </label>

                <label className="settings-field">
                  <span>About text</span>
                  <textarea
                    value={config.about.text}
                    onChange={(event) => setAbout({ text: event.target.value })}
                    className="settings-input min-h-20 resize-y"
                  />
                </label>

                <label className="settings-field">
                  <span>Tags (comma separated)</span>
                  <input
                    value={aboutTagsInput}
                    onChange={(event) =>
                      setAbout({
                        tags: event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                    className="settings-input"
                  />
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Links</p>
                    <button type="button" className="mac-button" onClick={addLink}>
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  {config.links.map((link) => (
                    <div
                      key={link.id}
                      className="space-y-2 rounded-2xl border border-[var(--soft-border)] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-[var(--text-main)]">{link.title}</p>
                        <button
                          type="button"
                          className="rounded-lg border border-[var(--soft-border)] p-1 text-[var(--text-muted)] transition hover:text-red-500"
                          onClick={() => removeLink(link.id)}
                          aria-label="Remove link"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <input
                        value={link.title}
                        onChange={(event) => updateLink(link.id, { title: event.target.value })}
                        className="settings-input"
                        placeholder="Title"
                      />
                      <input
                        value={link.subtitle}
                        onChange={(event) => updateLink(link.id, { subtitle: event.target.value })}
                        className="settings-input"
                        placeholder="Subtitle"
                      />
                      <input
                        value={link.url}
                        onChange={(event) => updateLink(link.id, { url: event.target.value })}
                        className="settings-input"
                        placeholder="URL"
                      />
                      <select
                        value={link.icon}
                        onChange={(event) =>
                          updateLink(link.id, {
                            icon: event.target.value as ProfileLink["icon"],
                          })
                        }
                        className="settings-input"
                      >
                        {LINK_ICON_OPTIONS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--text-muted)]">Highlights</p>
                    <button type="button" className="mac-button" onClick={addHighlight}>
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  {config.highlights.map((item) => (
                    <div
                      key={item.id}
                      className="space-y-2 rounded-2xl border border-[var(--soft-border)] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-[var(--text-main)]">{item.title}</p>
                        <button
                          type="button"
                          className="rounded-lg border border-[var(--soft-border)] p-1 text-[var(--text-muted)] transition hover:text-red-500"
                          onClick={() => removeHighlight(item.id)}
                          aria-label="Remove highlight"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <input
                        value={item.title}
                        onChange={(event) =>
                          updateHighlight(item.id, { title: event.target.value })
                        }
                        className="settings-input"
                        placeholder="Title"
                      />
                      <input
                        value={item.url}
                        onChange={(event) => updateHighlight(item.id, { url: event.target.value })}
                        className="settings-input"
                        placeholder="URL"
                      />
                      <select
                        value={item.icon}
                        onChange={(event) =>
                          updateHighlight(item.id, {
                            icon: event.target.value as HighlightItem["icon"],
                          })
                        }
                        className="settings-input"
                      >
                        {HIGHLIGHT_ICON_OPTIONS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3 rounded-3xl border border-[var(--soft-border)] bg-white/45 p-4 dark:bg-black/20">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Import / Export
                </h3>

                <button
                  type="button"
                  onClick={onExportConfig}
                  className="mac-button w-full justify-center"
                >
                  <Download className="h-4 w-4" />
                  Export config
                </button>

                <label className="settings-field">
                  <span>Paste JSON config</span>
                  <textarea
                    value={importText}
                    onChange={(event) => onImportTextChange(event.target.value)}
                    className="settings-input min-h-28 resize-y font-mono text-xs"
                    placeholder='{"profile":{"displayName":"Vice"}}'
                  />
                </label>

                {importError ? <p className="text-xs text-red-500">{importError}</p> : null}

                <button
                  type="button"
                  onClick={onImportConfig}
                  className="mac-button w-full justify-center"
                >
                  <Import className="h-4 w-4" />
                  Import config
                </button>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
