import Link from "next/link";

export default function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 py-8 sm:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="section-title">{title}</h2>
        {href && linkLabel && (
          <Link href={href} className="shrink-0 text-sm font-semibold text-crimson hover:underline">
            {linkLabel} <span className="inline-block rtl:rotate-180">→</span>
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
