import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-svh flex-col items-start justify-center gap-8 px-6 sm:px-12" data-formation="dust">
      <h1 className="font-pixel-circle text-[clamp(120px,28vw,360px)] leading-[0.8] tracking-tight text-fg">404</h1>
      <p className="max-w-md text-lg text-fg-dim">This page doesn’t exist.</p>
      <Link href="/" className="rounded-full border border-hair-strong px-5 py-3 text-[14px] text-fg transition-colors hover:border-signal hover:text-signal">
        ← Back to home
      </Link>
    </section>
  );
}
