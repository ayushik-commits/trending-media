import { notFound } from "next/navigation";
import { ProductPage } from "@/components/ProductPage";
import { productPages } from "@/lib/product-pages";

type Params = { params: Promise<{ chapter: string; step: string }> };
const find = async ({ params }: Params) => { const { chapter, step } = await params; return productPages[`/${chapter}/${step}`]; };

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(productPages).map(path => path.split("/").slice(1)).filter(parts => parts.length === 2).map(([chapter, step]) => ({ chapter, step }));
}
export async function generateMetadata(props: Params) { return { title: (await find(props))?.title ?? "Page not found" }; }
export default async function ProductStepPage(props: Params) {
  const page = await find(props);
  if (!page) notFound();
  return <ProductPage page={page} />;
}
