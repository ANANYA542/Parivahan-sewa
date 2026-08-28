import { useEffect, useRef, useState } from 'react';

/**
 * The hero's signature moment: a car driving a continuous loop past the
 * five service categories Parivahan Track organizes around. Built entirely
 * with CSS `offset-path` + generated `@keyframes` (no per-frame JS), so it
 * stays smooth under React re-renders and costs almost nothing on the main
 * thread — only `offset-distance`, `opacity`, and `transform` are animated,
 * all compositor-friendly. Motion is muted (or removed) automatically when
 * the visitor's OS asks for reduced motion.
 */

const ROAD_PATH_D = 'M 16 132 C 120 132 128 40 246 40 C 364 40 372 160 500 160 C 610 160 620 46 764 46';
const LOOP_SECONDS = 11;

interface ServiceStop {
  id: string;
  label: string;
  t: number;
  icon: JSX.Element;
}

function IdCardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <circle cx="8.5" cy="11" r="1.9" />
      <path d="M5.5 16c.6-1.6 1.8-2.4 3-2.4s2.4.8 3 2.4" />
      <path d="M14 9.5h5M14 13h5M14 16h3.2" />
    </svg>
  );
}

function VehicleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 15.5 5 10.2c.3-1 1.2-1.7 2.3-1.7h9.4c1.1 0 2 .7 2.3 1.7l1.5 5.3" />
      <path d="M2.8 15.5h18.4v2.3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-.8H5.8v.8a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1z" />
      <circle cx="7.3" cy="15.6" r="1.4" />
      <circle cx="16.7" cy="15.6" r="1.4" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5c-8 0-13 4-13 11 0 1.2.2 2 .2 2S13 18 15 13c-4 3-7 3.4-8.5 3.2C7 9 11.5 6 19 5Z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 21 19.5H3Z" />
      <path d="M12 9.5v4.2" />
      <circle cx="12" cy="16.4" r=".35" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PermitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5h9l3.5 3.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M15 3.5V7h3.5" />
      <path d="M8 12.5h8M8 15.5h8M8 9.5h4" />
    </svg>
  );
}

const STOPS: ServiceStop[] = [
  { id: 'licence', label: 'Licence', t: 0.1, icon: <IdCardIcon /> },
  { id: 'registration', label: 'Registration', t: 0.31, icon: <VehicleIcon /> },
  { id: 'puc', label: 'PUC & pollution', t: 0.52, icon: <LeafIcon /> },
  { id: 'challan', label: 'Challans', t: 0.73, icon: <AlertIcon /> },
  { id: 'permit', label: 'Permits', t: 0.92, icon: <PermitIcon /> }
];

function CarIcon() {
  return (
    <svg viewBox="0 0 48 24" width="40" height="20" style={{ display: 'block' }}>
      <ellipse cx="24" cy="21.5" rx="17" ry="1.6" fill="#000" opacity="0.15" />
      <path
        d="M6 16.5c0-1.4.8-2.6 2-3.2l3.4-1.7 3-4.3c.7-1 1.9-1.6 3.1-1.6h9c1.4 0 2.7.7 3.4 1.9l2.6 4.2 3.4.8c1.6.4 2.7 1.8 2.7 3.4v1.1c0 .9-.7 1.6-1.6 1.6h-1.1a3.4 3.4 0 1 0-6.7-.6H17.9a3.4 3.4 0 1 0-6.7.6H8a2 2 0 0 1-2-2z"
        fill="#f97316"
      />
      <path d="M15 9.2 13 13h7.4V8.6h-3.6c-.7 0-1.4.2-1.8.6Z" fill="#ffedd5" />
      <path d="M22.4 8.6V13H30l-2-3.4a2 2 0 0 0-1.7-1H22.4Z" fill="#ffedd5" />
      <circle cx="14.5" cy="17.3" r="2.6" fill="#0f172a" />
      <circle cx="14.5" cy="17.3" r="1" fill="#94a3b8" />
      <circle cx="32.5" cy="17.3" r="2.6" fill="#0f172a" />
      <circle cx="32.5" cy="17.3" r="1" fill="#94a3b8" />
      <rect x="6.5" y="12.4" width="2.6" height="1.4" rx="0.5" fill="#fed7aa" />
    </svg>
  );
}

