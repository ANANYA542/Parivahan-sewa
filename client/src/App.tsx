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
import { DURATION, EASE_OUT, scaleTap } from './lib/motion';
import { SEVERITY_STYLES } from './lib/severity';
import { loadSession, saveSession, clearSession } from './lib/authStore';
import { navigateTo, navigateToJourney, useAppRoute, type AppRoute } from './lib/appRoutes';
import { Hero } from './components/hero/Hero';
import { Shell } from './components/layout/Shell';
import { AppNavigation } from './components/layout/AppNavigation';
import { LoginScreen } from './components/auth/LoginScreen';
import { FloatingVoiceAssistant } from './components/voice/FloatingVoiceAssistant';
import { MyVahanDashboard } from './components/dashboard/MyVahanDashboard';
import { IntentAssistant } from './components/intent/IntentAssistant';
import { GuidedNavigator } from './components/navigator/GuidedNavigator';
import { JourneyPreview } from './components/navigator/JourneyPreview';
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
  setAuthToken,
  setOnUnauthorized
} from './lib/api';

const pageCopy: Record<AppRoute, { title: string; description: string }> = {
  dashboard: { title: 'Your mobility, at a glance.', description: 'See the vehicle records and time-sensitive actions that need your attention today.' },
  services: { title: 'Find the service that fits.', description: 'Browse every available transport service by the task you need to complete.' },
  journey: { title: 'Take one step at a time.', description: 'Describe your need or continue the guided service route you selected.' },
  cases: { title: 'Track every submitted case.', description: 'See where each one stands, when it is due, what happened, and download your copy any time.' },
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
      <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-slate-50 md:text-5xl">{page.title}</h1>
      <p className="mt-3 text-base leading-7 text-slate-400">{page.description}</p>
    </div>
  );
}

