import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFilterChain, DEFAULT_ENHANCE_SETTINGS, parseEnhanceSettings } from "../src/lib/audio";

test("filter chain includes every requested stage", () => {
  const chain = buildFilterChain(DEFAULT_ENHANCE_SETTINGS);
  for (const part of ["highpass", "equalizer=f=50", "afftdn", "lowpass", "acompressor", "silenceremove", "loudnorm"]) {
    assert.ok(chain.includes(part), part);
  }
});

test("disabled stages are omitted and invalid settings fall back to defaults", () => {
  const s = parseEnhanceSettings({ noiseReduction: "off", humReduction: "bogus", normalize: false, trimSilence: false });
  assert.equal(s.humReduction, "50");
  const chain = buildFilterChain(s);
  assert.ok(!chain.includes("afftdn"));
  assert.ok(!chain.includes("loudnorm"));
  assert.ok(!chain.includes("silenceremove"));
});
