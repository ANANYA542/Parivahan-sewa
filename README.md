# Parivahan Track

A citizen-first layer over India's fragmented transport services — one login, one guided flow, one place to track what happens next, built around a single flagship scenario: **reporting a road accident**, a service that today does not exist anywhere in this ecosystem.

## The problem

A citizen dealing with Indian transport services today has to juggle three separately-branded, separately-logged-in government systems: **Vahan** (vehicle registration), **Sarathi** (driving licence), and the **PUC portal** (pollution certificates) — plus **eChallan** for traffic fines. None of them share a session, a profile, or a vehicle record. Every service page follows the same pattern: a static *process flow → step-by-step procedure → avail service* page to read before a usable form even opens. Once something is submitted, the system has nothing more to say than "Application under process at RTO level" — no stage timeline, no named office, no deadline.

One gap is worse than the rest: **accident reporting has no digital home anywhere in this ecosystem.** We verified this directly by searching Vahan, Sarathi, and eChallan for a citizen-facing accident-report service — none exists. It is a police-station, FIR-only process today, using an internal recording format (MoRTH's Road Accident Recording Form) that a citizen never sees or fills in themselves. In the minutes after a crash — disoriented, possibly injured, dealing with another party — a citizen has no structured way to capture what happened while it's fresh, and no digital trail of having reported it at all.

## The solution

Parivahan Track is a single guided experience layered on top of this fragmented system, built around one login and one flagship flow: **describe what happened, in your own words or by voice, and be walked through a structured accident report one question at a time** — the same plain-language, one-question-per-screen pattern applied to grievance filing and challan disputes.

Concretely, for the accident scenario:

- A citizen tells the "Journey Guide" what happened — typed or spoken — in ordinary language ("I was in an accident"), not a portal menu label.
- The app matches this to the Accident Report flow and states its confidence, rather than silently guessing.
- The report is broken into five short screens (review what's needed → incident details → conditions → people and vehicles involved → confirm and submit), each using real government vocabulary (area type, weather, collision type, hit-and-run, injury severity) drawn from MoRTH's own accident-recording form, rendered as tap-to-select chips where possible so nothing needs to be typed from memory.
- Every text field also accepts voice input, and location can be auto-detected — built for someone who may not want to (or be able to) type at length one-handed after a crash.
- Submitting produces a tracked **Case** with a stage, a due-by date, a live countdown, and a one-tap escalation — not a form that vanishes into a black box — plus a downloadable structured PDF a citizen can hand to a police station or insurer.

The same pattern (guided, voice-capable, plain-language, always-confirmed, always-tracked) is applied to grievance filing and challan disputes, because the underlying problem — static instructions, opaque submission, no tracking — is the same across all of them.

## The full user flow (as walked and verified end-to-end)

This is the actual path exercised with a real browser (Playwright + Chromium) against the running app, not an aspirational description:

1. **Home, logged out** — the page loads directly to marketing content and a "Discover your route" preview (no login wall, no access request). Nav shows "Login or sign up" and "Ask AI for a route".
2. **Sign up** — full name + mobile number, no password (a deliberate prototype simplification — see "What's mocked" below). A "Quick sign in as [demo citizen]" option is also offered for reviewers who don't want to create a fresh account.
3. **One-time vehicle onboarding** — a short, explicitly skippable step to link a vehicle. Skipping it was exercised directly; the rest of the flagship journey does not require it.
4. **Dashboard** — a hero section states the app's purpose plainly, with "Ask the journey guide" and "Browse all services" as the two primary calls to action, next to a Mobility Health Score card and an embedded "Ask AI" assistant panel.
5. **Start a request → Journey Guide** — a text box ("What do you need help with?") plus four common-need chips. Typing "I was in an accident" (voice input on this same field was also exercised — see the voice note below) returns "Matched: Accident Report (high confidence)" and reveals the guided flow beneath it.
6. **Guided Accident Report, five screens:**
   - *Review incident intake* — states what to have ready before starting.
   - *Capture incident details* — location and time, each with a 🎙 mic button and a 📍 "Use my location" button on the location field.
   - *Describe the conditions* — area type, weather, collision type, hit-and-run, all as tap-to-select chips.
   - *Record people and vehicles involved* — injury severity as chips, a free-text field for vehicles involved.
   - *Submit report* — a required "I confirm this information is accurate" checkbox, then Submit.
7. **Confirmation** — an inline message ("Submitted successfully. Case case-NNN is now being tracked.") appears immediately; no page reload, no dead end.
8. **Case Tracking** — the new case appears with its status ("Submitted"), a due-by date and a live "N days left" countdown, a "Mark as urgent" escalation action, and "Download my copy".
9. **Download** — clicking through produces a real, generated PDF: a sectioned "Road Incident Intimation Record" a citizen could hand to a police station or insurer.

Two other surfaces were walked the same way: the **Services** catalog (browse by category, e.g. Case Management, Driving Licence, PUC & Pollution) and the **Smart Mobility Map** (toggle accident/high-risk/safe-route/pollution/challan overlays, auto-detect location, jump straight into the guided accident report from the map).

**Voice input — verified mechanically, not acoustically.** The mic button, microphone-permission grant, and listening-state toggle ("🎙" → "Stop") all work correctly under automated testing with a synthetic audio feed. The actual speech-to-text transcript came back empty in that sandboxed run — Chromium's on-device Web Speech API needs live network access to a cloud recognition backend, which the automated test environment does not have. **This must be manually re-verified in a real browser with a real microphone before recording the demo** — it is a genuine, disclosed limitation of what automated testing alone can confirm, not a claim that it works.

## Tech stack (as implemented)

- **Client**: React 18 + TypeScript + Vite, Tailwind CSS, Framer Motion for micro-interactions.
- **Server**: NestJS (TypeScript), modular by domain — `auth`, `identity`, `intent`, `workflow`, `cases`, `documents`, `mobility-intelligence`, `notifications`, `phase3` (the AI assistant) — JWT bearer auth, per-route ownership checks, request-body validation.
- **Data**: a seeded, in-memory repository shared across modules (see "What's mocked" — this is a deliberate choice, not an oversight). A `packages/shared` workspace holds the domain types and the rules engine (SLA/case logic, mobility nudges) used by both client and server.
- **AI reasoning**: Groq-hosted `openai/gpt-oss-120b` (an OpenAI open-weight model, served via Groq's API — not OpenAI's own API; see disclosure below), with a lightweight in-memory conversational session (keyed per browser session, not a database table) and a curated RTO/Parivahan knowledge base concatenated directly into the system prompt — static context injection, not a RAG/embeddings pipeline (see disclosure below).
- **Voice**: the browser's native Web Speech API for both directions — `SpeechRecognition` for speech-to-text on every guided-flow field and the Ask AI assistant, `window.speechSynthesis` for read-aloud replies. No external voice API, no key, no per-call cost.
- **PDF generation**: server-side, sectioned and case-type-aware (a different layout for an accident report vs. a grievance), built from scratch rather than overlaying a real government form template (see disclosure below).

## What's real vs. mocked — stated plainly

| What | Status | Why |
|---|---|---|
| The guided accident-report flow, its fields, and the submit → Case → PDF pipeline | **Real** | This is the actual, working flagship path, exercised end-to-end with a real browser in this session |
| All personal, vehicle, and case data | **Synthetic, in-memory** | No real government data, Aadhaar/PAN, or payments are touched — required by the brief, and resets on server restart by design |
| Database | **In-memory, not Postgres** | A Prisma schema exists and matches the data model, but wiring it in was deliberately deprioritized under deadline pressure in favor of a fully working citizen journey |
| Generated case PDFs | **Real PDFs, honestly labelled** | Framed explicitly as a citizen's own structured copy — useful for filing a police FIR or an insurance claim — never presented as an official government document, because no such official digital form exists for this service today |
| Official Vahan/Sarathi/eChallan/PUCC links | **Real URLs, untouched** | Services that need them hand off to the real portal rather than simulating or scraping it |
| AI reasoning model | **Groq-hosted `openai/gpt-oss-120b`, not OpenAI's own API** | A stability decision made under deadline pressure: Groq was tested and working; the client is already OpenAI-API-compatible, so swapping in a real OpenAI key is a same-day follow-up, not a rebuild |
| AI knowledge base | **A curated, hand-written fact sheet, not real RAG** | DL/LL/RC/PUC/fitness validity periods, renewal windows, form numbers, and the real 8-step eChallan grievance process, cross-checked against `parivahan.gov.in`'s own FAQ content — injected into the system prompt on every call with no retrieval step at all. A real embeddings-based RAG layer over a larger, refreshed corpus is the natural next step, not something faked here |
| Voice input/output | **Real, browser-native Web Speech API** — mechanically verified, acoustic transcription not yet verified with a live mic | Chosen over ElevenLabs/OpenAI Whisper/Sarvam/Bhashini specifically to avoid a second untested external dependency on demo day; see the flow section above for exactly what was and wasn't confirmed |
| Compliance panel (points ledger, scam signals), Smart Map overlay layers | **Rule-based, explicitly labelled demo-only** | Derived only from the citizen's own seeded case data; map layers are labelled as a reference dataset, never presented as a live feed |
| Login | **Contact-number lookup, no password** | A deliberate demo convenience — real OTP/Aadhaar-linked auth needs the government's own identity verification APIs, not something to fake locally |
| Automated test suite | **None** | Verified this session via live, scripted browser walkthroughs (Playwright) and `tsc` type-checking across all three workspaces — real but manual/scripted verification, not a committed unit/integration suite |

## How this would work safely at real scale

1. **Data layer** — swap the in-memory repository for the already-defined Prisma/Postgres schema; the service method signatures were designed as a drop-in replacement.
2. **Auth** — replace contact-number-only login with real OTP/Aadhaar-linked authentication, which itself depends on a verified government identity API partnership — not something to simulate locally.
3. **Government integration** — `official_portal` services already link to the real Vahan/Sarathi/eChallan/PUCC URLs rather than faking them; production means a verified API partnership with MoRTH/NIC for the services that can be brought fully in-app, not scraping those systems.
4. **AI/voice** — point the existing OpenAI-compatible client at a real OpenAI key and model (a same-day change), and replace the hand-written knowledge base with a real embeddings-based RAG pipeline over a larger, regularly-refreshed corpus (state-specific fees, live SLAs, official notifications).
5. **Data privacy** — production must never store real Aadhaar/PAN/payment data without a full compliance review against India's DPDP Act; this prototype's synthetic-data-only stance is a deliberate placeholder for that discipline, not a shortcut around it.
6. **Reliability at load** — add real session storage (Redis), rate limiting, and horizontal scaling for the API, none of which matters at hackathon-demo scale but all of which are required before real traffic.
7. **Real per-service preview video** — the journey preview screen (steps, required info, estimated time) is real and static today; a short walkthrough video per service is a natural next step, out of scope for this build.

## Setup

```bash
npm install
# add JWT_SECRET (any random string) and GROQ_API_KEY to server/.env — see server/.env.example
npm run dev:server   # terminal 1
npm run dev:client   # terminal 2
```

Open the client and either sign in via the demo-user picker or sign up fresh (no password required, by design, for this prototype).

## UX audit — what was tested, what was found, what was fixed

Two passes were run against the live app before this submission, in this order:

**Pass 1 — real-browser QA.** The full citizen journey above was scripted end-to-end in a real Chromium browser (not just unit-tested), capturing a screenshot, all console errors, and all failed/slow network requests at every step. Two real defects surfaced this way and were fixed at the root cause, then re-verified by re-running the full script:
- After completing the guided flow, navigating to any other tab (e.g. Cases) left the page visually stuck on the completed flow instead of showing the new page's content — caused by the page-level route transition's exit animation occasionally failing to complete. Fixed by removing that animated wrapper in favor of direct rendering.
- The guided flow's own step-to-step transition used the same animation pattern and, on rarer occasions, briefly failed to advance to the next step on the first tap of "Continue" — same root cause, same fix, applied to the flow that matters most.

**Pass 2 — first-time-citizen UX pass.** The same journey was re-walked purely from the perspective of a first-time, possibly low-digital-literacy citizen on a phone, asking at every screen: is the next step obvious, is anything confusing or unexplained, does anything look broken or unfinished? This surfaced a more serious, previously-invisible issue: on a phone-width screen, the entire guided-flow page (the Journey Guide and the accident-report form itself) overflowed off the right edge of the screen, because the two-column layout had no defined single-column behavior below its desktop breakpoint — a CSS Grid default that let unshrinkable content push the whole primary journey out of view. The same latent defect was found and fixed across ten other layouts app-wide (the login screen, service catalog, dashboard, map, and AI assistant panel) before it could cause the same failure there. Two smaller, purely cosmetic issues were also fixed: the dashboard's decorative route illustration overlapped its own caption text at narrow widths, and the navigation bar's rightmost tab was abruptly clipped with no visual cue that it could be scrolled to.

**Pass 3 — the location handoff between Map and the guided flow.** A closer look at the Smart Mobility Map's "lock your location, then the guided report walks you through the rest" promise found it wasn't actually kept: the location detected there lived only in that page's own state and was silently dropped the moment "Start guided reporting" was clicked, so the citizen would hit the browser's location-permission prompt a second time and re-detect (or retype) something they'd already granted seconds earlier. Fixed by threading the detected location through into the guided flow's location field, pre-filled and labelled `(auto-detected)` — verified live end-to-end, and the full journey script re-run afterward to confirm nothing else regressed.

The one item none of these passes could fully verify is voice transcription accuracy itself (see the flow section above) — flagged honestly rather than assumed to work.

## Final verdict — is the primary journey genuinely smooth now?

Yes, for the core path: sign in → describe an accident → walk five short, plain-language, voice-and-tap-capable screens → submit → see it tracked with a deadline and a downloadable record. That path now runs with zero console errors, zero failed requests, and no dead ends across a full scripted run, on both desktop and phone-width viewports.

The one weakest point still open is exactly the one disclosed above: real acoustic voice transcription has been verified mechanically (permissions, listening state) but not acoustically (an actual spoken sentence turning into the right text) — automated testing cannot fully confirm this, and it needs a manual check with a real microphone before the demo is recorded. If time allows for exactly one more thing, that manual mic check is it; everything else in the flagship journey has been walked, broken, fixed, and re-verified rather than assumed.
