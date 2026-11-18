export const chapters = [
  { slug: "personal-brand", title: "Personal Brand" },
  { slug: "status-and-consumer", title: "Consumer Culture" },
  { slug: "glowup-potential", title: "Glowup Tips" },
  { slug: "lifestyle-optimisation", title: "Life Style" },
  { slug: "niche-credibility", title: "Niche Credibility" },
] as const;

// Shuffle-bag: every chapter appears once per round of chapters.length picks, and a new round never opens with the chapter just seen.
// `history` is the slugs picked so far, oldest first. ponytail: grows by one slug per pick, trim if that ever matters.
export function chooseDestination(history: readonly string[] = [], random: () => number = Math.random): string {
  const round = history.slice(history.length - (history.length % chapters.length));
  const skip = new Set(round.length ? round : history.slice(-1));
  const pool = chapters.filter((c) => !skip.has(c.slug));
  return `/${pool[Math.floor(random() * pool.length)].slug}`;
}

export type Chapter = (typeof chapters)[number];
