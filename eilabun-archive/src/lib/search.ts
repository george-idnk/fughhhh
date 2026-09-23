// Multilingual (Arabic / English / Hebrew) search helpers.
// Pure functions — no database access — so they can be unit-tested.

/** Canonical token that every spelling of Eilabun is folded into. */
export const EILABUN_TOKEN = "eilabun";

/**
 * Normalize text for matching:
 *  - lower-case, strip Latin diacritics
 *  - Arabic: remove tashkeel & tatweel, unify alef/yaa/taa-marbuta/hamza carriers
 *  - Hebrew: remove niqqud, fold final letters
 *  - punctuation → space
 */
export function normalize(input: string): string {
  let s = input.normalize("NFKD").toLowerCase();
  s = s.replace(/[̀-ͯ]/g, ""); // Latin combining marks
  s = s.replace(/[ً-ٰٟۖ-ۭ]/g, ""); // Arabic tashkeel
  s = s.replace(/ـ/g, ""); // tatweel
  s = s.replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
  s = s.replace(/ؤ/g, "و").replace(/ئ/g, "ي");
  s = s.replace(/[֑-ׇ]/g, ""); // Hebrew niqqud & cantillation
  s = s.replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ");
  s = s.replace(/[׳״'"`’‘“”]/g, "");
  s = s.replace(/[^\p{L}\p{N}]+/gu, " ");
  return s.trim().replace(/\s+/g, " ");
}

// Every spelling of Eilabun, already normalized (Arabic prefixes like ب/و/ل handled below).
const EILABUN_VARIANTS = new Set(
  [
    "عيلبون",
    "ايلبون",
    "ايلابن",
    "عيلابون",
    "عيلبوني",
    "عيلبونيه",
    "eilabun",
    "eilaboun",
    "eilaboon",
    "eilabon",
    "ilabun",
    "ilaboun",
    "ailabun",
    "ailaboun",
    "elabun",
    "elaboun",
    "eylabun",
    "עילבון",
    "עילאבון",
    "איילבון",
  ].map(normalize),
);

const LATIN_EILABUN = /^(e|a|ai|ei|ey|i)?y?[il]?l+a+b+(u|o|ou|oo)+n+$/;

/** Is this (normalized) token a spelling of Eilabun? */
export function isEilabunToken(token: string): boolean {
  if (EILABUN_VARIANTS.has(token)) return true;
  const stripped = stripArabicPrefix(token);
  if (stripped !== token && EILABUN_VARIANTS.has(stripped)) return true;
  if (/^[a-z]+$/.test(token) && token.length >= 5 && token.length <= 10) {
    if (LATIN_EILABUN.test(token)) return true;
    if (levenshtein(token, EILABUN_TOKEN) <= 2) return true;
  }
  return false;
}

/** Remove common Arabic clitics: و، ب، ل، ف، ك + definite article. */
export function stripArabicPrefix(token: string): string {
  if (!/^[؀-ۿ]+$/.test(token)) return token;
  const m = token.match(/^(وال|بال|فال|كال|لل|ال|و|ب|ف|ل)(.+)$/);
  if (m && m[2].length >= 3) return m[2];
  return token;
}

/**
 * Concept groups: any term in a group matches any other term in that group.
 * All terms are stored normalized. Multi-word terms are matched as phrases.
 */
const RAW_SYNONYMS: string[][] = [
  ["قداس", "قداديس", "القداس الالهي", "ليتورجيا", "ليترجيا", "ذبيحه", "mass", "masses", "liturgy", "liturgies", "divine liturgy", "ליטורגיה", "מיסה"],
  ["ترنيمه", "ترانيم", "تراتيل", "ترتيله", "ترتيل", "تسابيح", "hymn", "hymns", "chant", "chants", "song", "songs", "מזמור", "מזמורים", "שירה"],
  ["بيزنطي", "بيزنطيه", "رومي", "byzantine", "ביזנטי", "ביזנטיים"],
  ["صلاه", "صلوات", "prayer", "prayers", "pray", "תפילה", "תפילות"],
  ["الميلاد", "ميلاد", "عيد الميلاد", "christmas", "nativity", "xmas", "חג המולד", "מולד"],
  ["القيامه", "قيامه", "الفصح", "فصح", "عيد الفصح", "عيد القيامه", "easter", "resurrection", "pascha", "פסחא", "חג הפסחא", "תחייה"],
  ["الشعانين", "شعانين", "سعف", "palm sunday", "palm", "palms", "hosanna", "דקלים", "יום הדקלים"],
  ["مار جرجس", "جرجس", "الخضر", "خضر", "جاورجيوس", "القديس جاورجيوس", "saint george", "st george", "george", "georgios", "גאורגיוס", "גיורגיס", "ג ורג"],
  ["البشاره", "بشاره", "عيد البشاره", "annunciation", "הבשורה", "בשורה"],
  ["التجلي", "تجلي", "transfiguration", "ההשתנות"],
  ["الغطاس", "غطاس", "الدنح", "epiphany", "theophany", "baptism of the lord", "טבילה"],
  ["زياح", "زياحات", "تطواف", "مسيره", "procession", "processions", "תהלוכה", "תהלוכות"],
  ["احتفال", "احتفالات", "celebration", "celebrations", "festival", "חגיגה", "חגיגות"],
  ["عيد", "اعياد", "feast", "feasts", "feast day", "holiday", "חג", "חגים"],
  ["شبيبه", "شباب", "كشاف", "كشافه", "youth", "scouts", "young", "נוער", "צופים"],
  ["جوقه", "كورال", "choir", "chorus", "מקהלה"],
  ["كاهن", "خوري", "الاب", "ابونا", "priest", "father", "fr", "כומר", "האב"],
  ["مطران", "المطران", "sayedna", "سيدنا", "bishop", "archbishop", "בישוף", "ארכיבישוף"],
  ["كنيسه", "church", "כנסייה", "כנסיה"],
  ["كاثوليك", "كاثوليكي", "كاثوليكيه", "روم كاثوليك", "ملكي", "ملكيه", "ملكيين", "catholic", "melkite", "greek catholic", "קתולי", "קתולית", "מלכיתי", "יוונית קתולית"],
  ["قديم", "قديمه", "old", "older", "archive", "vintage", "ישן", "ישנות"],
  ["جنازه", "جناز", "funeral", "הלוויה"],
  ["عرس", "اكليل", "زواج", "wedding", "marriage", "חתונה"],
  ["معموديه", "عماد", "baptism", "טבילה"],
  ["الجمعه العظيمه", "جمعه الالام", "الجناز", "good friday", "holy friday", "יום שישי הטוב"],
  ["العذراء", "مريم", "السيده", "virgin mary", "theotokos", "mary", "מרים", "הבתולה"],
];

const SYNONYM_GROUPS: string[][] = RAW_SYNONYMS.map((g) => Array.from(new Set(g.map(normalize))));

/** A query "concept": matching any of its alternatives counts as a hit. */
export interface QueryConcept {
  label: string;
  alternatives: string[]; // normalized strings (words or phrases)
  isEilabun: boolean;
}

function tokenAlternatives(token: string): string[] {
  const alts = new Set<string>([token]);
  const stripped = stripArabicPrefix(token);
  alts.add(stripped);
  for (const group of SYNONYM_GROUPS) {
    if (group.includes(token) || group.includes(stripped)) group.forEach((g) => alts.add(g));
  }
  return Array.from(alts);
}

/**
 * Turn a free-text query into concepts. Multi-word synonyms ("saint george",
 * "مار جرجس", "عيد الميلاد") are recognised as phrases first.
 */
export function parseQuery(query: string): QueryConcept[] {
  const norm = normalize(query);
  if (!norm) return [];
  let tokens = norm.split(" ");
  const concepts: QueryConcept[] = [];

  // Greedy phrase detection (longest first, up to 3 words).
  const used = new Array(tokens.length).fill(false);
  for (let size = 3; size >= 2; size--) {
    for (let i = 0; i + size <= tokens.length; i++) {
      if (used.slice(i, i + size).some(Boolean)) continue;
      const phrase = tokens.slice(i, i + size).join(" ");
      const group = SYNONYM_GROUPS.find((g) => g.includes(phrase));
      if (group) {
        concepts.push({ label: phrase, alternatives: group, isEilabun: false });
        for (let j = i; j < i + size; j++) used[j] = true;
      }
    }
  }
  tokens = tokens.filter((_, i) => !used[i]);

  for (const token of tokens) {
    if (isEilabunToken(token)) {
      concepts.push({ label: token, alternatives: [EILABUN_TOKEN], isEilabun: true });
      continue;
    }
    // Ignore very common stop words in any of the three languages.
    if (STOP_WORDS.has(token)) continue;
    concepts.push({ label: token, alternatives: tokenAlternatives(token), isEilabun: false });
  }
  return concepts;
}

const STOP_WORDS = new Set(
  ["in", "of", "the", "and", "a", "an", "at", "for", "في", "من", "على", "الى", "و", "ب", "של", "ב", "ו", "את", "עם"].map(
    normalize,
  ),
);

/** Normalize a document field and fold all Eilabun spellings into EILABUN_TOKEN. */
export function prepareField(text: string | null | undefined): string {
  if (!text) return "";
  const norm = normalize(text);
  if (!norm) return "";
  return norm
    .split(" ")
    .map((t) => (isEilabunToken(t) ? EILABUN_TOKEN : t))
    .join(" ");
}

export interface SearchableField {
  text: string; // prepared (normalized) text
  weight: number;
}

function fieldMatches(field: string, alt: string): boolean {
  if (!field) return false;
  const padded = " " + field + " ";
  if (alt.length < 3) return padded.includes(" " + alt + " ");
  // Arabic & Hebrew attach prefixes (ال، و، ب / ה، ו، ב) to words, so a substring
  // match is used: "قداس" matches "والقداس". Latin uses word-prefix matching so
  // "hymn" matches "hymns" but "old" does not match "golden".
  if (/[a-z0-9]/.test(alt[0])) return padded.includes(" " + alt);
  return field.includes(alt);
}

function fuzzyTokenMatch(field: string, alt: string): boolean {
  if (alt.length < 5 || alt.includes(" ")) return false;
  const maxDist = alt.length >= 8 ? 2 : 1;
  for (const tok of field.split(" ")) {
    if (Math.abs(tok.length - alt.length) > maxDist) continue;
    if (levenshtein(tok, alt) <= maxDist) return true;
  }
  return false;
}

export interface ScoreResult {
  matched: number; // how many concepts matched
  score: number;
}

/** Score a document (list of weighted, prepared fields) against parsed concepts. */
export function scoreDocument(fields: SearchableField[], concepts: QueryConcept[]): ScoreResult {
  let matched = 0;
  let score = 0;
  for (const concept of concepts) {
    let best = 0;
    for (const f of fields) {
      for (const alt of concept.alternatives) {
        if (fieldMatches(f.text, alt)) {
          // Exact query word scores higher than a synonym.
          const bonus = alt === concept.label ? 1.25 : 1;
          best = Math.max(best, f.weight * bonus);
        } else if (best === 0 && fuzzyTokenMatch(f.text, alt)) {
          best = Math.max(best, f.weight * 0.5);
        }
      }
    }
    if (best > 0) {
      matched++;
      score += best;
    }
  }
  return { matched, score };
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}