export default function App() {
  const { route, journeyServiceId } = useAppRoute();
  const [session, setSession] = useState<AuthSession | null>(() => {
    const existing = loadSession();
    if (existing) setAuthToken(existing.token);
    return existing;
  });

  const [identity, setIdentity] = useState<Awaited<ReturnType<typeof getIdentity>> | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [journeyPrefill, setJourneyPrefill] = useState<Record<string, string> | null>(null);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [mobilityIntelligence, setMobilityIntelligence] = useState<MobilityIntelligenceSnapshot | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [caseActionError, setCaseActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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
    setOnUnauthorized(() => handleLogout('Your session has expired. Please sign in again.'));
    return () => setOnUnauthorized(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // The guided journey for a specific service lives at its own URL,
  // /journey/:serviceId — so reloading, sharing, or using the browser's
  // back/forward always lands on a consistent, correctly-loaded page
  // instead of relying on in-memory state that a stale hot-reload or a
  // history navigation could desync from what's actually rendered.
  useEffect(() => {
    if (!journeyServiceId) {
      setSelectedService(null);
      setJourneyStarted(false);
      return;
    }
    let isCurrent = true;
    setJourneyStarted(false);
    void getWorkflow(journeyServiceId)
      .then((service) => {
        if (isCurrent) setSelectedService(service);
      })
      .catch((reason) => {
        if (isCurrent) setLoadError(reason instanceof Error ? reason.message : 'Unable to load the selected service.');
      });
    return () => {
      isCurrent = false;
    };
  }, [journeyServiceId]);

  async function selectCase(caseId: string) {
    setSelectedCaseId(caseId);
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
      navigateToJourney(intent.serviceId);
    }
    return intent;
  }

  function openServiceJourney(serviceId: string, prefill?: Record<string, string>) {
    setJourneyPrefill(prefill ?? null);
    navigateToJourney(serviceId);
  }

  function handleViewCase(caseId: string) {
    navigateTo('cases');
    void selectCase(caseId);
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
      setCaseActionError(reason instanceof Error ? reason.message : 'Unable to prepare your copy right now.');
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

  function handleLogout(message?: string) {
    setAuthToken(null);
    clearSession();
    setSession(null);
    setIdentity(null);
    setSelectedService(null);
    setJourneyStarted(false);
    // Not clearing `services` — it's public catalog data, not session state,
    // and the effect that loads it only runs once on mount; clearing it here
    // used to leave the Services page permanently empty (0 cards) for the
    // rest of the browser session after signing out, until a full reload.
    setMobilityIntelligence(null);
    setNotifications([]);
    setSelectedCase(null);
    setSelectedCaseId(null);
    setCaseActionError(null);
    navigateTo('dashboard');
    setLoadError(message ?? null);
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function pageContent() {
    switch (route) {
      case 'dashboard':
        if (!session) {
          return <LoginScreen onSignedIn={handleSignedIn} onOpenAssistant={() => setIsAssistantOpen(true)} />;
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
                  className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 ${SEVERITY_STYLES[autopilotNudge.severity].container}`}
                >
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${SEVERITY_STYLES[autopilotNudge.severity].label}`}>Renewal autopilot</p>
                    <p className="mt-1 text-sm font-medium text-slate-50">{autopilotNudge.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{autopilotNudge.message}</p>
                  </div>
                  <motion.button
                    {...scaleTap}
                    type="button"
                    onClick={() => openServiceJourney(autopilotNudge.actionServiceId!)}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-150 ${SEVERITY_STYLES[autopilotNudge.severity].button}`}
                  >
                    Renew now
                  </motion.button>
                </motion.div>
              ) : null}
              <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
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
            <div className="mt-7"><ServiceCatalog services={services} selectedServiceId={selectedService?.serviceId ?? null} onSelect={(serviceId) => openServiceJourney(serviceId)} /></div>
          </>
        );
      case 'journey':
        if (journeyServiceId) {
          // A dedicated page per service — its own URL, reloadable and
          // bookmarkable, separate from the AI/voice journey guide below.
          if (!selectedService) {
            return (
              <>
                <PageHeading route={route} />
                <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400 shadow-sm">Loading this journey...</div>
              </>
            );
          }
          return (
            <>
              <PageHeading route={route} />
              <div className="mt-7">
                {!journeyStarted ? (
                  <JourneyPreview
                    service={selectedService}
                    onStart={() => setJourneyStarted(true)}
                    onChooseAnother={() => navigateTo('services')}
                  />
                ) : (
                  <GuidedNavigator
                    service={selectedService}
                    vehicles={identity?.vehicles ?? []}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    initialValues={journeyPrefill ?? undefined}
                    onViewCase={handleViewCase}
                    onAddVehicle={() => navigateTo('dashboard')}
                  />
                )}
              </div>
            </>
          );
        }
        // The bare /journey page — "Start a request" in the nav — is the
        // AI + voice journey guide on its own, not paired with a form.
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7"><IntentAssistant onResolve={handleResolveIntent} /></div>
          </>
        );
      case 'cases':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7"><CaseTimeline cases={identity?.cases ?? []} selectedCase={selectedCase} selectedCaseId={selectedCaseId} isLoadingDetail={isLoadingCase} isEscalating={isEscalating} isDownloading={isDownloading} actionError={caseActionError} onSelect={(caseId) => void selectCase(caseId)} onEscalate={(caseId) => void handleEscalate(caseId)} onDownload={(caseId) => void handleDownload(caseId)} onStartRequest={() => navigateTo('journey')} /></div>
          </>
        );
      case 'map':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7"><AccidentMapModal layers={mobilityIntelligence?.mapLayers ?? []} onStartGuidedReport={(locatedAt) => openServiceJourney('svc-accident-report', locatedAt ? { location: `${locatedAt} (auto-detected)` } : undefined)} /></div>
          </>
        );
      case 'alerts':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7"><MobilityNudges notifications={notifications} onAction={(serviceId) => openServiceJourney(serviceId)} onMarkRead={(notificationId) => void handleMarkNotificationRead(notificationId)} /></div>
          </>
        );
      case 'health':
      case 'pollution':
      case 'fuel':
        return (
          <>
            <PageHeading route={route} />
            <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-800 px-5 py-4 text-sm text-slate-400">This view is illustrative only in the current prototype — see My Vahan on the dashboard for the underlying document status.</div>
            <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-slate-800 px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl" aria-hidden="true">
                {route === 'health' ? '🩺' : route === 'pollution' ? '🌫️' : '⛽'}
              </span>
              <p className="mt-4 text-sm font-medium text-slate-300">This view is still being built.</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">In the meantime, My Vahan on the dashboard already tracks the real document status behind this.</p>
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="mt-5 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors duration-150 hover:border-slate-600 hover:text-slate-50"
              >
                Back to dashboard
              </button>
            </div>
          </>
        );
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <Shell>
        <AppNavigation activeRoute={route} userName={session?.user.name ?? null} unreadCount={unreadCount} onNavigate={navigateTo} onSignOut={() => handleLogout()} />
        {loadError ? (
          <motion.div initial={{ opacity: 0, transform: 'translateY(-8px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {loadError}
          </motion.div>
        ) : null}
        {/* Plain conditional rendering here, not AnimatePresence mode="wait" — confirmed via
            browser testing (real, human-paced interaction, not just automation speed) that
            after completing a multi-step guided flow, the page-transition exit animation
            can get stuck, permanently blocking the next route's content from ever mounting.
            That's a real dead end in the primary citizen journey, not a cosmetic issue, so
            the fade-transition is removed rather than risk it — reliability over polish here. */}
        <main key={route}>
          {pageContent()}
        </main>
        {userId && !['health', 'pollution', 'fuel'].includes(route) ? (
          <div className="mt-7">
            <StandingAgentPanel userId={userId} onIntentFromVoice={async (text) => { await handleResolveIntent(text); }} />
          </div>
        ) : null}
      </Shell>
      <FloatingVoiceAssistant open={isAssistantOpen} onOpenChange={setIsAssistantOpen} onResolve={handleResolveIntent} />
    </MotionConfig>
  );
}
