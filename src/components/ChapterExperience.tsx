"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Chapter } from "@/lib/chapters";
import { LayerView, type Layer, type Slots } from "./ProductPage";
import { ScaledCanvas } from "./ScaledCanvas";

type Phase = "intro" | "ready" | "playing" | "complete";

/** The video file of a captured video layer (the named frame holds the video as a descendant). */
const videoSource = (layer: Layer): string | undefined => layer.video?.src ?? layer.children?.map(videoSource).find(Boolean);

/** A chapter film page. `layers` is the page as captured from Framer; the three named layers below are driven here. */
export function ChapterExperience({ chapter, layers, next }: { chapter: Chapter; layers: Layer[]; next: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [error, setError] = useState(false);
  const [introBlocked, setIntroBlocked] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const intro = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    intro.current?.play().catch(() => setIntroBlocked(true));
    router.prefetch(next);
  }, [router, next]);

  function start() {
    const element = video.current;
    if (!element) return;
    element.currentTime = 0;
    setPhase("playing");
    element.play().catch(() => { setPhase("ready"); setError(true); });
  }

  const slots: Slots = {
    // The film: starts on click and hands over to the chapter's alert page when it ends, keeping its last frame on screen.
    "scroll video": (_, layer) => <video ref={video} src={videoSource(layer)} muted playsInline preload="auto" onEnded={() => { setPhase("complete"); router.push(next); }} onError={() => setError(true)} className="h-full w-full object-cover" aria-label={`${chapter.title} film`} />,
    // The loading clip in the side panel: plays on arrival, then the page is ready.
    "load video": (_, layer) => <video ref={intro} src={videoSource(layer)} muted autoPlay playsInline onEnded={() => setPhase("ready")} onError={() => setPhase("ready")} className="h-full w-full object-cover" aria-label="Chapter introduction" />,
    // "Click anywhere to start" is only shown while the page waits for that click.
    "click text": content => (phase === "ready" ? content : null),
  };

  return (
    <main className="flex min-h-dvh items-center bg-trend-yellow" data-phase={phase}>
      <h1 className="sr-only">{chapter.title}</h1>
      <ScaledCanvas height={1080}>
        <div className="relative h-[1080px] w-[1920px]">
          {layers.map((layer, index) => <LayerView key={index} layer={layer} slots={slots} />)}
          {phase === "ready" && <button type="button" onClick={start} aria-label={`Start ${chapter.title}`} className="absolute inset-0 z-10 h-full w-full bg-transparent focus-visible:outline-8 focus-visible:-outline-offset-8 focus-visible:outline-trend-blue" />}
          {introBlocked && phase === "intro" && <button type="button" onClick={() => { intro.current?.play().then(() => setIntroBlocked(false)).catch(() => setPhase("ready")); }} className="absolute bottom-8 left-8 z-10 rounded-full bg-trend-blue px-8 py-4 text-2xl font-bold text-white">Play introduction</button>}
          {error && <p role="alert" className="absolute bottom-8 left-8 z-10 max-w-xl rounded-xl bg-white p-6 text-xl text-trend-blue">The video could not play. Please reload this page and try again.</p>}
        </div>
      </ScaledCanvas>
    </main>
  );
}
