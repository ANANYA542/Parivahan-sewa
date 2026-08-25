import { useEffect, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { APP_NAME, type CaseDetail, type CaseRecord, type IntentResolution, type MobilityIntelligenceSnapshot, type ServiceDefinition, type SubmissionData } from '@parivahan/shared';
import { fadeUp, staggerContainer } from './lib/motion';
import { Hero } from './components/hero/Hero';
import { Shell } from './components/layout/Shell';
import { MyVahanDashboard } from './components/dashboard/MyVahanDashboard';
import { IntentAssistant } from './components/intent/IntentAssistant';
import { GuidedNavigator } from './components/navigator/GuidedNavigator';
import { CaseTimeline } from './components/cases/CaseTimeline';
import { SmartMobilityMap } from './components/map/SmartMobilityMap';
import { MobilityScoreCard } from './components/intelligence/MobilityScoreCard';
import { MobilityNudges } from './components/intelligence/MobilityNudges';
import { ServiceCatalog } from './components/services/ServiceCatalog';
import { StandingAgentPanel } from './components/phase3/StandingAgentPanel';
import { createCase, getCase, getIdentity, getMobilityIntelligence, getServices, getWorkflow, resolveIntent } from './lib/api';

const DEMO_USER_ID = 'user-001';

export default function App() {
  const [identity, setIdentity] = useState<Awaited<ReturnType<typeof getIdentity>> | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [mobilityIntelligence, setMobilityIntelligence] = useState<MobilityIntelligenceSnapshot | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void getIdentity(DEMO_USER_ID)
      .then((bundle) => {
        if (!isCurrent) return;
        setIdentity(bundle);
        const firstCase = bundle.cases[0];
        if (firstCase) void selectCase(firstCase.caseId);
      })
      .catch((reason) => {
        if (isCurrent) setLoadError(reason instanceof Error ? reason.message : 'Unable to load your profile.');
      });

    void getServices()
      .then((catalog) => {
        if (isCurrent) setServices(catalog);
      })
      .catch((reason) => {
        if (isCurrent) setLoadError(reason instanceof Error ? reason.message : 'Unable to load the service directory.');
      });

    void getMobilityIntelligence(DEMO_USER_ID)
      .then((snapshot) => {
        if (isCurrent) setMobilityIntelligence(snapshot);
      })
      .catch((reason) => {
        if (isCurrent) setLoadError(reason instanceof Error ? reason.message : 'Unable to load mobility intelligence.');
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function selectCase(caseId: string) {
    setIsLoadingCase(true);
    try {
      setSelectedCase(await getCase(caseId));
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Unable to load the selected case.');
    } finally {
      setIsLoadingCase(false);
    }
  }

  async function handleResolveIntent(query: string): Promise<IntentResolution> {
    const { intent } = await resolveIntent(query);
    if (intent.serviceId) {
      setSelectedService(await getWorkflow(intent.serviceId));
    }
    return intent;
  }

  async function handleSelectService(serviceId: string) {
    try {
      setSelectedService(await getWorkflow(serviceId));
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Unable to load the selected service.');
    }
  }

  async function handleSubmit(input: { serviceId: string; vehicleId?: string; submissionData: SubmissionData }): Promise<CaseRecord> {
    setIsSubmitting(true);
    try {
      const createdCase = await createCase({ userId: DEMO_USER_ID, ...input });
      const [bundle, detail, intelligence] = await Promise.all([
        getIdentity(DEMO_USER_ID),
        getCase(createdCase.caseId),
        getMobilityIntelligence(DEMO_USER_ID)
      ]);
      setIdentity(bundle);
      setSelectedCase(detail);
      setMobilityIntelligence(intelligence);
      return createdCase;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <Shell>
        <Hero title={APP_NAME} subtitle="Phase 2: mobility intelligence turns your service, compliance, and case data into clear next actions." />
        {loadError ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {loadError}
          </motion.div>
        ) : null}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-8">
          <motion.div variants={fadeUp} className="grid gap-6 xl:grid-cols-2">
            <MyVahanDashboard identity={identity} />
            <MobilityScoreCard snapshot={mobilityIntelligence} />
          </motion.div>
          <motion.div variants={fadeUp} className="grid gap-6 xl:grid-cols-2">
            <IntentAssistant onResolve={handleResolveIntent} />
            <GuidedNavigator service={selectedService} vehicles={identity?.vehicles ?? []} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <ServiceCatalog services={services} selectedServiceId={selectedService?.serviceId ?? null} onSelect={(serviceId) => void handleSelectService(serviceId)} />
          </motion.div>
          <motion.div variants={fadeUp} className="grid gap-6 xl:grid-cols-2">
            <CaseTimeline cases={identity?.cases ?? []} selectedCase={selectedCase} isLoadingDetail={isLoadingCase} onSelect={(caseId) => void selectCase(caseId)} />
            <SmartMobilityMap layers={mobilityIntelligence?.mapLayers ?? []} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <MobilityNudges nudges={mobilityIntelligence?.nudges ?? []} onAction={(serviceId) => void handleSelectService(serviceId)} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StandingAgentPanel userId={DEMO_USER_ID} onIntentFromVoice={async (text) => { await handleResolveIntent(text); }} />
          </motion.div>
        </motion.div>
      </Shell>
    </MotionConfig>
  );
}
