/**
 * Seed data — EXAMPLE / DEMO entries only.
 *
 * These are NOT real Eilabun recordings. Each one is clearly marked (isDemo = true,
 * title "Example recording — replace with verified source") and points to a public
 * YouTube *search page* for the relevant terms, not to any specific video, so no
 * recording is invented. Replace them with verified sources via /admin.
 *
 *   npm run db:seed                  # insert/update demo entries
 *   npm run db:seed -- --remove-demo # delete all demo entries
 */
import { PrismaClient } from "@prisma/client";
import { canonicalizeUrl } from "../src/lib/url";

const prisma = new PrismaClient();
const PREFIX = "Example recording — replace with verified source";

const search = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

interface Demo {
  label: string;
  labelAr: string;
  labelHe: string;
  category: string;
  subcategory?: string;
  event?: string;
  query: string;
  date?: string;
  year?: number;
  language: string;
  tags: string[];
  featured?: boolean;
  audioQuality?: string;
}

const DEMOS: Demo[] = [
  { label: "Divine Liturgy", labelAr: "القداس الإلهي", labelHe: "ליטורגיה אלוהית", category: "DIVINE_LITURGY", event: "Sunday Divine Liturgy · قداس الأحد", query: "قداس عيلبون", date: "2024-05-12", language: "ar", tags: ["قداس", "Divine Liturgy", "ليتورجيا", "Sunday"], featured: true, audioQuality: "GOOD" },
  { label: "Hymns of the parish choir", labelAr: "ترانيم جوقة الرعية", labelHe: "מזמורי מקהלת הקהילה", category: "HYMNS", query: "ترانيم عيلبون", year: 2019, language: "ar", tags: ["ترانيم", "جوقة", "hymns", "choir"], featured: true },
  { label: "Byzantine chant", labelAr: "لحن بيزنطي", labelHe: "מזמור ביזנטי", category: "BYZANTINE_CHANTS", query: "Eilabun byzantine chant", date: "2022-09-14", language: "el", tags: ["Byzantine", "بيزنطي", "chant", "ألحان"] },
  { label: "Evening prayer", labelAr: "صلاة الغروب", labelHe: "תפילת ערבית", category: "PRAYERS", event: "Vespers · صلاة الغروب", query: "صلاة عيلبون", year: 2021, language: "ar", tags: ["صلاة", "Vespers", "prayer"] },
  { label: "Christmas Divine Liturgy", labelAr: "قداس عيد الميلاد", labelHe: "ליטורגיית חג המולד", category: "CHRISTMAS", subcategory: "DIVINE_LITURGY", event: "Christmas · عيد الميلاد المجيد", query: "قداس عيد الميلاد عيلبون", date: "2023-12-25", language: "ar", tags: ["الميلاد", "Christmas", "قداس"], featured: true, audioQuality: "EXCELLENT" },
  { label: "Resurrection (Easter) celebration", labelAr: "احتفال عيد القيامة", labelHe: "חגיגת חג הפסחא", category: "EASTER", event: "Easter · عيد الفصح المجيد", query: "عيد القيامة عيلبون", date: "2024-05-05", language: "ar", tags: ["القيامة", "الفصح", "Easter", "المسيح قام"] },
  { label: "Palm Sunday procession", labelAr: "زياح أحد الشعانين", labelHe: "תהלוכת יום ראשון של הדקלים", category: "PALM_SUNDAY", subcategory: "PROCESSIONS", event: "Palm Sunday · أحد الشعانين", query: "أحد الشعانين عيلبون", date: "2024-04-28", language: "ar", tags: ["الشعانين", "Palm Sunday", "زياح", "سعف"] },
  { label: "Feast of Saint George", labelAr: "عيد مار جرجس", labelHe: "חג גאורגיוס הקדוש", category: "SAINT_GEORGE", subcategory: "FEAST_DAYS", event: "Feast of Saint George · عيد مار جرجس", query: "مار جرجس عيلبون", date: "2023-05-06", language: "ar", tags: ["مار جرجس", "Saint George", "الخضر", "عيد"], featured: true },
  { label: "Feast of the Annunciation", labelAr: "عيد البشارة", labelHe: "חג הבשורה", category: "FEAST_DAYS", event: "Annunciation · عيد البشارة", query: "عيد البشارة عيلبون", date: "2022-03-25", language: "ar", tags: ["البشارة", "Annunciation", "العذراء"] },
  { label: "Parish celebration", labelAr: "احتفال الرعية", labelHe: "חגיגת הקהילה", category: "CELEBRATIONS", query: "Eilabun church celebration", year: 2018, language: "mixed", tags: ["احتفال", "celebration", "رعية"] },
  { label: "Youth & scouts celebration", labelAr: "احتفال الشبيبة والكشاف", labelHe: "חגיגת הנוער והצופים", category: "YOUTH", query: "شبيبة عيلبون", year: 2020, language: "ar", tags: ["شبيبة", "كشاف", "youth", "scouts"] },
  { label: "Older recording of a Holy Week service", labelAr: "تسجيل قديم لصلاة أسبوع الآلام", labelHe: "הקלטה ישנה של תפילת השבוע הקדוש", category: "OLD_RECORDINGS", subcategory: "PRAYERS", event: "Holy Week · أسبوع الآلام", query: "عيلبون تسجيل قديم", year: 1998, language: "ar", tags: ["قديم", "old", "أسبوع الآلام", "Holy Week"], audioQuality: "POOR" },
];

