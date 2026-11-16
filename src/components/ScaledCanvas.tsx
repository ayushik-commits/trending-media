"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Scales a fixed-size artboard (1920px wide unless told otherwise) to the available width. */
export function ScaledCanvas({ width = 1920, height, children }: { width?: number; height: number; children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  // Until it is measured, CSS does the scaling, so the page is the right size before any script runs.
  const [scale, setScale] = useState<number | null>(null);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = () => setScale(element.clientWidth / width);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div ref={container} className="relative w-full overflow-hidden [container-type:inline-size]" style={scale === null ? { aspectRatio: `${width} / ${height}` } : { height: height * scale }}>
      <div className="absolute left-0 top-0 origin-top-left scale-[var(--canvas-scale)]" style={{ "--canvas-scale": scale ?? `tan(atan2(100cqw, ${width}px))`, width } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}
