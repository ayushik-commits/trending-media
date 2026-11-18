import assert from "node:assert/strict";
import test from "node:test";
import { chapters, chooseDestination } from "../src/lib/chapters.ts";

const n = chapters.length;
const path = (i: number) => `/${chapters[i].slug}`;

test("with no history every chapter is reachable", () => {
  const seen = new Set(Array.from({ length: n }, (_, i) => chooseDestination([], () => i / n)));
  assert.equal(seen.size, n);
});

test("a full round visits every chapter exactly once, whatever the random draws", () => {
  for (const draw of [0, 0.5, 0.999999]) {
    const history: string[] = [];
    for (let i = 0; i < n * 3; i++) {
      history.push(chooseDestination(history, () => draw).slice(1));
      if ((i + 1) % n === 0) assert.equal(new Set(history.slice(-n)).size, n);
    }
  }
});

test("a new round never opens with the chapter just seen", () => {
  const history = chapters.map((c) => c.slug);
  for (let i = 0; i < n - 1; i++) assert.notEqual(chooseDestination(history, () => i / (n - 1)), path(n - 1));
});

test("tolerates a malformed or stale history", () => {
  assert.ok(chooseDestination(["gone", "also-gone"], () => 0).startsWith("/"));
});
