import chapterData from "./chapter-pages.json";
import data from "./product-pages.json";
import type { ProductPageData } from "@/components/ProductPage";

/** Every exported Framer product page, keyed by its site path (for example "/personal-brand/alert"). */
export const productPages = data as unknown as Record<string, ProductPageData>;

/** The five chapter film pages, keyed by chapter slug, captured in their "ready" state. */
export const chapterPages = chapterData as unknown as Record<string, Pick<ProductPageData, "height" | "background" | "layers">>;

/** The page a chapter film hands over to when it ends. */
export const alertPath = (chapter: string) => `/${chapter}/alert`;

/** Image files a page needs, so the page before it can warm them up. */
export function pageImages(path: string): string[] {
  const found = new Set<string>();
  const visit = (layer: ProductPageData["layers"][number]) => {
    if (layer.svg) found.add(layer.svg);
    if (layer.img) found.add(layer.img.src);
    layer.children?.forEach(visit);
  };
  productPages[path]?.layers.forEach(visit);
  return [...found];
}
