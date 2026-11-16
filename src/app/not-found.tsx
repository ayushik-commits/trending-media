import Link from "next/link";
export default function NotFound() {
  return <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-trend-yellow px-6 text-center text-trend-blue">
    <h1 className="text-5xl font-black">Page not found</h1>
    <p>This page doesn’t exist or has moved.</p>
    <Link className="rounded-full bg-trend-blue px-8 py-4 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4" href="/">Back to home</Link>
  </main>;
}
