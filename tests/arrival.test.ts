import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MAX_WAIT_MS, playWhenReady } from "../src/lib/arrival.ts";

/** A stand-in 4-second video that receives `rate` seconds of footage per second. */
function fakeVideo(rate: number, { refusePlay = false, networkState = 2 } = {}) {
  const began = Date.now();
  const state = { played: 0, paused: 0 };
  const listeners: Record<string, () => void> = {};
  const video = {
    duration: 4, currentTime: 0, error: null, networkState,
    get buffered() { const end = Math.min(4, ((Date.now() - began) / 1000) * rate); return { length: end > 0 ? 1 : 0, end: () => end }; },
    play() { state.played++; if (!refusePlay) listeners.playing?.(); return refusePlay ? Promise.reject(new Error("NotAllowedError")) : Promise.resolve(); },
    pause() { state.paused++; },
    addEventListener(type: string, listener: () => void) { listeners[type] = listener; }, removeEventListener() {},
  };
  return { video: video as unknown as HTMLVideoElement, state };
}
/** Mocks the clock and returns a function that advances it in small steps, as real time would. */
function clock(t: test.TestContext) {
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout", "Date"] });
  return (ms: number) => { for (let passed = 0; passed < ms; passed += 50) t.mock.timers.tick(50); };
}

test("the arrival video is held until it is fully loaded, then played", t => {
  const advance = clock(t);
  let skipped = 0;
  const { video, state } = fakeVideo(2); // fully loaded after 2 seconds
  playWhenReady(video, () => skipped++);
  advance(1800); assert.equal(state.played, 0); assert.equal(state.paused, 1);
  advance(300); assert.equal(state.played, 1);
  advance(4000 + MAX_WAIT_MS - 500); assert.equal(skipped, 0, "normal playback is not interrupted");
});

test("a connection that cannot load it in time skips the video exactly once", t => {
  const advance = clock(t);
  let skipped = 0;
  const { video, state } = fakeVideo(0.3);
  playWhenReady(video, () => skipped++);
  advance(MAX_WAIT_MS - 100); assert.equal(skipped, 0);
  advance(20000); assert.equal(skipped, 1); assert.equal(state.played, 0);
});

test("a video that starts but never finishes is skipped", t => {
  const advance = clock(t);
  let skipped = 0;
  const { video } = fakeVideo(100); // loaded at once; the stand-in never fires "ended"
  playWhenReady(video, () => skipped++);
  advance(4000 + MAX_WAIT_MS + 200); assert.equal(skipped, 1);
});

test("a browser that will not preload while paused is allowed to play straight away", t => {
  const advance = clock(t);
  const { video, state } = fakeVideo(0.1, { networkState: 1 });
  playWhenReady(video, () => assert.fail("should not skip yet"));
  assert.equal(state.played, 1); assert.equal(state.paused, 0);
});

test("a browser that refuses to play skips the video", async t => {
  const advance = clock(t);
  let skipped = 0;
  const { video } = fakeVideo(100, { refusePlay: true });
  playWhenReady(video, () => skipped++);
  advance(200);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(skipped, 1);
});

test("the arrival video is stacked above the collage, as in Framer", () => {
  const read = (file: string) => readFileSync(new URL(`../src/components/${file}`, import.meta.url), "utf8");
  const collage = read("artwork/HomeArtwork.tsx").match(/className=\{"([^"]*)"\} data-artwork="artwork"/)?.[1] ?? "";
  const video = read("HomeExperience.tsx").match(/className="([^"]*)" aria-label="Introduction"/)?.[1] ?? "";
  const collageZ = Number(collage.match(/\[z-index:(\d+)\]/)?.[1] ?? 0);
  const videoZ = Number(video.match(/\bz-\[?(\d+)\]?/)?.[1] ?? 0);
  assert.ok(collage && video, "could not find the collage or the arrival video in the source");
  assert.ok(videoZ > collageZ, `the arrival video (z-index ${videoZ}) would play hidden under the collage (z-index ${collageZ})`);
});
