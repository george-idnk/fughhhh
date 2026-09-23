# Eilabun Melkite Catholic Archive
### أرشيف الترانيم والقداديس والاحتفالات الكاثوليكية الملكية في عيلبون

A searchable, multilingual (Arabic · English · Hebrew) **catalog** of publicly available Melkite Greek Catholic liturgies, hymns, Byzantine chants, prayers, feasts, processions and celebrations from **Eilabun (عيلبون)**. It indexes public sources such as YouTube, church websites, Facebook pages and the Internet Archive, and plays them only through each source's **official embedded player**.

Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite (dev) / PostgreSQL (prod)**.

---

## 1. Quick start

Requirements: **Node.js 20+** and npm. `ffmpeg` is optional (only needed for the authorized-audio enhancement feature).

**Easiest way (3 commands after `npm install`):**

```bash
cd eilabun-archive
npm install              # download dependencies (once)
npm run quickstart       # creates .env + secret, database and demo entries
npm run admin:create     # choose your admin email and password
npm run dev              # open http://localhost:3000
```

Manual equivalent:

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # then edit .env (see §2)
npx prisma migrate deploy        # create the SQLite database (prisma/dev.db)
npm run db:seed                  # add clearly-marked DEMO entries (optional)
npm run admin:create             # create your admin account (prompts for email/password)
npm run dev                      # http://localhost:3000
```

Production mode locally:

```bash
npm run build
npm start                        # http://localhost:3000
```

Useful scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (search, URL/duplicate logic, audio pipeline) |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Insert/update demo entries |
| `npm run db:seed -- --remove-demo` | Delete all demo entries |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run admin:create` | Create an admin or reset its password |
| `npm run audio:enhance -- <assetId>` | Run the enhancement pipeline from the CLI |

