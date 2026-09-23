import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="px-4 py-20 text-center">
      <p className="text-6xl" aria-hidden>
        🕯️
      </p>
      <h1 className="mt-4 section-title">{t.common.notFound}</h1>
      <p className="mt-2 text-muted">{t.common.notFoundText}</p>
      <Link href="/" className="btn-primary mt-6">
        {t.common.backHome}
      </Link>
    </div>
  );
}
