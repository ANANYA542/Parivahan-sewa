interface HeroProps {
  title: string;
  subtitle: string;
}

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
      <p className="mb-3 text-sm uppercase tracking-[0.3em] text-amber-300">Phase 1 core loop</p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">{subtitle}</p>
    </section>
  );
}
