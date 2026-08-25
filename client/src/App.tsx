import { useEffect, useState } from 'react';
import { APP_NAME, computeMobilityScore, type CaseDetail, type CaseRecord, type IntentResolution, type ServiceDefinition, type SubmissionData } from '@parivahan/shared';
import { Hero } from './components/hero/Hero';
import { Shell } from './components/layout/Shell';
import { MyVahanDashboard } from './components/dashboard/MyVahanDashboard';
import { IntentAssistant } from './components/intent/IntentAssistant';
import { GuidedNavigator } from './components/navigator/GuidedNavigator';
import { CaseTimeline } from './components/cases/CaseTimeline';
import { SmartMobilityMap } from './components/map/SmartMobilityMap';
import { MobilityScoreCard } from './components/intelligence/MobilityScoreCard';
import { createCase, getCase, getIdentity, getWorkflow, resolveIntent } from './lib/api';

const DEMO_USER_ID = 'user-001';

export default function App() {
  const [identity, setIdentity] = useState<Awaited<ReturnType<typeof getIdentity>> | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
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

  async function handleSubmit(input: { serviceId: string; vehicleId?: string; submissionData: SubmissionData }): Promise<CaseRecord> {
    setIsSubmitting(true);
    try {
      const createdCase = await createCase({ userId: DEMO_USER_ID, ...input });
      const [bundle, detail] = await Promise.all([getIdentity(DEMO_USER_ID), getCase(createdCase.caseId)]);
      setIdentity(bundle);
      setSelectedCase(detail);
      return createdCase;
    } finally {
      setIsSubmitting(false);
    }
  }

  const mobilityScore = identity ? computeMobilityScore(identity) : null;

  return (
    <Shell>
      <Hero title={APP_NAME} subtitle="Phase 1: intent-driven mobility services, guided submissions, and case tracking in one place." />
      {loadError ? <div role="alert" className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{loadError}</div> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <MyVahanDashboard identity={identity} />
        <MobilityScoreCard result={mobilityScore} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <IntentAssistant onResolve={handleResolveIntent} />
        <GuidedNavigator service={selectedService} vehicles={identity?.vehicles ?? []} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <CaseTimeline cases={identity?.cases ?? []} selectedCase={selectedCase} isLoadingDetail={isLoadingCase} onSelect={(caseId) => void selectCase(caseId)} />
        <SmartMobilityMap />
      </div>
    </Shell>
  );
}