async function main() {
  if (process.argv.includes("--remove-demo")) {
    const { count } = await prisma.recording.deleteMany({ where: { isDemo: true } });
    console.log(`Removed ${count} demo entries.`);
    return;
  }

  for (const d of DEMOS) {
    const sourceUrl = search(d.query);
    const canonicalUrl = canonicalizeUrl(sourceUrl);
    const data = {
      title: `${PREFIX} (${d.label})`,
      titleEn: `${PREFIX} (${d.label})`,
      titleAr: `مثال تجريبي — يُستبدل بمصدر مُتحقَّق (${d.labelAr})`,
      titleHe: `רשומה לדוגמה — להחלפה במקור מאומת (${d.labelHe})`,
      originalTitle: null,
      category: d.category,
      subcategory: d.subcategory ?? null,
      event: d.event ?? null,
      date: d.date ? new Date(`${d.date}T00:00:00Z`) : null,
      year: d.date ? Number(d.date.slice(0, 4)) : (d.year ?? null),
      church: "Melkite Greek Catholic parish, Eilabun (example)",
      location: "Eilabun · عيلبون",
      language: d.language,
      source: "OTHER",
      sourceUrl,
      canonicalUrl,
      youtubeVideoId: null,
      channelName: "Demo data — no real source yet",
      description:
        "DEMO PLACEHOLDER. This entry does not correspond to a real recording. " +
        `Its link opens a public YouTube search for “${d.query}” to help an administrator find and verify a genuine source, ` +
        "which should then replace this entry.\n\n" +
        "مثال تجريبي فقط — لا يمثل تسجيلًا حقيقيًا. الرابط يفتح بحثًا عامًا في يوتيوب للمساعدة في العثور على مصدر حقيقي والتحقق منه.",
      audioQuality: d.audioQuality ?? "UNKNOWN",
      notes: "Seeded demo record (prisma/seed.ts). Delete with: npm run db:seed -- --remove-demo",
      tags: JSON.stringify([...d.tags, "demo", "عيلبون"]),
      verification: "UNVERIFIED",
      isAuthorized: false,
      embeddable: false, // a search page cannot be embedded → "Open Original Source"
      featured: d.featured ?? false,
      isDemo: true,
    };
    await prisma.recording.upsert({ where: { canonicalUrl }, create: data, update: data });
  }
  console.log(`Seeded ${DEMOS.length} clearly-marked demo entries.`);

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const bcrypt = (await import("bcryptjs")).default;
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.upsert({ where: { email }, create: { email, passwordHash }, update: {} });
    console.log(`Admin account ensured for ${email} (existing passwords are not changed).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
