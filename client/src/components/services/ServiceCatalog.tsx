import { motion } from 'framer-motion';
import type { ServiceDefinition } from '@parivahan/shared';
import { fadeUp, scaleTap, staggerContainer } from '../../lib/motion';

interface ServiceCatalogProps {
  services: ServiceDefinition[];
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
}

function formatCategory(category: string) {
  return category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ServiceCatalog({ services, selectedServiceId, onSelect }: ServiceCatalogProps) {
  const servicesByCategory = services.reduce<Record<string, ServiceDefinition[]>>((groups, service) => {
    const categoryServices = groups[service.category] ?? [];
    categoryServices.push(service);
    groups[service.category] = categoryServices;
    return groups;
  }, {});

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Parivahan Service Directory</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Official Parivahan services in one catalog. Local guided journeys are marked separately; all other entries open the corresponding official portal flow.</p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{services.length} services</span>
      </div>
      <div className="mt-6 space-y-7">
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          <div key={category}>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-amber-200">{formatCategory(category)}</h3>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            >
              {categoryServices.map((service) => (
                <motion.button
                  key={service.serviceId}
                  variants={fadeUp}
                  {...scaleTap}
                  type="button"
                  onClick={() => onSelect(service.serviceId)}
                  className={`rounded-2xl border p-4 text-left transition-colors duration-200 ${selectedServiceId === service.serviceId ? 'border-amber-300/70 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:border-white/25'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-white">{service.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${service.delivery === 'guided' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-slate-700 text-slate-300'}`}>{service.delivery === 'guided' ? 'Guided' : 'Official portal'}</span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-400">{service.description}</p>
                </motion.button>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
