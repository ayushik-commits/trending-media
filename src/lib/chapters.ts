export const chapters = [
  { slug: "personal-brand", title: "Personal Brand" },
  { slug: "consumer-culture", title: "Consumer Culture" },
  { slug: "glowup-tips", title: "Glowup Tips" },
  { slug: "life-style", title: "Life Style" },
  { slug: "niche-credibility", title: "Niche Credibility" },
] as const;

export function chooseDestination(random: () => number = Math.random): string {
  return `/${chapters[Math.floor(random() * chapters.length)].slug}`;
}
export type Chapter = (typeof chapters)[number];