export function RoadJourney() {
  const pathRef = useRef<SVGPathElement>(null);
  const [points, setPoints] = useState<{ id: string; x: number; y: number }[]>([]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    setPoints(STOPS.map((stop) => {
      const point = path.getPointAtLength(stop.t * length);
      return { id: stop.id, x: point.x, y: point.y };
    }));
  }, []);

  const keyframeRules = STOPS.map((stop) => {
    const peak = stop.t * 100;
    const before = Math.max(0, peak - 6);
    const after = Math.min(100, peak + 6);
    return `@keyframes glow-${stop.id} {
      0%, ${before}%, 100% { opacity: .45; transform: translate(-50%, -50%) scale(1); }
      ${peak}% { opacity: 1; transform: translate(-50%, -50%) scale(1.16); }
      ${after}% { opacity: .45; transform: translate(-50%, -50%) scale(1); }
    }`;
  }).join('\n');

  return (
    // overflow-hidden — the car's offset-path animation uses the same raw
    // 780x190 coordinate units as the SVG path, but (unlike the SVG's own
    // viewBox scaling) doesn't shrink to match a narrow container, so on
    // small cards it can travel outside this box; clip it here rather than
    // let it drift over unrelated content below.
    <div className="relative mt-2 select-none overflow-hidden">
      <style>{`
        @keyframes drive-along-road {
          0% { offset-distance: 0%; opacity: 0; }
          6% { opacity: 1; }
          94% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        ${keyframeRules}
        .road-car {
          offset-path: path('${ROAD_PATH_D}');
          offset-rotate: auto;
          animation: drive-along-road ${LOOP_SECONDS}s linear infinite;
        }
        .road-stop-glow {
          animation-name: var(--glow-name);
          animation-duration: ${LOOP_SECONDS}s;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .road-car, .road-stop-glow { animation: none !important; opacity: 1 !important; transform: translate(-50%, -50%) scale(1) !important; }
          .road-car { offset-distance: 46%; }
        }
        @supports not (offset-path: path('M0 0')) {
          .road-car { position: absolute; left: 46%; top: 40%; animation: none; }
        }
      `}</style>

      <svg viewBox="0 0 780 190" className="w-full" role="img" aria-label="Animated illustration of a car travelling a route through the driving licence, registration, PUC, challan, and permit services.">
        <path ref={pathRef} d={ROAD_PATH_D} fill="none" stroke="none" />
        <path d={ROAD_PATH_D} fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="22" strokeLinecap="round" />
        <path d={ROAD_PATH_D} fill="none" stroke="rgba(30,41,59,0.5)" strokeWidth="16" strokeLinecap="round" />
        <path d={ROAD_PATH_D} fill="none" stroke="rgba(249,115,22,0.65)" strokeWidth="1.4" strokeDasharray="10 9" strokeLinecap="round" />
      </svg>

      {points.map((point, index) => {
        const stop = STOPS[index];
        if (!stop) return null;
        return (
          <div
            key={stop.id}
            className="road-stop-glow absolute flex flex-col items-center gap-1.5"
            style={{
              left: `${(point.x / 780) * 100}%`,
              top: `${(point.y / 190) * 100}%`,
              transform: 'translate(-50%, -50%)',
              ...({ '--glow-name': `glow-${stop.id}` } as Record<string, string>)
            }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-300 bg-white text-orange-600 shadow-sm">
              {stop.icon}
            </span>
            {/* hidden below sm — at narrow widths this whole diagram shrinks but the
                label pills stay a fixed pixel size, so they overlap each other and
                the caption text below; icons alone still communicate the route */}
            <span className="hidden whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 shadow-sm sm:inline-block">{stop.label}</span>
          </div>
        );
      })}

      <div className="road-car pointer-events-none absolute left-0 top-0" aria-hidden="true">
        <CarIcon />
      </div>
    </div>
  );
}
