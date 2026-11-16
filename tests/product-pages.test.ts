import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { chapters } from "../src/lib/chapters.ts";
import { timing } from "../src/lib/timing.ts";

type Layer = { name?: string; href?: string; svg?: string; img?: { src: string; hover?: string }; video?: { src: string }; children?: Layer[] };
type Pages = Record<string, { layers: Layer[] }>;
const read = (file: string): Pages => JSON.parse(readFileSync(new URL(`../src/lib/${file}`, import.meta.url), "utf8"));
const pages = read("product-pages.json"), chapterPages = read("chapter-pages.json");
const every = (layers: Layer[]): Layer[] => layers.flatMap(layer => [layer, ...every(layer.children ?? [])]);
const links = (layers: Layer[]): string[] => layers.flatMap(layer => [...(layer.href ? [layer.href] : []), ...links(layer.children ?? [])]);

test("every chapter continues alert → product → address → pay → final page", () => {
  for (const { slug } of chapters) {
    const steps = ["alert", "product", "address", "pay"].map(step => `/${slug}/${step}`);
    [...steps, "/final-page"].reduce((from, to) => {
      assert.ok(pages[from], `${from} is missing`);
      assert.ok(links(pages[from].layers).includes(to), `${from} does not link to ${to}`);
      return to;
    });
  }
  assert.ok(links(pages["/final-page"].layers).includes("/credits"));
});

test("no exported page links to a page that does not exist", () => {
  for (const [path, page] of Object.entries(pages))
    for (const href of links(page.layers).filter(href => href.startsWith("/")))
      assert.ok(pages[href], `${path} links to unknown ${href}`);
});

test("spring timing starts at rest, overshoots only when bouncy, and settles on the target", () => {
  const samples = (value: string) => value.match(/linear\((.*)\)/)![1].split(",").map(Number);
  const bouncy = samples(timing({ d: 2, b: 0.2 })), smooth = samples(timing({ d: 2, b: 0 }));
  assert.equal(bouncy[0], 0); assert.equal(bouncy.at(-1), 1);
  assert.ok(Math.max(...bouncy) > 1 && Math.max(...bouncy) < 1.03);
  assert.ok(Math.max(...smooth) <= 1);
  assert.equal(timing({ d: 1.5, dl: 0.3, e: [0.44, 0, 0.56, 1] }), "1.5s cubic-bezier(0.44,0,0.56,1) 0.3s");
});

test("every chapter film page has its film, loading clip and start prompt", () => {
  for (const { slug } of chapters) {
    assert.ok(chapterPages[slug], `${slug} was not captured`);
    for (const name of ["scroll video", "load video", "click text"])
      assert.equal(every(chapterPages[slug].layers).filter(layer => layer.name === name).length, 1, `${slug}: expected exactly one "${name}" layer`);
  }
});

test("every artwork, image and video a captured page uses exists in public/", () => {
  for (const [path, page] of [...Object.entries(pages), ...Object.entries(chapterPages)])
    for (const layer of every(page.layers))
      for (const file of [layer.svg, layer.img?.src, layer.img?.hover, layer.video?.src].filter(Boolean))
        assert.ok(existsSync(new URL(`../public${file}`, import.meta.url)), `${path} uses missing file ${file}`);
});
