import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Trending Media", template: "%s | Trending Media" },
  description: "Are you the trendiest version of yourself? Explore personal branding, consumer culture, glowups, lifestyle and niche credibility.",
  icons: { icon: "/assets/icons/default-favicon-light.v1.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="font-sans antialiased">{children}</body></html>;
}
