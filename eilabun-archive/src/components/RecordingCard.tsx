"use client";

import Link from "next/link";
import { useState } from "react";
import type { CardData, CardLabels } from "@/lib/cards";
import PlayerDialog from "./PlayerDialog";
import Thumbnail from "./Thumbnail";
import VerificationBadge from "./VerificationBadge";

export default function RecordingCard({
  rec,
  labels,
  closeLabel,
}: {
  rec: CardData;
  labels: CardLabels;
  closeLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  const href = `/recordings/${rec.id}`;
  const canEmbed = !!rec.embedSrc;

  const media = (
    <>
      <Thumbnail src={rec.thumbnailUrl} alt={rec.title} icon={rec.categoryIcon} className="transition duration-500 group-hover:scale-[1.03]" />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl text-crimson shadow-lift transition group-hover:scale-110">
          <span className="ms-1" aria-hidden>
            ▶
          </span>
        </span>
      </span>
      {rec.duration && (
        <span className="absolute bottom-2 end-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white" dir="ltr">
          {rec.duration}
        </span>
      )}
      {rec.isDemo && (
        <span className="absolute start-2 top-2 rounded-md bg-warn px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
          {labels.demo}
        </span>
      )}
    </>
  );

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      {canEmbed ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="relative block aspect-video w-full overflow-hidden bg-surface-2"
          aria-label={`${labels.play}: ${rec.title}`}
        >
          {media}
        </button>
      ) : (
        <a
          href={rec.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-video w-full overflow-hidden bg-surface-2"
          aria-label={`${labels.openSource}: ${rec.title}`}
        >
          {media}
        </a>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full bg-gold-soft/60 px-2 py-0.5 font-medium text-ink">
            {rec.categoryIcon} {rec.categoryLabel}
          </span>
          <VerificationBadge status={rec.verification} label={rec.verificationLabel} />
          {rec.isAuthorized && (
            <span className="rounded-full bg-ok/15 px-2 py-0.5 font-medium text-ok">♪ {labels.authorized}</span>
          )}
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          <Link href={href} className="hover:text-crimson focus-visible:underline">
            {rec.title}
          </Link>
        </h3>
        {rec.church && (
          <p className="line-clamp-1 text-sm text-muted">
            ⛪ <span dir="auto">{rec.church}</span>
          </p>
        )}
        <p className="text-sm text-muted">📅 {rec.date ?? labels.unknownDate}</p>
        <p className="truncate text-xs text-muted" title={rec.channelName ?? undefined}>
          {rec.sourceLabel}
          {rec.channelName && (
            <>
              {" · "}
              <span dir="auto">{rec.channelName}</span>
            </>
          )}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-3">
          <Link href={href} className="btn-ghost min-h-[44px] flex-1 whitespace-nowrap px-3 text-sm">
            {labels.details}
          </Link>
          {canEmbed ? (
            <button type="button" onClick={() => setPlaying(true)} className="btn-primary min-h-[44px] flex-1 whitespace-nowrap px-4">
              ▶ {labels.play}
            </button>
          ) : (
            <a
              href={rec.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary min-h-[44px] flex-[1.6] whitespace-nowrap px-3 text-sm"
            >
              ↗ {labels.openSource}
            </a>
          )}
        </div>
      </div>

      {canEmbed && (
        <PlayerDialog
          open={playing}
          onClose={() => setPlaying(false)}
          title={rec.title}
          embedSrc={rec.embedSrc!}
          sourceUrl={rec.sourceUrl}
          openSourceLabel={labels.openSource}
          closeLabel={closeLabel}
          detailsHref={href}
          detailsLabel={labels.details}
        />
      )}
    </article>
  );
}
