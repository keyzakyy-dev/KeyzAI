import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Card } from "./card";
import { cn } from "../../lib/utils";

/**
 * List fitur + panel media yang menempel di kanan (desktop) / expandable
 * di bawah tiap baris (mobile).
 *
 * Item_data lewat props `items`, bukan di-hardcode di sini, supaya file ini
 * tetap generik dan bisa dipakai section mana pun.
 *
 * @typedef {{ title: string, media: React.ReactNode, alt?: string }} FeatureItem
 */

/** Isi panel: URL (gambar/video) atau komponen React seutuhnya. */
function FeatureMedia({ content, alt }) {
  if (typeof content !== "string") {
    return <div className="h-full w-full">{content}</div>;
  }

  const isVideo = /\.(mp4|webm|ogg)$/i.test(content);
  const isImage =
    /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(content) ||
    /unsplash|images\./i.test(content);

  if (isVideo) {
    return (
      <video
        src={content}
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
    );
  }

  if (isImage) {
    return <img src={content} alt={alt ?? ""} className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex w-full h-full items-center justify-center p-8">
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}

export function FeaturesWithPanel({
  items = [],
  title = "Fitur",
  kicker = null,
  id,
  className,
}) {
  const [active, setActive] = React.useState(0);
  // Animasi motion jalan lewat JS, jadi aturan prefers-reduced-motion global
  // di index.css tidak menjangkaunya — harus dicek sendiri di sini.
  const reduced = useReducedMotion();
  const current = items[active];

  if (!items.length) return null;

  return (
    <section id={id} className={cn("relative w-full py-12 sm:py-14 lg:py-16", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <div>
            {kicker && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {kicker}
              </span>
            )}
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {title}
            </h2>

            <ul className="flex flex-col gap-1">
              {items.map((item, index) => {
                const isActive = active === index;
                return (
                  <li key={item.title}>
                    {/* Tombol asli, bukan <li onClick>: daftar ini harus bisa
                        dipakai keyboard, dan proyek ini punya :focus-visible
                        global yang hanya menempel ke elemen fokus. */}
                    <button
                      type="button"
                      onClick={() => setActive(index)}
                      aria-pressed={isActive}
                      className={cn(
                        "flex w-full flex-col rounded-xl px-4 py-3.5 text-left transition-all duration-200 lg:flex-row lg:items-center lg:gap-4",
                        isActive ? "ring-1 ring-foreground" : "ring-1 ring-transparent hover:ring-border"
                      )}
                    >
                      <span className="flex w-full flex-row items-center gap-4 lg:contents">
                        <span
                          className={cn(
                            "size-7 shrink-0 flex items-center justify-center rounded-full text-xs font-medium transition-colors duration-200",
                            isActive
                              ? "bg-foreground text-background"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-medium transition-colors duration-200",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {item.title}
                        </span>
                      </span>

                      {/* Mobile: media muncul di bawah baris yang aktif. */}
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reduced ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] }}
                            className="w-full overflow-hidden lg:hidden"
                          >
                            <Card className="relative mt-3 aspect-[4/3] w-full gap-0 overflow-hidden p-0">
                              <div className="absolute inset-0">
                                <FeatureMedia content={item.media} alt={item.alt} />
                              </div>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Desktop: satu panel sticky, isinya crossfade saat baris diganti. */}
          <div className="sticky top-10 hidden lg:block">
            <Card className="relative aspect-[4/3] w-full gap-0 overflow-hidden p-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: reduced ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-0"
                >
                  <FeatureMedia content={current.media} alt={current.alt} />
                </motion.div>
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
