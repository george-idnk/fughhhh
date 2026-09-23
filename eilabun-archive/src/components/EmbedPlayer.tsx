"use client";

import { useState } from "react";
import Thumbnail from "./Thumbnail";

/**
 * "Click to load" wrapper around the official embedded player: the page loads fast
 * on phones and nothing is requested from the source until the visitor presses play.
 */
export default function EmbedPlayer({
  src,
  title,
  thumbnailUrl,
  icon,
  playLabel,
}: {
  src: string;
  title: string;
  thumbnailUrl: string | null;
  icon: string;
  playLabel: string;
}) {
  const [active, setActive] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black sm:rounded-xl2">
      {active ? (
        <iframe
          src={src + (src.includes("?") ? "&" : "?") + "autoplay=1"}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 block h-full w-full"
          aria-label={`${playLabel}: ${title}`}
        >
          <Thumbnail src={thumbnailUrl} alt={title} icon={icon} />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/35">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-crimson text-4xl text-white shadow-lift ring-4 ring-white/30 transition group-hover:scale-110">
              <span className="ms-1.5" aria-hidden>
                ▶
              </span>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
