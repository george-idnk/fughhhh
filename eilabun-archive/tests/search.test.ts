import assert from "node:assert/strict";
import { test } from "node:test";
import { isEilabunToken, normalize, parseQuery, prepareField, scoreDocument } from "../src/lib/search";

const doc = (fields: [string, number][]) => fields.map(([t, w]) => ({ text: prepareField(t), weight: w }));

test("normalizes Arabic hamza/taa marbuta/diacritics", () => {
  assert.equal(normalize("إِيلَبُون"), "ايلبون");
  assert.equal(normalize("صلاة"), "صلاه");
  assert.equal(normalize("Éilabún"), "eilabun");
});

test("recognizes all spellings of Eilabun", () => {
  for (const s of ["عيلبون", "إيلبون", "إيلابن", "عيلابون", "Eilabun", "Eilaboun", "Ilabun", "Ailabun", "עילבון", "بعيلبون", "Eilaboon"]) {
    assert.ok(isEilabunToken(normalize(s)), s);
  }
  assert.ok(!isEilabunToken("lebanon"));
  assert.ok(!isEilabunToken("قداس"));
});

test("'قداس عيلبون' matches a liturgy titled in English with another spelling", () => {
  const d = doc([["Divine Liturgy in Eilaboun", 10]]);
  const r = scoreDocument(d, parseQuery("قداس عيلبون"));
  assert.equal(r.matched, 2);
});

test("'Eilabun mass' matches Arabic title", () => {
  const d = doc([["القداس الإلهي في كنيسة عيلبون", 10]]);
  assert.equal(scoreDocument(d, parseQuery("Eilabun mass")).matched, 2);
});

test("phrase synonyms: مار جرجس ↔ Saint George", () => {
  assert.equal(scoreDocument(doc([["Feast of Saint George", 6]]), parseQuery("مار جرجس")).matched, 1);
  assert.equal(scoreDocument(doc([["عيد الخضر", 6]]), parseQuery("St George")).matched, 1);
});

test("feast names: عيد القيامة ↔ Easter, قداس عيد الميلاد ↔ Christmas liturgy", () => {
  assert.equal(scoreDocument(doc([["Easter celebration", 10]]), parseQuery("عيد القيامة")).matched, 1);
  const q = parseQuery("قداس عيد الميلاد");
  assert.equal(scoreDocument(doc([["Christmas Divine Liturgy", 10]]), q).matched, q.length);
});

test("does not match unrelated documents", () => {
  const r = scoreDocument(doc([["Palm Sunday procession", 10]]), parseQuery("Christmas"));
  assert.equal(r.matched, 0);
});

test("Latin words use prefix matching (old ≠ golden)", () => {
  assert.equal(scoreDocument(doc([["golden jubilee", 10]]), parseQuery("old")).matched, 0);
  assert.equal(scoreDocument(doc([["hymns of the choir", 10]]), parseQuery("hymn")).matched, 1);
});

test("tolerates small typos", () => {
  assert.equal(scoreDocument(doc([["Byzantine liturgy", 10]]), parseQuery("liturgi")).matched, 1);
});
