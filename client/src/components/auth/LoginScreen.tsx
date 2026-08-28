import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { AuthSession, UserProfile } from '@parivahan/shared';
import { APP_NAME } from '@parivahan/shared';
import { DURATION, EASE_OUT, fadeUp, scaleTap, staggerContainer } from '../../lib/motion';
import { getDemoUsers, login, signup } from '../../lib/api';
import { RoadJourney } from '../hero/RoadJourney';

interface LoginScreenProps {
  onSignedIn: (session: AuthSession) => void;
  onOpenAssistant: () => void;
}

export function LoginScreen({ onSignedIn, onOpenAssistant }: LoginScreenProps) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [demoUsers, setDemoUsers] = useState<UserProfile[]>([]);

  // Sign Up form state
  const [signUpName, setSignUpName] = useState('');
  const [signUpContact, setSignUpContact] = useState('');
  const [signUpLanguage, setSignUpLanguage] = useState('en');

  // Sign In form state
  const [signInContact, setSignInContact] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFoundContact, setNotFoundContact] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void getDemoUsers()
      .then((users) => {
        if (isCurrent) setDemoUsers(users);
      })
      .catch(() => {
        // Demo directory is a fallback convenience
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const name = signUpName.trim();
    const contact = signUpContact.trim();

    if (!name) {
      setError('Please enter your full name.');
      return;
    }
    if (!contact) {
      setError('Please enter your mobile or contact number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotFoundContact(null);

    try {
      const session = await signup({
        name,
        contact,
        preferredLanguage: signUpLanguage
      });
      onSignedIn(session);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign-up failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignIn(e?: React.FormEvent, directContact?: string) {
    if (e) e.preventDefault();
    const contactToUse = (directContact ?? signInContact).trim();

    if (!contactToUse) {
      setError('Enter the contact number linked to your account.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotFoundContact(null);

    try {
      const session = await login(contactToUse);
      onSignedIn(session);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Sign-in failed. Please try again.';
      setError(message);
      if (message.toLowerCase().includes('no account matches') || message.toLowerCase().includes('not found')) {
        setNotFoundContact(contactToUse);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchToSignUpWithContact(contactValue: string) {
    setSignUpContact(contactValue);
    setMode('signup');
    setError(null);
    setNotFoundContact(null);
  }

  return (
    <div className="min-h-screen w-full px-4 py-5 md:px-8 md:py-7">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-7xl"
      >
        {/* No internal header here — AppNavigation is the single header/logo
            lockup for both signed-out and signed-in states now; this screen
            used to render its own separate "P / Parivahan Journey" lockup
            directly beneath it, which read as a duplicated, redundant header
            on the very first screen a visitor sees. */}
        <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(25rem,0.82fr)] lg:items-stretch">
          <motion.section variants={fadeUp} className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm md:p-9">
            <div className="relative">
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-300">A simpler way to move through mobility services</span>
              <h1 className="font-display mt-6 max-w-2xl text-4xl leading-[1.02] tracking-tight text-slate-50 md:text-6xl">Every transport task starts with one clear next turn.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Explore services as a connected journey. Tell the guide what you need, follow the relevant checkpoints, and keep track of what happens next.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onOpenAssistant}
                  className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300"
                >
                  Ask AI for a route
                </button>
                <a href="#account-entry" className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800">Login or sign up</a>
              </div>
            </div>

            <div className="relative mt-8 rounded-3xl border border-slate-800 bg-slate-800 px-2 pb-8 pt-3 md:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2 px-2">
                <span className="font-mono text-[10px] tracking-[0.16em] text-slate-400">DISCOVER YOUR ROUTE</span>
                <span className="text-xs text-slate-400">Licence to permits, one connected path</span>
              </div>
              <RoadJourney />
            </div>

            <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['1', 'Describe your need', 'Use ordinary language, not portal labels.'],
                ['2', 'Follow clear steps', 'See only what the current checkpoint needs.'],
                ['3', 'Track the outcome', 'Keep applications and next actions together.']
              ].map(([number, heading, detail]) => (
                <div key={number} className="rounded-2xl border border-slate-800 bg-slate-800 p-4">
                  <span className="font-mono text-xs text-amber-400">0{number}</span>
                  <p className="mt-3 text-sm font-semibold text-slate-50">{heading}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section id="account-entry" variants={fadeUp} className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm md:p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-300">Citizen entry</span>
          <span className="font-mono text-[10px] text-slate-400">SYNTHETIC DEMO</span>
        </div>

        <h2 className="font-display mt-5 text-3xl leading-tight text-slate-50">Start your guided journey.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{APP_NAME} uses mock data for this prototype. No real personal information is required.</p>

        <div className="mt-6 flex rounded-2xl border border-slate-800 bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              mode === 'signup'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Create Account (Sign Up)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              mode === 'signin'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Plain conditional rendering here, not AnimatePresence mode="wait" — same
            stuck-exit-animation class of bug confirmed elsewhere in the app (see
            App.tsx / GuidedNavigator.tsx): under real, human-paced clicks the exit
            animation can stall, so the next form (and its submit button) never
            mounts. Sign in/up is the very first thing a citizen touches, so
            reliability wins over the cross-fade here. */}
        {mode === 'signup' ? (
            <motion.form
              key="signup-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              onSubmit={handleSignUp}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Mobile / Contact Number <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={signUpContact}
                  onChange={(e) => setSignUpContact(e.target.value)}
                  placeholder="e.g. +91 8091448752 or 8091448752"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Preferred Language
                </label>
                <select
                  value={signUpLanguage}
                  onChange={(e) => setSignUpLanguage(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-50 focus:border-amber-400 focus:outline-none"
                  disabled={isSubmitting}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>

              <motion.button
                {...scaleTap}
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-amber-400 py-3.5 text-sm font-bold text-slate-950 transition-all duration-200 hover:bg-amber-300 disabled:opacity-60"
              >
                {isSubmitting ? 'Creating your account…' : 'Sign Up & Continue'}
              </motion.button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-amber-300 transition-colors"
                >
                  Already have an account? <span className="font-semibold text-amber-300 underline underline-offset-2">Sign in here</span>
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="signin-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              onSubmit={(e) => handleSignIn(e)}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Registered Contact Number <span className="text-amber-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={signInContact}
                    onChange={(e) => setSignInContact(e.target.value)}
                    placeholder="+91-90000-00001 or +91 8091448752"
                    className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <motion.button
                    {...scaleTap}
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition-all duration-200 hover:bg-amber-300 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Signing in…' : 'Sign In'}
                  </motion.button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-amber-300 transition-colors"
                >
                  First time here? <span className="font-semibold text-amber-300 underline underline-offset-2">Sign up for an account</span>
                </button>
              </div>
            </motion.form>
        )}

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            role="alert"
            className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300"
          >
            <p>{error}</p>
            {notFoundContact && (
              <button
                type="button"
                onClick={() => switchToSignUpWithContact(notFoundContact)}
                className="mt-2 text-xs font-semibold text-amber-300 hover:underline flex items-center gap-1"
              >
                &rarr; Create new account with &ldquo;{notFoundContact}&rdquo; now
              </button>
            )}
          </motion.div>
        ) : null}

        {demoUsers.length ? (
          <motion.div variants={fadeUp} className="mt-8 border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-400">Demo accounts (synthetic seed data)</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {demoUsers.map((user) => (
                <motion.button
                  {...scaleTap}
                  key={user.userId}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setSignInContact(user.contact);
                    setMode('signin');
                    void handleSignIn(undefined, user.contact);
                  }}
                  className="rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-medium text-slate-300 transition-colors duration-200 hover:border-amber-500/30 hover:text-amber-300 disabled:opacity-60"
                >
                  Quick Sign in as {user.name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : null}
          </motion.section>
        </div>

        <motion.p variants={fadeUp} className="mt-5 text-center text-xs leading-5 text-slate-400">A public experience for learners, vehicle owners, drivers, and operators. Government services remain external handoffs where required.</motion.p>
      </motion.div>
    </div>
  );
}
