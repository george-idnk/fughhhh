import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EmbedPlayer from "@/components/EmbedPlayer";
import RecordingGrid from "@/components/RecordingGrid";
import Thumbnail from "@/components/Thumbnail";
import VerificationBadge from "@/components/VerificationBadge";
import { toCardData } from "@/lib/cards";
import {
  CATEGORY_META,
  type AudioQuality,
  type Category,
  type RecordingLanguage,
  type Source,
  type VerificationStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate, formatDuration, formatNumber, formatRecordingDate } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { displayTitle, getRecording, getRelated } from "@/lib/recordings";
import { resolveEmbed, youTubeThumbnail } from "@/lib/url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [{ locale }, rec] = await Promise.all([getI18n(), getRecording(id)]);
  if (!rec) return {};
  return {
    title: displayTitle(rec, locale),
    description: rec.description?.slice(0, 200) ?? undefined,
    openGraph: rec.thumbnailUrl ? { images: [rec.thumbnailUrl] } : undefined,
  };
}

export default async function RecordingPage({ params }: Props) {
  const { id } = await params;
  const [{ t, locale }, rec] = await Promise.all([getI18n(), getRecording(id)]);
  if (!rec) notFound();

  const [related, audio] = await Promise.all([
    getRelated(rec),
    rec.isAuthorized
      ? prisma.audioAsset.findMany({ where: { recordingId: rec.id, status: "READY" }, orderBy: { createdAt: "asc" } })
      : Promise.resolve([]),
    prisma.recording.update({ where: { id: rec.id }, data: { views: { increment: 1 } } }).catch(() => null),
  ]);

  const title = displayTitle(rec, locale);
  const category = (rec.category in CATEGORY_META ? rec.category : "OTHER") as Category;
  const embed = resolveEmbed(rec);
  const thumb = rec.thumbnailUrl || (rec.youtubeVideoId ? youTubeThumbnail(rec.youtubeVideoId, "hq") : null);
  const dateText = formatRecordingDate(rec, locale);

  const facts: [string, React.ReactNode][] = [
    [t.recording.date, dateText ?? t.card.unknownDate],
    [t.recording.event, rec.event],
    [t.recording.church, rec.church],
    [t.recording.location, rec.location],
    [t.recording.priest, rec.priest],
    [t.recording.choir, rec.choir],
    [t.recording.language, t.languages[rec.language as RecordingLanguage] ?? rec.language],
    [t.recording.duration, formatDuration(rec.duration) && <span dir="ltr">{formatDuration(rec.duration)}</span>],
    [t.recording.quality, t.quality[rec.audioQuality as AudioQuality] ?? rec.audioQuality],
    [
      t.recording.verification,
      <VerificationBadge
        key="v"
        status={rec.verification as VerificationStatus}
        label={t.verification[rec.verification as VerificationStatus] ?? rec.verification}
      />,
    ],
  ];

  return (
    <article className="pb-8">
      <div className="mx-auto max-w-6xl sm:px-8 sm:pt-6">
        {rec.isDemo && (
          <div className="border-b border-warn/40 bg-warn/10 p-3 text-sm sm:mb-4 sm:rounded-xl2 sm:border" role="note">
            ⚠️ {t.recording.demoBanner}
          </div>
        )}

        {embed.kind !== "none" ? (
          <EmbedPlayer src={embed.src} title={title} thumbnailUrl={thumb} icon={CATEGORY_META[category].icon} playLabel={t.card.play} />
        ) : (
          <div className="relative aspect-video w-full overflow-hidden bg-black sm:rounded-xl2">
            <Thumbnail src={thumb} alt={title} icon={CATEGORY_META[category].icon} className="opacity-60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 p-6 text-center text-white">
              <p className="max-w-md text-sm sm:text-base">{rec.embeddable ? t.recording.noPlayer : t.recording.notEmbeddable}</p>
              <a href={rec.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-[52px] px-7 text-base">
                ↗ {t.card.openSource}
              </a>
            </div>
          </div>
        )}

        <div className="px-4 pt-5 sm:px-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href={`/category/${CATEGORY_META[category].slug}`} className="chip">
              {CATEGORY_META[category].icon} {t.categories[category]}
            </Link>
            {rec.isAuthorized && <span className="chip border-ok/40 text-ok">♪ {t.card.authorized}</span>}
            <span className="text-muted">{fmt(t.recording.views, { count: formatNumber(rec.views + 1, locale) })}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
          {rec.originalTitle && rec.originalTitle !== title && (
            <p className="mt-1 text-sm text-muted">
              {t.recording.originalTitle}: <span dir="auto">{rec.originalTitle}</span>
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <a href={rec.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              ↗ {t.card.openSource}
            </a>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {rec.description && (
                <section>
                  <h2 className="mb-2 font-semibold text-muted">{t.recording.description}</h2>
                  <p className="whitespace-pre-line leading-relaxed" dir="auto">
                    {rec.description}
                  </p>
                </section>
              )}

              {rec.tags.length > 0 && (
                <section>
                  <h2 className="mb-2 font-semibold text-muted">{t.recording.tags}</h2>
                  <div className="flex flex-wrap gap-2">
                    {rec.tags.map((tag) => (
                      <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="chip" dir="auto">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {audio.length > 0 && (
                <section className="card p-4">
                  <h2 className="font-semibold">♪ {t.recording.authorizedAudio}</h2>
                  <p className="mt-1 text-sm text-muted">{t.recording.authorizedAudioHint}</p>
                  <div className="mt-4 space-y-4">
                    {audio.map((a) => (
                      <div key={a.id}>
                        <p className="mb-1 text-sm font-medium">
                          {a.kind === "ORIGINAL" ? t.recording.originalFile : t.recording.enhancedFile}
                        </p>
                        <audio controls preload="none" className="w-full" src={`/api/audio/${a.id}`} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {rec.notes && (
                <section>
                  <h2 className="mb-2 font-semibold text-muted">{t.recording.notes}</h2>
                  <p className="whitespace-pre-line text-sm" dir="auto">
                    {rec.notes}
                  </p>
                </section>
              )}
            </div>

            <aside className="space-y-4">
              <dl className="card divide-y divide-line">
                {facts
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="shrink-0 text-muted">{k}</dt>
                      <dd className="text-end font-medium" dir="auto">
                        {v}
                      </dd>
                    </div>
                  ))}
              </dl>

              <section className="card p-4 text-sm">
                <h2 className="mb-3 font-semibold">{t.recording.originalSource}</h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-muted">{t.search.source}</dt>
                    <dd className="font-medium">{t.sources[rec.source as Source] ?? rec.source}</dd>
                  </div>
                  {rec.channelName && (
                    <div>
                      <dt className="text-muted">{t.recording.channel}</dt>
                      <dd className="font-medium" dir="auto">
                        {rec.channelUrl ? (
                          <a href={rec.channelUrl} target="_blank" rel="noopener noreferrer" className="text-crimson hover:underline">
                            {rec.channelName}
                          </a>
                        ) : (
                          rec.channelName
                        )}
                      </dd>
                    </div>
                  )}
                  {rec.publishedAt && (
                    <div>
                      <dt className="text-muted">{t.recording.publishedAt}</dt>
                      <dd className="font-medium">{formatDate(rec.publishedAt, locale)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted">{t.recording.sourceLink}</dt>
                    <dd>
                      <a
                        href={rec.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-crimson hover:underline"
                        dir="ltr"
                      >
                        {rec.sourceUrl}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">{t.recording.discoveredAt}</dt>
                    <dd className="font-medium">{formatDate(rec.discoveredAt, locale)}</dd>
                  </div>
                </dl>
                <p className="mt-4 border-t border-line pt-3 text-xs text-muted">{t.recording.attribution}</p>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-8">
          <h2 className="section-title mb-5">{t.recording.related}</h2>
          <RecordingGrid items={related.map((r) => toCardData(r, locale, t))} labels={t.card} closeLabel={t.nav.close} />
        </section>
      )}
    </article>
  );
}
