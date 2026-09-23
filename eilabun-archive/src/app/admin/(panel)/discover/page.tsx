import DiscoverClient from "@/components/admin/DiscoverClient";
import { EILABUN_SPELLINGS } from "@/lib/constants";
import { youTubeApiKey } from "@/lib/youtube";

const SUGGESTED = [
  "عيلبون قداس",
  "قداس عيلبون",
  "ترانيم عيلبون",
  "كنيسة عيلبون",
  "مار جرجس عيلبون",
  "عيد الفصح عيلبون",
  "عيد الميلاد عيلبون",
  "أحد الشعانين عيلبون",
  "Eilabun church",
  "Eilabun mass",
  "Eilaboun Melkite",
  "Eilabun Catholic",
  "עילבון כנסייה",
];

export default function DiscoverPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Discover public recordings</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Searches public results through official APIs. Nothing is added automatically — review each result, check it really
        belongs to Eilabun, then press <strong>“Add to Archive”</strong> to open a pre-filled form. Duplicates (same YouTube
        id or URL) are flagged.
      </p>
      <DiscoverClient hasYouTubeKey={!!youTubeApiKey()} suggested={SUGGESTED} spellings={[...EILABUN_SPELLINGS]} />
    </div>
  );
}
