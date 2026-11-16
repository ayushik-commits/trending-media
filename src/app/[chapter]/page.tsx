import { notFound } from "next/navigation";
import { chapters } from "@/lib/chapters";
import { alertPath, chapterPages, pageImages } from "@/lib/product-pages";
import { ChapterExperience } from "@/components/ChapterExperience";
export const dynamicParams = false;
export function generateStaticParams() { return chapters.map(({ slug }) => ({ chapter: slug })); }
export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  return { title: chapters.find(item => item.slug === chapter)?.title ?? "Page not found" };
}
export default async function ChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: slug } = await params;
  const chapter = chapters.find(item => item.slug === slug);
  if (!chapter) notFound();
  const next = alertPath(chapter.slug);
  return <>
    {/* Warm up the alert page's artwork while the film plays, so the hand-over is seamless. */}
    {pageImages(next).map(src => <link key={src} rel="preload" as="image" href={src} />)}
    <ChapterExperience key={chapter.slug} chapter={chapter} layers={chapterPages[chapter.slug].layers} next={next} />
  </>;
}
