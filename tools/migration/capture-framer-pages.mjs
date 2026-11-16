// Captures the published Framer pages into local layer data.
//
//   node tools/migration/capture-framer-pages.mjs            everything
//   node tools/migration/capture-framer-pages.mjs products   only the product pages (1200px artboard)
//   node tools/migration/capture-framer-pages.mjs chapters   only the chapter film pages (1920px artboard)
//
// For every route it renders the published page in headless Chrome at its
// design width, records each layer's geometry, and downloads the SVG, image
// and video payloads. Animation settings that are not present in the
// DOM (appear / tap effects) come from tools/migration/product-effects.json,
// which was read from the Framer project tree through the Framer MCP.
//
// Output: src/lib/product-pages.json, src/lib/chapter-pages.json and public/assets/product/*
// No dependencies: needs Google Chrome and Node >= 22 (built-in WebSocket).
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ORIGIN = "https://cherished-kiwi-803995.framer.app";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ASSETS = join(ROOT, "public/assets/product");
const WIDTH = 1200;
const only = process.argv[2]; // "products", "chapters" or nothing for both
const SVG_PAD = 4; // room for strokes that overflow a vector's viewBox

const { routes, effectSets, chapters } = JSON.parse(readFileSync(join(ROOT, "tools/migration/product-effects.json"), "utf8"));

