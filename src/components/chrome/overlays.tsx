import { ProgressiveBlur } from "@/components/ui/skiper-ui/skiper41";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Film grain, a vignette and Skiper's progressive blur at the screen edges. */
export function Overlays() {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
        <ProgressiveBlur position="top" backgroundColor="#050505" height="100px" blurAmount="3px" className="!fixed" />
        <ProgressiveBlur position="bottom" backgroundColor="#050505" height="70px" blurAmount="2px" className="!fixed" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[61] opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)" }}
      />
    </>
  );
}
