import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.about.title };
}

const CONTENT: Record<Locale, { h: string; p: string[] }[]> = {
  en: [
    {
      h: "What this archive is",
      p: [
        "A catalog and index of publicly available recordings — Divine Liturgies, hymns, Byzantine chants, prayers, feasts, processions and celebrations — related to the Melkite Greek Catholic community of Eilabun (عيلبون), in the Galilee.",
        "The archive does not host third-party videos. Each entry links to the original publication and, where the source allows it, plays through the source's official embedded player.",
      ],
    },
    {
      h: "Source rules we follow",
      p: [
        "We always keep the original source, the original URL, the channel or uploader, and the publication date when available.",
        "We never download, re-upload or redistribute copyrighted recordings, never bypass YouTube or platform restrictions or DRM, never scrape private content, and never remove watermarks.",
        "If a recording cannot be embedded, we show an “Open Original Source” button instead.",
        "Every entry has a verification status (Unverified, Reviewed, Verified) so visitors know whether it has been confirmed to belong to Eilabun.",
      ],
    },
    {
      h: "Authorized audio",
      p: [
        "When a rights holder provides a recording (for example, the parish's own recording), it can be stored here and optionally enhanced for clarity. The original file is always preserved unchanged next to the enhanced version.",
      ],
    },
    {
      h: "Corrections & removal",
      p: [
        "If you are the owner of a recording and want it corrected or removed from the catalog, please contact the archive administrator — it will be handled promptly.",
      ],
    },
  ],
  ar: [
    {
      h: "ما هو هذا الأرشيف",
      p: [
        "فهرس للتسجيلات المتاحة للعامة — القداديس الإلهية والترانيم والألحان البيزنطية والصلوات والأعياد والزياحات والاحتفالات — المتعلقة بطائفة الروم الملكيين الكاثوليك في عيلبون في الجليل.",
        "لا يستضيف الأرشيف مقاطع الآخرين. كل تسجيل يشير إلى مكان نشره الأصلي، ويُشغَّل عبر المشغّل الرسمي المضمَّن للمصدر عندما يسمح المصدر بذلك.",
      ],
    },
    {
      h: "قواعد المصادر التي نلتزم بها",
      p: [
        "نحتفظ دائمًا بالمصدر الأصلي والرابط الأصلي واسم القناة أو الناشر وتاريخ النشر عند توفّره.",
        "لا نقوم بتنزيل التسجيلات المحمية أو إعادة رفعها أو توزيعها، ولا نتجاوز قيود يوتيوب أو المنصات أو أنظمة حماية المحتوى، ولا نجمع محتوى خاصًا، ولا نزيل العلامات المائية.",
        "إذا تعذّر تضمين التسجيل نعرض زر «فتح المصدر الأصلي» بدلًا من ذلك.",
        "لكل تسجيل حالة تحقق (غير مُتحقَّق، تمت المراجعة، مُتحقَّق) ليعرف الزائر إن كان قد تأكّد انتماؤه إلى عيلبون.",
      ],
    },
    {
      h: "الصوت المُصرَّح به",
      p: [
        "عندما يقدّم صاحب الحقوق تسجيلًا (مثل تسجيلات الرعية نفسها)، يمكن حفظه هنا وتحسينه اختياريًا لزيادة الوضوح، مع الاحتفاظ دائمًا بالملف الأصلي دون أي تغيير إلى جانب النسخة المحسّنة.",
      ],
    },
    {
      h: "التصحيح والإزالة",
      p: ["إذا كنت صاحب تسجيل وترغب في تصحيحه أو إزالته من الفهرس، يرجى التواصل مع مسؤول الأرشيف وسيُعالَج الطلب سريعًا."],
    },
  ],
  he: [
    {
      h: "מהו הארכיון",
      p: [
        "קטלוג ואינדקס של הקלטות ציבוריות — ליטורגיות, מזמורים, מזמורים ביזנטיים, תפילות, חגים, תהלוכות וחגיגות — של הקהילה היוונית־קתולית המלכיתית בעילבון שבגליל.",
        "הארכיון אינו מאחסן סרטונים של אחרים. כל רשומה מקשרת לפרסום המקורי, ומתנגנת דרך הנגן המוטמע הרשמי של המקור כאשר המקור מאפשר זאת.",
      ],
    },
    {
      h: "כללי המקורות שלנו",
      p: [
        "אנו שומרים תמיד את המקור, הקישור המקורי, הערוץ או המעלה ותאריך הפרסום כשהוא זמין.",
        "איננו מורידים, מעלים מחדש או מפיצים הקלטות מוגנות, איננו עוקפים הגבלות של YouTube או של פלטפורמות או DRM, איננו אוספים תוכן פרטי ואיננו מסירים סימני מים.",
        "אם לא ניתן להטמיע הקלטה, מוצג כפתור „פתיחת המקור המקורי”.",
        "לכל רשומה סטטוס אימות (לא אומת, נבדק, אומת).",
      ],
    },
    {
      h: "שמע מורשה",
      p: ["כאשר בעל זכויות מספק הקלטה, ניתן לשמור אותה כאן ולשפר אותה; הקובץ המקורי נשמר תמיד ללא שינוי לצד הגרסה המשופרת."],
    },
    {
      h: "תיקונים והסרה",
      p: ["אם אתם בעלי הקלטה ומבקשים לתקן או להסיר אותה, פנו למנהל הארכיון."],
    },
  ],
};

export default async function AboutPage() {
  const { t, locale } = await getI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="section-title">📖 {t.about.title}</h1>
      <div className="mt-6 space-y-6">
        {CONTENT[locale].map((s) => (
          <section key={s.h} className="card p-5">
            <h2 className="font-display text-xl font-semibold text-crimson">{s.h}</h2>
            {s.p.map((p) => (
              <p key={p} className="mt-3 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
