"use client";

import { useEffect, useRef } from "react";

function withAutoplay(src: string) {
  return src + (src.includes("?") ? "&" : "?") + "autoplay=1";
}

/**
 * Modal with the source's OFFICIAL embedded player. The iframe only exists while
 * the dialog is open, so closing it stops playback.
 */
export default function PlayerDialog({
  open,
  onClose,
  title,
  embedSrc,
  sourceUrl,
  openSourceLabel,
  closeLabel,
  detailsHref,
  detailsLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  embedSrc: string;
  sourceUrl: string;
  openSourceLabel: string;
  closeLabel: string;
  detailsHref: string;
  detailsLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="w-full max-w-4xl bg-transparent p-0 backdrop:bg-black/80 sm:w-[92vw]"
      aria-label={title}
    >
      {open && (
        <div className="overflow-hidden rounded-none bg-surface shadow-lift sm:rounded-xl2">
          <div className="aspect-video w-full bg-black">
            <iframe
              src={withAutoplay(embedSrc)}
              title={title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
            <p className="me-auto line-clamp-2 min-w-0 flex-1 basis-full font-semibold sm:basis-auto">{title}</p>
            <a href={detailsHref} className="btn-ghost">
              {detailsLabel}
            </a>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              ↗ {openSourceLabel}
            </a>
            <button type="button" onClick={onClose} className="btn-primary">
              ✕ {closeLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
