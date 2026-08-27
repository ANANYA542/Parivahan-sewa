import type { ServiceDefinition } from '@parivahan/shared';

export interface HomeCheckpoint {
  service: ServiceDefinition;
  t: number;
  label: string;
  accent: 'saffron' | 'green' | 'yellow';
}

const preferredCategories = [
  { category: 'driving-licence', label: 'Licence', t: 0.1, accent: 'saffron' as const },
  { category: 'vehicle-registration', label: 'Registration', t: 0.28, accent: 'green' as const },
  { category: 'permit-and-tax', label: 'Permit', t: 0.47, accent: 'yellow' as const },
  { category: 'compliance', label: 'Compliance', t: 0.67, accent: 'green' as const },
  { category: 'case-management', label: 'Cases', t: 0.86, accent: 'saffron' as const }
];

export function buildHomeCheckpoints(services: ServiceDefinition[]): HomeCheckpoint[] {
  const byId = new Map(services.map((service) => [service.serviceId, service]));
  const byCategory = new Map<string, ServiceDefinition[]>();

  for (const service of services) {
    const list = byCategory.get(service.category) ?? [];
    list.push(service);
    byCategory.set(service.category, list);
  }

  return preferredCategories.flatMap((slot) => {
    const pick = byCategory.get(slot.category)?.[0] ?? services.find((service) => service.name.toLowerCase().includes(slot.label.toLowerCase())) ?? null;
    if (!pick) return [];
    return [
      {
        service: byId.get(pick.serviceId) ?? pick,
        t: slot.t,
        label: slot.label,
        accent: slot.accent
      }
    ];
  });
}

