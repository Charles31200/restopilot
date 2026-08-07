import Image from "next/image";
import { ChevronLeft, Menu } from "lucide-react";

// Abstract, illustrative UI chrome — same convention as the RevenueChart
// mockup used elsewhere on the site (src/components/sections/product-visual),
// not a screenshot of the real product.
const chartValues = [30, 38, 34, 46, 42, 54, 50, 62, 58, 70, 66, 78];

function chartPath(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - ((v - min) / (max - min)) * height,
  }));
  return points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      return `Q ${prev.x} ${prev.y} ${midX} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
    })
    .join(" ");
}

export function PricingDeviceMockup() {
  const path = chartPath(chartValues, 200, 56);

  return (
    <div className="relative flex items-end justify-center gap-4">
      <div
        aria-hidden="true"
        className="hidden h-[104px] w-[124px] shrink-0 -rotate-6 rounded-2xl border border-white/10 bg-[#161618] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6)] sm:flex sm:items-center sm:justify-center"
      >
        <Image
          src="/brand/logo-mark-transparent.png"
          alt=""
          width={200}
          height={200}
          className="h-9 w-9 brightness-0 invert"
        />
      </div>

      <div
        aria-hidden="true"
        className="relative h-[248px] w-[136px] shrink-0 overflow-hidden rounded-[26px] border-[5px] border-[#2b2b2f] bg-[#0b0b0c] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65)] sm:h-[272px] sm:w-[148px]"
      >
        <span className="absolute left-1/2 top-1.5 h-[5px] w-10 -translate-x-1/2 rounded-full bg-black" />

        <div className="flex h-full flex-col px-3 pb-3 pt-6">
          <div className="flex items-center justify-between">
            <ChevronLeft size={11} className="text-white/50" />
            <span className="text-[9px] font-semibold tracking-tight text-white">
              PilotResto
            </span>
            <Menu size={11} className="text-white/50" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-white/[0.06] p-1.5">
              <p className="text-[6.5px] text-white/45">Chiffre d&apos;affaires</p>
              <p className="mt-0.5 text-[10px] font-semibold text-white">18 420&nbsp;€</p>
              <span className="mt-0.5 inline-block rounded-full bg-success-soft px-1 text-[6px] font-medium text-success-text">
                +9,2%
              </span>
            </div>
            <div className="rounded-lg bg-white/[0.06] p-1.5">
              <p className="text-[6.5px] text-white/45">Marge brute</p>
              <p className="mt-0.5 text-[10px] font-semibold text-white">64,8&nbsp;%</p>
              <span className="mt-0.5 inline-block rounded-full bg-success-soft px-1 text-[6px] font-medium text-success-text">
                +3,1%
              </span>
            </div>
          </div>

          <div className="mt-2 flex-1 rounded-lg bg-white/[0.04] p-1.5">
            <p className="text-[6.5px] text-white/45">Évolution — 7 derniers jours</p>
            <svg viewBox="0 0 200 56" className="mt-1 h-auto w-full" preserveAspectRatio="none">
              <path d={path} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
