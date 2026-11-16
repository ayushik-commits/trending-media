import assert from "node:assert/strict";
import test from "node:test";
import { chapters, chooseDestination } from "../src/lib/chapters.ts";

test("the five existing routes each own exactly one fifth of the random range", () => {
  assert.equal(chapters.length, 5);
  for (let i = 0; i < chapters.length; i++) {
    assert.equal(chooseDestination(() => i / 5), `/${chapters[i].slug}`);
    assert.equal(chooseDestination(() => (i + 1) / 5 - Number.EPSILON), `/${chapters[i].slug}`);
  }
});

test("choices are independent and may repeat", () => {
  assert.equal(chooseDestination(() => 0.5), "/glowup-tips");
  assert.equal(chooseDestination(() => 0.5), "/glowup-tips");
});
