import RecordingForm from "@/components/admin/RecordingForm";
import { EMPTY_FORM_VALUES, PREFILL_KEYS } from "@/lib/form-values";
import { createRecording } from "../../actions";

export default async function NewRecordingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const initial = { ...EMPTY_FORM_VALUES };
  for (const k of PREFILL_KEYS) {
    const v = sp[k];
    if (typeof v === "string") initial[k] = v.slice(0, 5000);
  }
  const fromDiscovery = !!sp.sourceUrl;
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-semibold">Add recording</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        {fromDiscovery
          ? "Review the details from discovery, classify the recording, then save it to the archive."
          : "Paste the public source URL and press “Fetch metadata”, or fill the fields manually."}{" "}
        Do not add recordings you cannot attribute to a public source.
      </p>
      <RecordingForm action={createRecording} initial={initial} submitLabel="Add to archive" />
    </div>
  );
}
