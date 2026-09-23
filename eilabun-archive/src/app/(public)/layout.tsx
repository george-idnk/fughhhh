import AppShell from "@/components/AppShell";
import { getI18n } from "@/lib/i18n/server";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = await getI18n();
  return (
    <AppShell t={t} locale={locale}>
      {children}
    </AppShell>
  );
}
