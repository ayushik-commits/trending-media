"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playWhenReady } from "@/lib/arrival";
import { chooseDestination } from "@/lib/chapters";
import { ScaledCanvas } from "./ScaledCanvas";
import { HeroArtwork, DiscoveryArtwork, CookieArtwork } from "./artwork/HomeArtwork";

export function HomeExperience() {
  const router = useRouter();
  const navigating = useRef(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [cookiesVisible, setCookiesVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const intro = useRef<HTMLVideoElement>(null);

  // The arrival video plays once it can run smoothly; otherwise the collage is shown straight away.
  useEffect(() => {
    if (intro.current) return playWhenReady(intro.current, () => setIntroFinished(true));
  }, []);

  // As in the Framer original, the page cannot be scrolled until the arrival video has finished or been skipped.
  useEffect(() => {
    if (introFinished) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => { root.style.overflow = ""; };
  }, [introFinished]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const checkBottom = () => {
      const height = document.documentElement.scrollHeight;
      const atBottom = height <= window.innerHeight + 5 || (window.scrollY > 0 && window.scrollY + window.innerHeight >= height - 5);
      if (atBottom && !timer) timer = setTimeout(() => setCookiesVisible(true), 1000);
      if (!atBottom && timer) { clearTimeout(timer); timer = undefined; }
    };
    window.addEventListener("scroll", checkBottom, { passive: true });
    window.addEventListener("resize", checkBottom);
    const observer = new ResizeObserver(checkBottom);
    observer.observe(document.body);
    checkBottom();
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", checkBottom);
      window.removeEventListener("resize", checkBottom);
    };
  }, []);

  function acceptCookies() {
    if (navigating.current) return;
    navigating.current = true;
    router.push(chooseDestination());
  }

  return (
    <main className="overflow-x-clip bg-trend-yellow">
      <h1 className="sr-only">Are you the trendiest version of yourself?</h1>
      <ScaledCanvas height={2250}>
        <section className="relative h-[1080px] w-[1920px]" aria-label="The trendiest version of yourself">
          <HeroArtwork />
          {/* z-[2] as in Framer: the collage (HeroArtwork) is z-index 1, so without it the video plays hidden underneath. */}
          {!introFinished && <video ref={intro} src="/assets/videos/Dwt4hHpeuqmRWJWH6g0xf1uN0s.mp4" autoPlay muted playsInline onEnded={() => setIntroFinished(true)} onError={() => setIntroFinished(true)} className="absolute inset-0 z-[2] h-full w-full bg-white object-contain" aria-label="Introduction" />}
        </section>
        <section aria-label="Find out what's missing today">
          <DiscoveryArtwork cookiePanel={
            <div aria-hidden={!cookiesVisible || dismissed} inert={!cookiesVisible || dismissed} className={`absolute inset-0 transition duration-600 ease-out motion-reduce:transition-none ${cookiesVisible && !dismissed ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[270px] opacity-0"}`}>
              <CookieArtwork onAccept={acceptCookies} onReject={() => setDismissed(true)} />
            </div>
          } />
        </section>
      </ScaledCanvas>
    </main>
  );
}
