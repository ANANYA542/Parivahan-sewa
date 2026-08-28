import { useEffect, useState } from 'react';
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

const categoryContext: Record<string, string> = {
  'driving-licence': 'Start, renew, replace, or update your driving credentials.',
  'vehicle-registration': 'Register a vehicle and manage ownership or RC details.',
  'permit-and-tax': 'Plan permits, tax, and commercial vehicle obligations.',
  compliance: 'Stay ahead of PUC, insurance, fitness, and road compliance.',
  'case-management': 'Report an issue, track a case, or request a resolution.',
  'digital-services': 'Use digital documents and online citizen services.',
  information: 'Find official information, forms, and service references.',
  dashboards: 'Review transport dashboards and public data tools.',
  'business-and-manufacturer': 'Access services that hand off to business portals.'
};

export function ServiceCatalog({ services, selectedServiceId, onSelect }: ServiceCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const servicesByCategory = services.reduce<Record<string, ServiceDefinition[]>>((groups, service) => {
    const categoryServices = groups[service.category] ?? [];
    categoryServices.push(service);
    groups[service.category] = categoryServices;
    return groups;
  }, {});
  const categories = Object.keys(servicesByCategory);
  const currentCategory = activeCategory && servicesByCategory[activeCategory] ? activeCategory : (categories[0] ?? null);
  const visibleServices = currentCategory ? servicesByCategory[currentCategory] ?? [] : [];

  useEffect(() => {
    if (!activeCategory && categories[0]) setActiveCategory(categories[0]);
  }, [activeCategory, categories]);

  return (
    <section id="service-directory" className="scroll-mt-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-orange-600">SERVICE DISCOVERY</p>
          <h2 className="font-display mt-2 text-3xl text-slate-900">Choose the road you are on.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Start broad, then enter the service that matches your task. Guided services stay in this experience; other services clearly hand off to their official portal.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{services.length} services available</span>
      </div>
      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {categories.map((category, index) => {
            const isActive = category === currentCategory;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveCategory(category)}
                className={`group flex min-w-48 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors duration-200 lg:min-w-0 ${isActive ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <span className={`font-mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] ${isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{String(index + 1).padStart(2, '0')}</span>
                <span className={`text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{formatCategory(category)}</span>
              </button>
            );
          })}
        </div>

        <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
          {currentCategory ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] text-slate-500">CHECKPOINT {String(categories.indexOf(currentCategory) + 1).padStart(2, '0')}</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{formatCategory(currentCategory)}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{categoryContext[currentCategory] ?? 'Find the service that best matches your current task.'}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{visibleServices.length} options</span>
              </div>
              <motion.div
                key={currentCategory}
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
              >
                {visibleServices.map((service) => (
                  <motion.button
                    key={service.serviceId}
                    variants={fadeUp}
                    {...scaleTap}
                    type="button"
                    onClick={() => onSelect(service.serviceId)}
                    className={`group rounded-2xl border p-4 text-left transition-colors duration-200 ${selectedServiceId === service.serviceId ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium leading-5 text-slate-900">{service.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium tracking-wide ${service.delivery === 'guided' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{service.delivery === 'guided' ? 'Guided here' : 'Official portal'}</span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-500">{service.description}</p>
                    <span className="mt-4 inline-flex text-xs font-semibold text-orange-600 transition-transform duration-200 group-hover:translate-x-0.5">{selectedServiceId === service.serviceId ? 'Journey selected' : 'Open this journey'} <span aria-hidden="true" className="ml-1">-&gt;</span></span>
                  </motion.button>
                ))}
              </motion.div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Loading the service directory...</p>
          )}
        </div>
      </div>
    </section>
  );
}
