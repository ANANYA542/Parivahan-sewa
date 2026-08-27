import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
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
import { DURATION, EASE_OUT, scaleTap } from './lib/motion';
import { loadSession, saveSession, clearSession } from './lib/authStore';
import { navigateTo, useAppRoute, type AppRoute } from './lib/appRoutes';
import { Hero } from './components/hero/Hero';
import { Shell } from './components/layout/Shell';
import { AppNavigation } from './components/layout/AppNavigation';
import { LoginScreen } from './components/auth/LoginScreen';
import { MyVahanDashboard } from './components/dashboard/MyVahanDashboard';
import { IntentAssistant } from './components/intent/IntentAssistant';
import { GuidedNavigator } from './components/navigator/GuidedNavigator';
import { CaseTimeline } from './components/cases/CaseTimeline';
import { AccidentMapModal } from './components/map/AccidentMapModal';
import { MobilityScoreCard } from './components/intelligence/MobilityScoreCard';
import { MobilityNudges } from './components/intelligence/MobilityNudges';
import { ServiceCatalog } from './components/services/ServiceCatalog';
import { StandingAgentPanel } from './components/phase3/StandingAgentPanel';
import { AddVehicleOnboarding } from './components/onboarding/AddVehicleOnboarding';
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

const pageCopy: Record<AppRoute, { title: string; description: string }> = {
  dashboard: { title: 'Your mobility, at a glance.', description: 'See the vehicle records and time-sensitive actions that need your attention today.' },
  services: { title: 'Find the service that fits.', description: 'Browse every available transport service by the task you need to complete.' },
  journey: { title: 'Take one step at a time.', description: 'Describe your need or continue the guided service route you selected.' },
  cases: { title: 'Track every submitted case.', description: 'Review its current stage, deadline, history, acknowledgement, and escalation options.' },
  map: { title: 'See mobility context around you.', description: 'Explore illustrative reference overlays and case-history context. This is not live traffic data.' },
  alerts: { title: 'Keep the next action visible.', description: 'Review document reminders and case updates, then act on the relevant service.' },
  health: { title: 'Vehicle health score.', description: 'A rule-based read on your vehicle’s compliance posture, not a diagnostic sensor feed.' },
  pollution: { title: 'Pollution tracker.', description: 'Illustrative reference data around emissions and PUC status — not a live air-quality feed.' },
  fuel: { title: 'Fuel consumption.', description: 'An illustrative estimate, not a measured reading. Coming soon in a future update.' }
};

function PageHeading({ route }: { route: AppRoute }) {
  const page = pageCopy[route];
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-white md:text-5xl">{page.title}</h1>
      <p className="mt-3 text-base leading-7 text-slate-400">{page.description}</p>
    </div>
  );
}

