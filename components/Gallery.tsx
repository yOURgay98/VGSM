"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface GalleryProps {
  images: string[];
  reducedMotion: boolean;
}

export function Gallery({ images, reducedMotion }: GalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        Gallery
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setSelectedImage(src)}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--soft-border)] bg-white/50 shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] dark:bg-black/30"
          >
            <Image
              src={src}
              alt={`Gallery image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 45vw, 180px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedImage ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={reducedMotion ? false : { scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { scale: 0.96, opacity: 0 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-[#0B1020]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute right-3 top-3 z-10 rounded-full border border-white/25 bg-black/40 p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="relative aspect-video w-full">
                <Image
                  src={selectedImage}
                  alt="Expanded gallery image"
                  fill
                  sizes="90vw"
                  className="object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
