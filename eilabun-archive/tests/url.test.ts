import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalizeUrl, detectSource, parseYouTubeId, resolveEmbed } from "../src/lib/url";
import { parseDurationInput, parseIsoDuration, splitTags } from "../src/lib/format";

test("parses YouTube ids from every URL form", () => {
  const id = "dQw4w9WgXcQ";
  for (const u of [
    `https://www.youtube.com/watch?v=${id}&t=10s`,
    `https://youtu.be/${id}?si=abc`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
    id,
  ]) {
    assert.equal(parseYouTubeId(u), id, u);
  }
  assert.equal(parseYouTubeId("https://example.com/watch?v=dQw4w9WgXcQ"), null);
});

test("canonical URLs collapse duplicates", () => {
  assert.equal(canonicalizeUrl("https://youtu.be/dQw4w9WgXcQ?si=x"), canonicalizeUrl("http://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share"));
  assert.equal(
    canonicalizeUrl("http://www.Example.org/page/?utm_source=fb&b=2&a=1#top"),
    canonicalizeUrl("https://example.org/page?a=1&b=2"),
  );
  assert.equal(canonicalizeUrl("https://m.facebook.com/x/videos/1?fbclid=1"), "https://facebook.com/x/videos/1");
});

test("source detection", () => {
  assert.equal(detectSource("https://youtu.be/dQw4w9WgXcQ"), "YOUTUBE");
  assert.equal(detectSource("https://www.facebook.com/page/videos/1"), "FACEBOOK");
  assert.equal(detectSource("https://archive.org/details/foo"), "INTERNET_ARCHIVE");
});

test("embeds only official players, respecting embeddable flag", () => {
  assert.equal(resolveEmbed({ sourceUrl: "https://youtu.be/dQw4w9WgXcQ", embeddable: true }).kind, "youtube");
  assert.equal(resolveEmbed({ sourceUrl: "https://youtu.be/dQw4w9WgXcQ", embeddable: false }).kind, "none");
  assert.equal(resolveEmbed({ sourceUrl: "https://archive.org/details/abc", embeddable: true }).kind, "archive");
  assert.equal(resolveEmbed({ sourceUrl: "https://facebook.com/v/1", embeddable: true }).kind, "none");
});

test("durations and tags", () => {
  assert.equal(parseIsoDuration("PT1H2M3S"), 3723);
  assert.equal(parseDurationInput("1:02:03"), 3723);
  assert.equal(parseDurationInput("62:03"), 3723);
  assert.deepEqual(splitTags("قداس، Easter, easter,#عيد"), ["قداس", "Easter", "عيد"]);
});