export default function App() {
  const route = useAppRoute();
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
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);

  const userId = session?.user.userId ?? null;

  function onboardingSkipKey(id: string) {
    return `parivahan-track:onboarding-skipped:${id}`;
  }

  function skipOnboarding() {
    setOnboardingSkipped(true);
    if (userId) {
      try {
        window.localStorage.setItem(onboardingSkipKey(userId), 'true');
      } catch {
        // Best-effort convenience only.
      }
    }
  }

  async function refreshIdentity() {
    if (!userId) return;
    try {
      setIdentity(await getIdentity(userId));
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Unable to refresh your profile.');
    }
  }

  useEffect(() => {
    let isCurrent = true;

    void getServices()
      .then((catalog) => {
        if (isCurrent) setServices(catalog);
      })
      .catch((reason) => {
        if (isCurrent) setLoadError(reason instanceof Error ? reason.message : 'Unable to load the service directory.');
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    try {
      setOnboardingSkipped(window.localStorage.getItem(onboardingSkipKey(userId)) === 'true');
    } catch {
      setOnboardingSkipped(false);
    }

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

  async function handleSelectService(serviceId: string): Promise<boolean> {
    try {
      setSelectedService(await getWorkflow(serviceId));
      return true;
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Unable to load the selected service.');
      return false;
    }
  }

  async function openServiceJourney(serviceId: string) {
    if (await handleSelectService(serviceId)) navigateTo('journey');
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
    navigateTo('dashboard');
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
    navigateTo('dashboard');
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function pageContent() {
    switch (route) {
      case 'dashboard':
        if (!session) {
          return <LoginScreen onSignedIn={handleSignedIn} />;
        }
        {
          const autopilotNudge = notifications.find((item) => !item.read && item.actionServiceId && (item.severity === 'critical' || item.severity === 'warning'));
          return (
            <>
              <Hero
                title={APP_NAME}
                subtitle="From documents due today to a new application, start with the task in front of you and let the journey unfold one checkpoint at a time."
                userName={session.user.name}
                activeCaseCount={identity?.cases.filter((caseRecord) => !['resolved', 'rejected'].includes(caseRecord.status)).length ?? 0}
                onStartJourney={() => navigateTo('journey')}
                onBrowseServices={() => navigateTo('services')}
              />
              {identity && identity.vehicles.length === 0 && !onboardingSkipped ? (
                <div className="mt-6">
                  <AddVehicleOnboarding userId={session.user.userId} onComplete={() => void refreshIdentity()} onSkip={skipOnboarding} />
                </div>
              ) : null}
              {autopilotNudge ? (
                <motion.div
                  initial={{ opacity: 0, transform: 'translateY(-8px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0)' }}
                  transition={{ duration: DURATION.base, ease: EASE_OUT }}
                  role="status"
                  className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/25 bg-amber-400/10 px-5 py-4"
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">Renewal autopilot</p>
                    <p className="mt-1 text-sm font-medium text-white">{autopilotNudge.title}</p>
                    <p className="mt-1 text-sm text-amber-100/80">{autopilotNudge.message}</p>
                  </div>
                  <motion.button
                    {...scaleTap}
                    type="button"
                    onClick={() => void openServiceJourney(autopilotNudge.actionServiceId!)}
                    className="shrink-0 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors duration-150 hover:bg-amber-300"
                  >
                    Renew now
                  </motion.button>
                </motion.div>
              ) : null}
              <div className="mt-7 grid gap-6 xl:grid-cols-2">
                <MyVahanDashboard identity={identity} />
                <MobilityScoreCard snapshot={mobilityIntelligence} />
              </div>
            </>
          );
        }
      case 'services':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7"><ServiceCatalog services={services} selectedServiceId={selectedService?.serviceId ?? null} onSelect={(serviceId) => void openServiceJourney(serviceId)} /></div>
          </>
        );
      case 'journey':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <IntentAssistant onResolve={handleResolveIntent} />
              <GuidedNavigator service={selectedService} vehicles={identity?.vehicles ?? []} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
            </div>
          </>
        );
      case 'cases':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7"><CaseTimeline cases={identity?.cases ?? []} selectedCase={selectedCase} isLoadingDetail={isLoadingCase} isEscalating={isEscalating} isDownloading={isDownloading} actionError={caseActionError} onSelect={(caseId) => void selectCase(caseId)} onEscalate={(caseId) => void handleEscalate(caseId)} onDownload={(caseId) => void handleDownload(caseId)} /></div>
          </>
        );
      case 'map':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7"><AccidentMapModal layers={mobilityIntelligence?.mapLayers ?? []} onStartGuidedReport={() => void openServiceJourney('svc-accident-report')} /></div>
          </>
        );
      case 'alerts':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7"><MobilityNudges notifications={notifications} onAction={(serviceId) => void openServiceJourney(serviceId)} onMarkRead={(notificationId) => void handleMarkNotificationRead(notificationId)} /></div>
          </>
        );
      case 'health':
      case 'pollution':
      case 'fuel':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-400">This view is illustrative only in the current prototype — see My Vahan on the dashboard for the underlying document status.</div>
          </>
        );
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <Shell>
        <AppNavigation activeRoute={route} userName={session?.user.name ?? null} unreadCount={unreadCount} onNavigate={navigateTo} onSignOut={handleLogout} />
        {loadError ? (
          <motion.div initial={{ opacity: 0, transform: 'translateY(-8px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} role="alert" className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {loadError}
          </motion.div>
        ) : null}
        <main>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={route} initial={{ opacity: 0, transform: 'translateY(12px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} exit={{ opacity: 0, transform: 'translateY(-8px)' }} transition={{ duration: DURATION.base, ease: EASE_OUT }}>
              {pageContent()}
            </motion.div>
          </AnimatePresence>
        </main>
        {userId ? (
          <div className="mt-7">
            <StandingAgentPanel userId={userId} onIntentFromVoice={async (text) => { await handleResolveIntent(text); }} />
          </div>
        ) : null}
      </Shell>
    </MotionConfig>
  );
}
