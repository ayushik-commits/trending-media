"use client";
import { useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from "react";

/** A collage sticker that can be dragged anywhere and springs back to its place when released. */
export function DraggableSticker({ className, children, ...props }: { className: string; children: ReactNode; "data-artwork"?: string }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; scale: number } | null>(null);
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const width = event.currentTarget.offsetWidth;
    // The artboard is scaled to the window, so pointer distances are converted back to artboard pixels.
    const scale = width ? event.currentTarget.getBoundingClientRect().width / width : 1;
    drag.current = { x: event.clientX, y: event.clientY, scale };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function release() {
    drag.current = null;
    setDragging(false);
    setOffset({ x: 0, y: 0 });
  }
  // Position, hover reaction and the spring-back are styled by .collage-piece in globals.css.
  return <div {...props} className={`${className} collage-piece ${dragging ? "dragging" : ""} touch-none cursor-grab select-none active:cursor-grabbing`} style={{ "--drag-x": `${offset.x}px`, "--drag-y": `${offset.y}px` } as CSSProperties}
    onPointerDown={start}
    onPointerMove={event => { const d = drag.current; if (d) setOffset({ x: (event.clientX - d.x) / d.scale, y: (event.clientY - d.y) / d.scale }); }}
    onPointerUp={release} onPointerCancel={release} onDragStart={event => event.preventDefault()}>
    {children}
  </div>;
}
