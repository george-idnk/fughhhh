import Link from "next/link";
import Thumbnail from "@/components/Thumbnail";
import { CATEGORY_META, VERIFICATION_STATUSES, type Category, type VerificationStatus } from "@/lib/constants";
import { prisma } from "@/lib/db";
import en from "@/lib/i18n/en";
import { searchRecordings, toView } from "@/lib/recordings";
import { youTubeThumbnail } from "@/lib/url";
import { setVerification, toggleFlag } from "./actions";

type SP = Promise<{ q?: string; verification?: string; deleted?: string; page?: string }>;

const VSTYLE: Record<VerificationStatus, string> = {
  VERIFIED: "bg-ok text-white",
  REVIEWED: "bg-gold text-white",
  UNVERIFIED: "bg-surface-2 text-muted",
};

export default async function AdminHome({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const verification = VERIFICATION_STATUSES.find((v) => v === sp.verification) ?? "";
  const page = Number(sp.page) || 1;

  const [counts, result] = await Promise.all([
    prisma.recording.groupBy({ by: ["verification"], _count: { _all: true } }),
    q
      ? searchRecordings({ q, verification, page, pageSize: 50 }, "en")
      : (async () => {
          const where = verification ? { verification } : {};
          const [rows, total] = await Promise.all([
            prisma.recording.findMany({ where, orderBy: { discoveredAt: "desc" }, skip: (page - 1) * 50, take: 50 }),
            prisma.recording.count({ where }),
          ]);
          return { items: rows.map(toView), total, page, pages: Math.max(1, Math.ceil(total / 50)) };
        })(),
  ]);
  const countOf = (v: string) => counts.find((c) => c.verification === v)?._count._all ?? 0;
  const total = counts.reduce((a, c) => a + c._count._all, 0);

  return (
    <div>
      {sp.deleted && <p className="mb-4 rounded-xl bg-ok/10 p-3 text-sm text-ok">Recording deleted.</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Recordings</h1>
          <p className="text-sm text-muted">
            {total} total · {countOf("VERIFIED")} verified · {countOf("REVIEWED")} reviewed · {countOf("UNVERIFIED")}{" "}
            unverified
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/discover" className="btn-ghost">
            🔎 Discover
          </Link>
          <Link href="/admin/recordings/new" className="btn-primary">
            + Add recording
          </Link>
        </div>
      </div>

      <form className="mt-5 flex flex-wrap gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Search titles, tags, church…" className="input max-w-md flex-1" />
        <select name="verification" defaultValue={verification} className="input w-auto">
          <option value="">All statuses</option>
          {VERIFICATION_STATUSES.map((v) => (
            <option key={v} value={v}>
              {en.verification[v]}
            </option>
          ))}
        </select>
        <button className="btn-primary" type="submit">
          Filter
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {result.items.length === 0 && <p className="card p-6 text-center text-muted">No recordings found.</p>}
        {result.items.map((r) => {
          const cat = (r.category in CATEGORY_META ? r.category : "OTHER") as Category;
          const thumb = r.thumbnailUrl || (r.youtubeVideoId ? youTubeThumbnail(r.youtubeVideoId, "mq") : null);
          return (
            <div key={r.id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <div className="aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-40">
                <Thumbnail src={thumb} alt={r.title} icon={CATEGORY_META[cat].icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-gold-soft/60 px-2 py-0.5">
                    {CATEGORY_META[cat].icon} {en.categories[cat]}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5">{r.source}</span>
                  {r.isDemo && <span className="rounded-full bg-warn px-2 py-0.5 font-bold text-white">DEMO</span>}
                  {r.featured && <span className="rounded-full bg-gold px-2 py-0.5 text-white">★ Featured</span>}
                  {r.isAuthorized && <span className="rounded-full bg-ok/15 px-2 py-0.5 text-ok">♪ Authorized</span>}
                  {!r.embeddable && <span className="rounded-full bg-surface-2 px-2 py-0.5">Not embeddable</span>}
                </div>
                <p className="mt-1 truncate font-semibold" dir="auto">
                  {r.title}
                </p>
                <p className="truncate text-xs text-muted" dir="ltr">
                  {r.sourceUrl}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded-full border border-line" role="group" aria-label="Verification">
                  {VERIFICATION_STATUSES.map((v) => (
                    <form key={v} action={setVerification}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="verification" value={v} />
                      <button
                        type="submit"
                        title={`Mark as ${en.verification[v]}`}
                        aria-pressed={r.verification === v}
                        className={`min-h-[36px] px-2.5 text-xs font-medium ${
                          r.verification === v ? VSTYLE[v] : "bg-surface text-muted hover:bg-surface-2"
                        }`}
                      >
                        {en.verification[v]}
                      </button>
                    </form>
                  ))}
                </div>
                <form action={toggleFlag}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="flag" value="featured" />
                  <button className="btn-ghost min-h-[36px] px-3 text-xs" title="Toggle featured">
                    {r.featured ? "★" : "☆"}
                  </button>
                </form>
                <Link href={`/recordings/${r.id}`} className="btn-ghost min-h-[36px] px-3 text-xs">
                  View
                </Link>
                <Link href={`/admin/recordings/${r.id}/edit`} className="btn-primary min-h-[36px] px-4 text-xs">
                  Edit
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {result.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2 text-sm">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin?${new URLSearchParams({ q, verification, page: String(p) })}`}
              className={`chip ${p === result.page ? "bg-crimson text-white" : ""}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
