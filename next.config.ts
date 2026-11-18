import type { NextConfig } from "next";

// Framer's slugs, one row per chapter: [old chapter slug, new chapter slug, before page, product page, step prefix].
// The old URLs redirect to the new ones.
const moved = [
  ["personal-brand", "personal-brand", "before-personal-brand", "personal-brand", "pb"],
  ["consumer-culture", "status-and-consumer", "before-status-consumer", "status-consumer", "sc"],
  ["life-style", "lifestyle-optimisation", "before-lifestyle-optimisation", "lifestyle-optimisation", "lo"],
  ["glowup-tips", "glowup-potential", "before-golwup-potential", "glow-up-potential", "gp"],
  ["niche-credibility", "niche-credibility", "before-niche-credibility", "niche-credibility", "nc"],
] as const;

const config: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  async redirects() {
    return moved.flatMap(([from, to, before, product, step]) => [
      ...(from === to ? [] : [{ source: `/${from}`, destination: `/${to}`, permanent: true }]),
      { source: `/${from}/alert`, destination: `/${to}/${before}`, permanent: true },
      { source: `/${from}/product`, destination: `/${to}/${product}`, permanent: true },
      { source: `/${from}/address`, destination: `/${to}/${step}-2`, permanent: true },
      { source: `/${from}/pay`, destination: `/${to}/${step}-3`, permanent: true },
    ]);
  },
};
export default config;
