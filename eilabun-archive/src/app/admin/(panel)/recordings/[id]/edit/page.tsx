import Link from "next/link";
import { notFound } from "next/navigation";
import AudioPanel from "@/components/admin/AudioPanel";
import DeleteButton from "@/components/admin/DeleteButton";
import RecordingForm from "@/components/admin/RecordingForm";
import { ffmpegAvailable } from "@/lib/audio";
import { prisma } from "@/lib/db";
import { recordingToFormValues } from "@/lib/form-values";
import { deleteRecording, updateRecording } from "../../../actions";

export default async function EditRecordingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const rec = await prisma.recording.findUnique({
    where: { id },
    include: { audioAssets: { orderBy: { createdAt: "asc" } } },
  });
  if (!rec) notFound();
  const hasFfmpeg = rec.isAuthorized ? await ffmpegAvailable() : false;

  return (
    <div className="mx-auto max-w-4xl">
      {saved && (
        <p className="mb-4 rounded-xl bg-ok/10 p-3 text-sm text-ok" role="status">
          ✔ Recording {saved === "created" ? "added to the archive" : "saved"}.{" "}
          <Link href={`/recordings/${rec.id}`} className="font-semibold underline">
            View public page
          </Link>
        </p>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold">Edit recording</h1>
          <p className="truncate text-sm text-muted" dir="auto">
            {rec.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/recordings/${rec.id}`} className="btn-ghost min-h-[40px]">
            View ↗
          </Link>
          <form action={deleteRecording}>
            <input type="hidden" name="id" value={rec.id} />
            <DeleteButton message="Delete this recording (and any authorized audio files) permanently?" />
          </form>
        </div>
      </div>

      <RecordingForm
        action={updateRecording.bind(null, rec.id)}
        initial={recordingToFormValues(rec)}
        submitLabel="Save changes"
        recordingId={rec.id}
      />

      <div className="mt-8">
        <AudioPanel
          recordingId={rec.id}
          isAuthorized={rec.isAuthorized}
          ffmpeg={hasFfmpeg}
          // Serverless hosts (e.g. Vercel) have no persistent disk for audio files.
          storageAvailable={!process.env.VERCEL}
          assets={rec.audioAssets.map((a) => ({
            id: a.id,
            kind: a.kind,
            parentId: a.parentId,
            originalName: a.originalName,
            sizeBytes: a.sizeBytes,
            status: a.status,
            error: a.error,
            settings: a.settings,
            createdAt: a.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
