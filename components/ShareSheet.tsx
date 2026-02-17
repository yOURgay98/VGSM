"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, Share2, X } from "lucide-react";

interface ShareSheetProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onCopyConfig: () => void;
  onDownloadConfig: () => void;
}

export function ShareSheet({
  open,
  reducedMotion,
  onClose,
  onCopyLink,
  onCopyConfig,
  onDownloadConfig,
}: ShareSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close share sheet"
            className="fixed inset-0 z-40 bg-black/35"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[var(--soft-border)] bg-white/85 p-4 shadow-2xl backdrop-blur-2xl dark:bg-[#0B1220]/88"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-main)]">
                <Share2 className="h-4 w-4 text-[var(--accent)]" /> Share
              </p>
              <button type="button" className="mac-button" onClick={onClose}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className="mac-button w-full justify-center"
                onClick={onCopyLink}
              >
                <Copy className="h-4 w-4" />
                Copy link
              </button>
              <button
                type="button"
                className="mac-button w-full justify-center"
                onClick={onCopyConfig}
              >
                <Copy className="h-4 w-4" />
                Copy config
              </button>
              <button
                type="button"
                className="mac-button w-full justify-center"
                onClick={onDownloadConfig}
              >
                <Download className="h-4 w-4" />
                Download config
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
