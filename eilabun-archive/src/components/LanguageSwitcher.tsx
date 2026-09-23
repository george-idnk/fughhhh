"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-full border border-line bg-surface p-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          disabled={pending}
          aria-pressed={l === current}
          onClick={() =>
            start(async () => {
              await setLocale(l);
              router.refresh();
            })
          }
          className={`min-h-[36px] rounded-full px-3 text-sm font-medium transition ${
            l === current ? "bg-crimson text-white" : "text-muted hover:bg-surface-2 hover:text-ink"
          }`}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