// ---- Chrome DevTools Protocol --------------------------------------------
async function launch() {
  const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${mkdtempSync(join(tmpdir(), "capture-"))}`,
    `--window-size=${WIDTH},672`, "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const port = await new Promise((resolve, reject) => {
    let log = "";
    chrome.stderr.on("data", chunk => { log += chunk; const match = log.match(/ws:\/\/127\.0\.0\.1:(\d+)/); if (match) resolve(match[1]); });
    chrome.on("exit", () => reject(new Error(`Chrome exited before it was ready:\n${log}`)));
  });
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener("open", resolve));
  let id = 0;
  const pending = new Map();
  const waiters = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const call = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) call.reject(new Error(JSON.stringify(message.error))); else call.resolve(message.result);
    } else if (waiters.has(message.method)) { waiters.get(message.method)(); waiters.delete(message.method); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: 672, deviceScaleFactor: 1, mobile: false });
  return {
    send,
    async goto(url) { const loaded = new Promise(resolve => waiters.set("Page.loadEventFired", resolve)); await send("Page.navigate", { url }); await loaded; },
    async evaluate(expression) {
      const { result, exceptionDetails } = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
      return result.value;
    },
    close() { socket.close(); chrome.kill(); },
  };
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ---- Runs inside the page --------------------------------------------------
function walkPage() {
  const round = value => Math.round(value * 100) / 100;
  const root = document.querySelector("[data-framer-root]");
  const hoverTargets = [];
  function svgOf(element, style) {
    const use = element.querySelector("use");
    if (use) {
      const template = document.getElementById(use.getAttribute("href").slice(1));
      const svg = element.querySelector("svg");
      return { markup: template.outerHTML, visible: /overflow:\s*visible/.test(svg.getAttribute("style") ?? "") };
    }
    const data = style.backgroundImage.match(/^url\("data:image\/svg\+xml(;base64)?,(.*)"\)$/s);
    if (!data) throw new Error(`Unreadable vector layer: ${element.className}`);
    return { markup: data[1] ? atob(data[2]) : decodeURIComponent(data[2].replace(/\\"/g, '"')) };
  }
  function walk(element, parent) {
    if (["STYLE", "SCRIPT"].includes(element.tagName) || element.id === "overlay") return null;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return null;
    const rect = element.getBoundingClientRect();
    const node = { x: round(rect.x - parent.x), y: round(rect.y - parent.y), w: round(rect.width), h: round(rect.height) };
    if (element.dataset.framerName) node.name = element.dataset.framerName;
    if (element.tagName === "A") {
      const url = new URL(element.href);
      node.href = url.origin === location.origin ? url.pathname : url.href;
      if (element.target === "_blank") node.newTab = true;
    }
    if (style.overflowX !== "visible") node.clip = true;
    if (style.opacity !== "1") node.opacity = Number(style.opacity);
    if (!/^rgba\(.*, 0\)$|^transparent$/.test(style.backgroundColor)) node.bg = style.backgroundColor;
    if (style.borderTopLeftRadius !== "0px") node.radius = style.borderRadius;
    if (style.zIndex !== "auto") node.z = Number(style.zIndex);
    if (element.dataset.framerComponentType === "SVG") return { ...node, svg: svgOf(element, style) };
    if (element.tagName === "VIDEO") return { ...node, video: { src: element.currentSrc || element.src, loop: element.loop, fit: style.objectFit } };
    if (element.tagName === "IMG") {
      const candidates = (element.getAttribute("srcset") ?? "").split(",").map(entry => entry.trim().split(/\s+/)).filter(entry => entry[1]).map(([src, width]) => ({ src, width: parseInt(width, 10) }));
      node.img = { src: element.getAttribute("src"), candidates, fit: style.objectFit, pos: style.objectPosition };
      if (element.closest("[data-framer-name^='Variant']")) hoverTargets.push({ element, node });
      return node;
    }
    if (element.dataset.framerComponentType === "RichTextContainer") {
      const text = element.querySelector("p, h1, h2, h3, h4, h5, h6, a") ?? element;
      const leaf = text.querySelector("a") ?? text;
      const type = getComputedStyle(leaf);
      const link = element.querySelector("a");
      node.text = { value: element.innerText, color: type.color, size: parseFloat(type.fontSize), family: type.fontFamily, weight: Number(type.fontWeight), lineHeight: type.lineHeight, align: type.textAlign };
      if (link) { node.href = link.href; node.newTab = link.target === "_blank"; }
      return node;
    }
    const children = [...element.children].map(child => walk(child, rect)).filter(Boolean);
    if (children.length) node.children = children;
    return node;
  }
  const rect = root.getBoundingClientRect();
  window.__capture = { height: Math.round(Math.max(rect.height, document.documentElement.scrollHeight)), background: getComputedStyle(document.body).backgroundColor, layers: [...root.children].map(child => walk(child, rect)).filter(Boolean), hoverTargets };
  return hoverTargets.map(({ element }) => { const box = element.getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; });
}

// ---- Post-processing -------------------------------------------------------
mkdirSync(ASSETS, { recursive: true });
const downloads = new Map();
function remote(url) {
  const { pathname } = new URL(url);
  // The chapter films already live in public/assets/videos; reuse them instead of a second copy.
  if (existsSync(join(ROOT, "public/assets/videos", pathname.split("/").pop()))) return `/assets/videos/${pathname.split("/").pop()}`;
  const scale = new URL(url).searchParams.get("scale-down-to");
  const base = pathname.split("/").pop();
  const name = scale ? base.replace(/(\.\w+)$/, `-${scale}$1`) : base;
  downloads.set(name, url);
  return `/assets/product/${name}`;
}
function saveSvg({ markup, visible }, node) {
  let svg = markup.replace(/\sid="svg[^"]*"/, "");
  if (!svg.includes("xmlns=")) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  const box = svg.match(/viewBox="([^"]+)"/)?.[1].split(/[\s,]+/).map(Number);
  if (visible && box) {
    // The original paints strokes outside the viewBox; grow the box and the layer together so <img> shows them too.
    const [minX, minY, width, height] = box;
    const padX = (SVG_PAD * node.w) / width, padY = (SVG_PAD * node.h) / height;
    svg = svg.replace(/viewBox="[^"]+"/, `viewBox="${minX - SVG_PAD} ${minY - SVG_PAD} ${width + 2 * SVG_PAD} ${height + 2 * SVG_PAD}"`);
    Object.assign(node, { x: +(node.x - padX).toFixed(2), y: +(node.y - padY).toFixed(2), w: +(node.w + 2 * padX).toFixed(2), h: +(node.h + 2 * padY).toFixed(2) });
  }
  if (!/preserveAspectRatio=/.test(svg.slice(0, svg.indexOf(">")))) svg = svg.replace("<svg", '<svg preserveAspectRatio="none"');
  const name = `${createHash("sha1").update(svg).digest("hex").slice(0, 12)}.svg`;
  writeFileSync(join(ASSETS, name), svg);
  return `/assets/product/${name}`;
}
function pickImage({ src, candidates }, width) {
  // Smallest rendition that still covers a 2x display of the scaled artboard; SVG sources are used as-is.
  const fit = candidates.filter(candidate => candidate.width >= width * 2).sort((a, b) => a.width - b.width)[0];
  return remote(fit?.src ?? src);
}
const near = (a, b) => Math.abs(a - b) <= 3;
function finish(node, origin, pageEffects, route) {
  const abs = { x: origin.x + node.x, y: origin.y + node.y };
  const effect = pageEffects.find(item => !item.used && near(item.rect[0], abs.x) && near(item.rect[1], abs.y) && near(item.rect[2], node.w) && near(item.rect[3], node.h));
  if (effect) { effect.used = true; if (effect.appear) node.appear = effect.appear; if (effect.tap) node.tap = effect.tap; if (effect.hover) node.hover = effect.hover; }
  if (node.href?.startsWith("/")) {
    const href = node.href.replace(/\/$/, "");
    const target = routes.find(item => item.framer === (route.links?.[href] ?? href));
    if (!target) throw new Error(`${route.framer}: link to unknown page ${node.href}`);
    node.href = target.local;
  }
  if (node.svg) node.svg = saveSvg(node.svg, node);
  if (node.video) node.video.src = remote(node.video.src);
  if (node.img) {
    const { fit, pos, hover } = node.img;
    node.img = { src: pickImage(node.img, node.w), fit, pos, ...(hover && { hover: pickImage({ src: hover, candidates: [] }, node.w) }) };
  }
  node.children = node.children?.map(child => finish(child, abs, pageEffects, route));
  // A wrapper that adds nothing of its own is replaced by its only child.
  const plain = Object.keys(node).every(key => ["x", "y", "w", "h", "children"].includes(key));
  if (plain && node.children?.length === 1) { const [child] = node.children; return { ...child, x: +(node.x + child.x).toFixed(2), y: +(node.y + child.y).toFixed(2) }; }
  if (!node.children?.length) delete node.children;
  return node;
}

// The Framer source sometimes holds an identical copy of a layer on top of the original; keep one.
function withoutCopies(layers) {
  const seen = new Set();
  return layers
    .filter(layer => { const key = JSON.stringify(layer); return !seen.has(key) && seen.add(key); })
    .map(layer => (layer.children ? { ...layer, children: withoutCopies(layer.children) } : layer));
}

// ---- Main ------------------------------------------------------------------
const browser = await launch();
const pages = {};
const chapterPages = {};
try {
  for (const route of only === "chapters" ? [] : routes) {
    await browser.goto(ORIGIN + route.framer);
    await sleep(route.settle ?? 6500); // let the load-in animations reach their resting state
    const hovers = await browser.evaluate(`(${walkPage})()`);
    for (const [index, point] of hovers.entries()) {
      await browser.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
      await sleep(900);
      await browser.evaluate(`(() => { const target = window.__capture.hoverTargets[${index}]; const now = target.element.isConnected ? target.element : document.querySelector("[data-framer-name^='Variant'] img"); if (now.getAttribute("src") !== target.node.img.src) target.node.img.hover = now.getAttribute("src"); })()`);
      await browser.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
    }
    const page = await browser.evaluate(`(() => { const { hoverTargets, ...page } = window.__capture; return page; })()`);
    const pageEffects = effectSets[route.effects].map(item => ({ ...item }));
    const layers = page.layers.map(layer => finish(layer, { x: 0, y: 0 }, pageEffects, route));
    const missed = pageEffects.filter(item => !item.used);
    if (missed.length) throw new Error(`${route.framer}: ${missed.length} effect(s) matched no layer: ${JSON.stringify(missed.map(item => item.rect))}`);
    pages[route.local] = { title: route.title, height: page.height, background: page.background, layers };
    console.log(`${route.framer} -> ${route.local}  (${page.height}px, ${JSON.stringify(layers).length} bytes)`);
  }
  // Chapter film pages: captured in their "ready" state, once the loading clip has finished.
  if (only !== "products") {
    await browser.send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    for (const chapter of chapters.pages) {
      await browser.goto(chapters.source + chapter.framer);
      await sleep(chapters.settle);
      await browser.evaluate(`(${walkPage})()`);
      const page = await browser.evaluate(`(() => { const { hoverTargets, ...page } = window.__capture; return page; })()`);
      const layers = withoutCopies(page.layers.map(layer => finish(layer, { x: 0, y: 0 }, [], chapter)));
      const names = JSON.stringify(layers);
      for (const required of ["scroll video", "load video", "click text"]) if (!names.includes(`"name":"${required}"`)) throw new Error(`${chapter.framer}: layer "${required}" was not found`);
      chapterPages[chapter.slug] = { height: 1080, background: page.background, layers };
      console.log(`${chapter.framer} -> chapter ${chapter.slug}  (${names.length} bytes)`);
    }
  }
} finally { browser.close(); }

for (const [name, url] of downloads) {
  const file = join(ASSETS, name);
  if (existsSync(file)) continue;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  console.log(`downloaded ${name}${extname(name) ? "" : " (no extension)"}`);
}
if (only !== "chapters") writeFileSync(join(ROOT, "src/lib/product-pages.json"), JSON.stringify(pages));
if (only !== "products") writeFileSync(join(ROOT, "src/lib/chapter-pages.json"), JSON.stringify(chapterPages));
console.log(`Captured ${Object.keys(pages).length} product pages and ${Object.keys(chapterPages).length} chapter pages, ${downloads.size} remote assets.`);