## 2. Configure `.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` for SQLite (relative to `prisma/`), or a PostgreSQL URL |
| `AUTH_SECRET` | yes | ≥ 32 random chars used to sign admin sessions. Generate: `openssl rand -base64 48` |
| `YOUTUBE_API_KEY` | no | Enables automatic YouTube discovery and richer metadata |
| `NEXT_PUBLIC_SITE_URL` | no | Public URL of the site (metadata) |
| `DEFAULT_LOCALE` | no | `ar` (default), `en` or `he` |
| `STORAGE_DIR` | no | Where authorized audio files are stored (default `./storage`, never public) |
| `MAX_UPLOAD_MB` | no | Max authorized-audio upload size (default 300) |
| `FFMPEG_PATH` | no | Path to `ffmpeg` (default `ffmpeg`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | Non-interactive admin creation |

Never commit `.env`; API keys are read only from the environment.

## 3. YouTube API (optional)

1. Open <https://console.cloud.google.com/>, create a project.
2. **APIs & Services → Library → “YouTube Data API v3” → Enable.**
3. **Credentials → Create credentials → API key.** Restrict it to *YouTube Data API v3* (and, in production, to your server's IP).
4. Put it in `.env` as `YOUTUBE_API_KEY=...` and restart the server.

Quota: a discovery search costs ~101 units (search + video details); the default quota is 10,000 units/day.

**Without a key** the archive still works fully with manually added recordings. The admin area shows a notice that automatic discovery needs the key; adding a YouTube link still pre-fills title/channel/thumbnail using YouTube's keyless official **oEmbed** endpoint, and Internet Archive discovery needs no key.

## 4. Database

- Development uses SQLite: `npx prisma migrate deploy` creates `prisma/dev.db`.
- Schema: `prisma/schema.prisma` — `Recording`, `AudioAsset`, `AdminUser`. Category, source, language, quality and verification values are validated strings (see `src/lib/constants.ts`) so the same schema works on PostgreSQL.
- Recording fields include: `title`, `originalTitle`, `titleAr/En/He`, `category`, `subcategory`, `event`, `date`, `year`, `church`, `location`, `language`, `priest`, `choir`, `source`, `sourceUrl`, `canonicalUrl` (unique), `youtubeVideoId` (unique), `channelName`, `channelUrl`, `publishedAt`, `thumbnailUrl`, `duration` (seconds), `description`, `discoveredAt`, `audioQuality`, `notes`, `tags`, `verification`, `isAuthorized`, `rightsNotes`, `embeddable`, `featured`, `isDemo`.

### Seed data
`npm run db:seed` adds 12 **demo** entries titled *“Example recording — replace with verified source”*, flagged `isDemo`, labelled “Demo” in the UI and with a site-wide notice. They are **not** real recordings: each links to a public YouTube *search page* for the relevant terms (e.g. “قداس عيلبون”) to help you find genuine sources. Remove them with `npm run db:seed -- --remove-demo`.

## 5. Admin account & security

```bash
npm run admin:create                      # interactive
npm run admin:create -- you@example.org   # prompts for the password
ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='long-password' npm run admin:create
```

Running it again for the same email resets the password. Sign in at **`/admin/login`**.

- Passwords hashed with bcrypt (cost 12); sessions are signed HS256 JWTs in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production), valid 7 days.
- `/admin/**` is protected by middleware **and** every admin page, server action and API route re-checks the session. State-changing admin API calls also verify the `Origin` header.
- Login attempts are rate-limited (8 per 15 min per IP+email, per process).
- Admin pages send `noindex`.

## 6. Adding recordings

**Manually** — *Admin → + Add recording*:
1. Paste the public URL (YouTube, Facebook, church site, archive.org …) and press **Fetch metadata**. The form is pre-filled from the YouTube Data API (with key), YouTube oEmbed (without key), archive.org metadata, or the page's OpenGraph tags.
2. Choose category (and optional secondary category), event, date or year, church, priest, choir, language, tags (comma-separated, any language), description, quality.
3. Set **verification** (Unverified / Reviewed / Verified), **Featured**, and — only when you own it or have permission — **Original / authorized audio** (a rights statement is then required).
4. Save. You can edit, re-categorise, verify or delete it later. The admin list has one-click verification buttons and a featured toggle.

**Duplicate detection** — a recording is rejected (with a link to the existing entry) when its YouTube video id, canonical URL (normalised host, no tracking params such as `utm_*`/`si`/`fbclid`, sorted query, all YouTube URL forms folded to `watch?v=`) or raw source URL already exists. The form also warns as soon as you leave the URL field.

## 7. Automatic discovery

*Admin → Discover*:
- **YouTube** (needs `YOUTUBE_API_KEY`): searches public videos via the official API and shows title, thumbnail, channel, date, URL, video id, duration and whether embedding is allowed. Suggested queries cover Arabic, English and Hebrew spellings (`عيلبون قداس`, `Eilaboun Melkite`, `עילבון כנסייה` …). Sort by relevance, date or views; “Load more” pages through results.
- **Internet Archive** (no key): searches public audio/video items; includes an “All spellings of Eilabun” query.
- **Manual helpers**: one-click links to YouTube, Facebook and archive.org searches for every spelling (عيلبون، إيلبون، إيلابن، عيلابون، Eilabun, Eilaboun, Ilabun, Ailabun, עילבון …).

Nothing is added automatically. Each result has **“Add to Archive”**, which opens a pre-filled form for review; results already archived show **“Already archived”**.

## 8. Search

Search runs across Arabic/English/Hebrew titles, original title, tags, event, category names (all 3 languages), church, priest, choir, channel, dates/years, description and notes, with:
- Arabic normalisation (hamza/alef forms, ى/ي, ة/ه, diacritics, prefixes ال/و/ب/ل), Hebrew niqqud/final-letter folding, Latin accent folding;
- **every spelling of Eilabun** treated as the same word (plus fuzzy Latin variants);
- cross-language concept matching: قداس ↔ mass/liturgy ↔ ליטורגיה, مار جرجس ↔ Saint George ↔ الخضر, عيد القيامة ↔ Easter, الميلاد ↔ Christmas, الشعانين ↔ Palm Sunday, البشارة ↔ Annunciation, ترانيم ↔ hymns …;
- small-typo tolerance.

Filters: category, year, language, church, source, recording quality (≥), verification. Sort: most relevant, newest, oldest, alphabetical. Search is done in-process and is fast for thousands of recordings; for much larger catalogues move it to PostgreSQL full-text search.

## 9. Authorized audio & enhancement (optional)

For recordings **you own or have written permission to process** (never for third-party YouTube content):
1. Tick *Original / authorized audio* and describe the rights; save.
2. On the edit page upload the file (mp3, wav, flac, m4a, ogg, opus, webm, mp4) and confirm the rights statement.
3. Choose settings and press **Create enhanced version**.

Pipeline (ffmpeg): rumble high-pass · 50/60 Hz hum notches + harmonics · FFT noise reduction (light/medium/strong) · hiss reduction · vocal/chant clarity EQ · gentle/strong compression · leading/trailing silence trim · EBU R128 loudness normalisation → AAC 192 kbps.

The **original is stored read-only and never modified** (its SHA-256 is verified after processing); every run creates a separate enhanced file. Both are streamed on the public recording page (with HTTP Range support for phones) only while the recording is marked authorized. Files live in `STORAGE_DIR`, outside `public/`.

## 10. Copyright & source rules

This archive is a **catalog/index**. It:
- always keeps the original source, URL, channel/uploader and publication date;
- plays YouTube only via the official embed (`youtube-nocookie.com`) and archive.org via its official embed; nothing is downloaded or re-uploaded;
- shows **“Open Original Source”** when embedding is not allowed or not supported (e.g. Facebook, generic websites);
- never bypasses platform restrictions or DRM, never scrapes private content, never removes watermarks;
- reads only public metadata (official APIs, oEmbed, OpenGraph tags), with private-network (SSRF) protection;
- processes audio only for authorized recordings, keeping the original untouched.

If a rights holder asks for correction or removal, edit or delete the entry in the admin area.

## 11. Deploying

**Any Node host / VPS (simplest, supports SQLite + audio files):**
```bash
npm ci
npx prisma migrate deploy
npm run build
npm run admin:create
NODE_ENV=production npm start      # behind nginx/Caddy with HTTPS
```
Keep `prisma/dev.db` (or your DB) and `STORAGE_DIR` on persistent disk and back them up. Install `ffmpeg` if you want audio enhancement.

**PostgreSQL:** in `prisma/schema.prisma` set `provider = "postgresql"`, set `DATABASE_URL=postgresql://user:pass@host:5432/eilabun`, delete `prisma/migrations`, then run `npx prisma migrate dev --name init` once and `npx prisma migrate deploy` on the server.

**Vercel / serverless:** use PostgreSQL (e.g. Neon, Supabase), set the env vars in the dashboard and use `prisma migrate deploy && next build` as the build command. Serverless file systems are ephemeral, so the authorized-audio feature needs a persistent server (or adapt `src/lib/audio.ts` to object storage).

Always set a strong `AUTH_SECRET` and serve over HTTPS in production.

## 12. Project structure

```
prisma/            schema, migrations, seed (demo data)
scripts/           create-admin, enhance-audio
src/app/(public)/  home, search, category/[slug], recordings/[id], about
src/app/admin/     login, recordings list, add/edit, discover (+ server actions)
src/app/api/       admin APIs (metadata, duplicate, discover, audio) + public audio stream
src/components/    UI (cards, player, filters, navigation, admin forms)
src/lib/           search, i18n (ar/en/he), YouTube & metadata clients, auth, audio pipeline
tests/             unit tests (node:test)
```

Mobile: responsive layout with a drawer menu, 44px+ touch targets, click-to-load players (fast on Android), `playsinline` embeds, full RTL for Arabic and Hebrew (logical CSS properties), and light/dark themes.
