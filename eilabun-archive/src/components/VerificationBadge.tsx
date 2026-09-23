import type { VerificationStatus } from "@/lib/constants";

const STYLES: Record<VerificationStatus, string> = {
  VERIFIED: "bg-ok/15 text-ok",
  REVIEWED: "bg-gold/15 text-gold",
  UNVERIFIED: "bg-muted/10 text-muted",
};
const ICONS: Record<VerificationStatus, string> = { VERIFIED: "✔", REVIEWED: "◐", UNVERIFIED: "○" };

export default function VerificationBadge({ status, label }: { status: VerificationStatus; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? STYLES.UNVERIFIED}`}>
      <span aria-hidden>{ICONS[status] ?? "○"}</span>
      {label}
    </span>
  );
}
