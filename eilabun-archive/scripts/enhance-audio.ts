/**
 * Run the audio-enhancement pipeline from the command line on an ORIGINAL asset
 * of an authorized recording (same pipeline as the admin UI).
 *
 *   npm run audio:enhance -- <originalAssetId> [--noise=strong] [--hum=60|off] [--no-trim]
 *
 * List assets with:  npx prisma studio   (table AudioAsset)
 */
import { DEFAULT_ENHANCE_SETTINGS, enhanceOriginal, ffmpegAvailable, parseEnhanceSettings } from "../src/lib/audio";
import { prisma } from "../src/lib/db";

async function main() {
  const [id, ...flags] = process.argv.slice(2);
  if (!id) throw new Error("Usage: npm run audio:enhance -- <originalAssetId> [--noise=off|light|medium|strong] [--hum=50|60|off] [--no-trim] [--no-normalize]");
  if (!(await ffmpegAvailable())) throw new Error("ffmpeg not found — install it or set FFMPEG_PATH");
  const opt = (name: string) => flags.find((f) => f.startsWith(`--${name}=`))?.split("=")[1];
  const settings = parseEnhanceSettings({
    ...DEFAULT_ENHANCE_SETTINGS,
    noiseReduction: opt("noise") ?? DEFAULT_ENHANCE_SETTINGS.noiseReduction,
    humReduction: opt("hum") ?? DEFAULT_ENHANCE_SETTINGS.humReduction,
    dynamicRange: opt("dynamics") ?? DEFAULT_ENHANCE_SETTINGS.dynamicRange,
    trimSilence: !flags.includes("--no-trim"),
    normalize: !flags.includes("--no-normalize"),
    hissReduction: !flags.includes("--no-hiss"),
    vocalClarity: !flags.includes("--no-clarity"),
  });
  console.log("Settings:", settings);
  const asset = await enhanceOriginal(id, settings);
  console.log(asset.status === "READY" ? `✔ Enhanced asset ${asset.id} (${asset.fileName})` : `✖ Failed:\n${asset.error}`);
}

main()
  .catch((e) => {
    console.error(`✖ ${(e as Error).message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
