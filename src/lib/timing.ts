/** A Framer transition: duration and delay in seconds, with a spring bounce or a bezier ease. */
export type Motion = { d: number; dl?: number; b?: number; e?: number[] };

/** CSS "duration easing delay" for a Framer transition. Springs are sampled into linear(). */
export function timing({ d, dl = 0, b = 0, e }: Motion): string {
  if (e) return `${d}s cubic-bezier(${e.join(",")}) ${dl}s`;
  const damping = 1 - b, frequency = (2 * Math.PI) / d, total = d * 1.5; // settled to ~0.1% by then
  const damped = frequency * Math.sqrt(1 - damping * damping);
  const samples = Array.from({ length: 25 }, (_, index) => {
    const t = (index / 24) * total;
    const position = damping < 1
      ? 1 - Math.exp(-damping * frequency * t) * (Math.cos(damped * t) + ((damping * frequency) / damped) * Math.sin(damped * t))
      : 1 - Math.exp(-frequency * t) * (1 + frequency * t);
    return index === 24 ? 1 : Number(position.toFixed(3));
  });
  return `${total}s linear(${samples.join(",")}) ${dl}s`;
}
