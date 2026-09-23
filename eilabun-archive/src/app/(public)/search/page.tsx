import type { Metadata } from "next";
import BrowseView, { type RawSearchParams } from "@/components/BrowseView";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.search.title };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [{ t, locale }, sp] = await Promise.all([getI18n(), searchParams]);
  return (
    <BrowseView
      t={t}
      locale={locale}
      searchParams={sp}
      basePath="/search"
      heading={<h1 className="section-title">🔍 {t.search.title}</h1>}
    />
  );
}
