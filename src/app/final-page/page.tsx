import { ProductPage } from "@/components/ProductPage";
import { productPages } from "@/lib/product-pages";

const page = productPages["/final-page"];
export const metadata = { title: page.title };
export default function Page() { return <ProductPage page={page} />; }
