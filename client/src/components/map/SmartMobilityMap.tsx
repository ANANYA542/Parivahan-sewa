const overlays = ['Accidents', 'High-risk zones', 'Safe routes', 'Pollution hotspots', 'Challan zones'];

export function SmartMobilityMap() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <h2 className="text-xl font-semibold text-white">Smart Mobility Map</h2>
      <p className="mt-2 text-sm text-slate-400">Phase 2 decision-support overlays retained as the next-layer integration boundary.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {overlays.map((overlay) => (
          <div key={overlay} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            {overlay}
          </div>
        ))}
      </div>
    </section>
  );
}
