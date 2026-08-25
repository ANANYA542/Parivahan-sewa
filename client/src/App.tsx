import { useEffect, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import {
  APP_NAME,
  type AppNotification,
  type AuthSession,
  type CaseDetail,
  type CaseRecord,
  type IntentResolution,
  type MobilityIntelligenceSnapshot,
  type ServiceDefinition,
  type SubmissionData
} from '@parivahan/shared';
import { fadeUp, scaleTap, staggerContainer } from './lib/motion';
import { loadSession, saveSession, clearSession } from './lib/authStore';
import { Hero } from './components/hero/Hero';
import { Shell } from './components/layout/Shell';
import { LoginScreen } from './components/auth/LoginScreen';
import { MyVahanDashboard } from './components/dashboard/MyVahanDashboard';
import { IntentAssistant } from './components/intent/IntentAssistant';
import { GuidedNavigator } from './components/navigator/GuidedNavigator';
import { CaseTimeline } from './components/cases/CaseTimeline';
import { SmartMobilityMap } from './components/map/SmartMobilityMap';
import { MobilityScoreCard } from './components/intelligence/MobilityScoreCard';
import { MobilityNudges } from './components/intelligence/MobilityNudges';
import { ServiceCatalog } from './components/services/ServiceCatalog';
import { StandingAgentPanel } from './components/phase3/StandingAgentPanel';
import {
  createCase,
  downloadCaseAcknowledgement,
  escalateCase,
  getCase,
  getIdentity,
  getMobilityIntelligence,
  getNotifications,
  getServices,
  getWorkflow,
  markNotificationRead,
  resolveIntent,
  setAuthToken
} from './lib/api';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const existing = loadSession();
    if (existing) setAuthToken(existing.token);
    return existing;
  });

  const [identity, setIdentity] = useState<Awaited<ReturnType<typeof getIdentity>> | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [mobilityIntelligence, setMobilityIntelligence] = useState<MobilityIntelligenceSnapshot | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [caseActionError, setCaseActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const userId = session?.user.userId ?? null;

  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    void getIdentity(userId)
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

    void getMobilityIntelligence(userId)
      .then((snapshot) => {
        if (isCurrent) setMobilityIntelligence(snapshot);
      })
      .catch((reason) => {
        if (isCurrent) setLoadError(reason instanceof Error ? reason.message : 'Unable to load mobility intelligence.');
      });

    void getNotifications(userId)
      .then((items) => {
        if (isCurrent) setNotifications(items);
      })
      .catch((reason) => {
        if (isCurrent) setLoadError(reason instanceof Error ? reason.message : 'Unable to load notifications.');
      });

    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function selectCase(caseId: string) {
    setIsLoadingCase(true);
    setCaseActionError(null);
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
    if (!userId) throw new Error('You must be signed in to submit a service request.');
    setIsSubmitting(true);
    try {
      const createdCase = await createCase(input);
      const [bundle, detail, intelligence, notificationList] = await Promise.all([
        getIdentity(userId),
        getCase(createdCase.caseId),
        getMobilityIntelligence(userId),
        getNotifications(userId)
      ]);
      setIdentity(bundle);
      setSelectedCase(detail);
      setMobilityIntelligence(intelligence);
      setNotifications(notificationList);
      return createdCase;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEscalate(caseId: string) {
    if (!userId) return;
    setIsEscalating(true);
    setCaseActionError(null);
    try {
      await escalateCase(caseId);
      const [detail, bundle] = await Promise.all([getCase(caseId), getIdentity(userId)]);
      setSelectedCase(detail);
      setIdentity(bundle);
    } catch (reason) {
      setCaseActionError(reason instanceof Error ? reason.message : 'Unable to escalate this case.');
    } finally {
      setIsEscalating(false);
    }
  }

  async function handleDownload(caseId: string) {
    setIsDownloading(true);
    setCaseActionError(null);
    try {
      await downloadCaseAcknowledgement(caseId);
    } catch (reason) {
      setCaseActionError(reason instanceof Error ? reason.message : 'Unable to generate the acknowledgement.');
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleMarkNotificationRead(notificationId: string) {
    if (!userId) return;
    try {
      setNotifications(await markNotificationRead(userId, notificationId));
    } catch {
      // Read state is a convenience; a failed mark-as-read isn't worth a top-level error banner.
    }
  }

  function handleSignedIn(newSession: AuthSession) {
    setAuthToken(newSession.token);
    saveSession(newSession);
    setSession(newSession);
  }

  function handleLogout() {
    setAuthToken(null);
    clearSession();
    setSession(null);
    setIdentity(null);
    setSelectedService(null);
    setServices([]);
    setMobilityIntelligence(null);
    setNotifications([]);
    setSelectedCase(null);
    setLoadError(null);
    setCaseActionError(null);
  }

  if (!session) {
    return (
      <MotionConfig reducedMotion="user">
        <LoginScreen onSignedIn={handleSignedIn} />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Shell>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <span>
            Signed in as <span className="font-medium text-white">{session.user.name}</span>
          </span>
          <motion.button
            {...scaleTap}
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 transition-colors duration-200 hover:border-white/25 hover:text-white"
          >
            Sign out
          </motion.button>
        </motion.div>
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
            <CaseTimeline
              cases={identity?.cases ?? []}
              selectedCase={selectedCase}
              isLoadingDetail={isLoadingCase}
              isEscalating={isEscalating}
              isDownloading={isDownloading}
              actionError={caseActionError}
              onSelect={(caseId) => void selectCase(caseId)}
              onEscalate={(caseId) => void handleEscalate(caseId)}
              onDownload={(caseId) => void handleDownload(caseId)}
            />
            <SmartMobilityMap layers={mobilityIntelligence?.mapLayers ?? []} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <MobilityNudges
              notifications={notifications}
              onAction={(serviceId) => void handleSelectService(serviceId)}
              onMarkRead={(notificationId) => void handleMarkNotificationRead(notificationId)}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            {userId ? <StandingAgentPanel userId={userId} onIntentFromVoice={async (text) => { await handleResolveIntent(text); }} /> : null}
          </motion.div>
        </motion.div>
      </Shell>
    </MotionConfig>
  );
}
