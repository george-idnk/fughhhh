import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrowseView, { type RawSearchParams } from "@/components/BrowseView";
import { CATEGORY_META, categoryFromSlug } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getI18n();
  const c = categoryFromSlug(slug);
  return { title: c ? t.categories[c] : t.common.notFound };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp, { t, locale }] = await Promise.all([params, searchParams, getI18n()]);
  const category = categoryFromSlug(slug);
  if (!category) notFound();
  return (
    <BrowseView
      t={t}
      locale={locale}
      searchParams={sp}
      fixedCategory={category}
      basePath={`/category/${slug}`}
      heading={
        <h1 className="section-title">
          <span aria-hidden>{CATEGORY_META[category].icon}</span> {t.categories[category]}
        </h1>
      }
    />
  );
}
