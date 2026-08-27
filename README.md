# Parivahan Track

Project scaffold for the Parivahan Track PRD and system design.

## What is here

- `client`: React + TypeScript frontend for My Vahan, Intent Assistant, Guided Navigator, and case tracking.
- `server`: NestJS API for the Phase 1 identity, intent, workflow, and case endpoints.
- `packages/shared`: shared types and constants for frontend/backend parity.
- `server/prisma`: core data model for User, Vehicle, Case, and Service.
- `docker-compose.yml`: local Postgres and Redis.

## PRD-aligned structure

- Phase 1: identity, intent, guided workflows, submission, case creation, and tracking.
- Phase 2: compliance alerts, health score, smart map data, and extended mobility intelligence.
- Phase 3: standing agent, nudging, voice, and regional language support.
  - **Ideation — Vehicle Breakdown Assistance:** a real-time "Vehicle Breakdown" button connecting stranded motorists to verified local mechanics or towing services.
    - Model: the platform acts as an aggregator over existing private roadside-assistance (RSA) providers and local garages rather than operating a mechanic fleet directly — similar in shape to how ONDC or IRCTC's food-delivery integration aggregates third-party operators.
    - Potential value: standardised, capped pricing so drivers aren't overcharged in an emergency; safer response for women and families stranded at night via government-verified responders; reach into remote highway stretches by leveraging NHAI patrol networks; faster, more accurate dispatch using the RC/insurance details already on file in this app.
    - Open questions before this gets scoped: real-time dispatch logistics (a known weak point for government-run systems, which is why the aggregator model is preferred over direct fleet management); mechanic quality control and a rating/verification system; and clear liability disclaimers for vehicle damage or delay caused by a dispatched third-party mechanic.
    - Not part of Phase 1/2 — captured here as a future idea, not a committed scope item.

## Phase 1 API

- `POST /v1/auth/login` — sign in by contact number (demo login: contact lookup only, no password, since the seed data has none). Returns a JWT + user profile.
- `GET /v1/auth/demo-users` — public directory of seeded demo identities, for a "sign in as" picker.
- `GET /v1/health`
- `GET /v1/users/:userId/identity` — bearer token required; the token's user must match `:userId`.
- `GET /v1/services`
- `POST /v1/intents/resolve`
- `GET /v1/workflows/:serviceId`
- `GET /v1/users/:userId/cases` — bearer token required, ownership enforced.
- `GET /v1/cases/:caseId` — bearer token required; 403 if the case isn't the caller's.
- `POST /v1/cases` — bearer token required. `userId` is taken from the token, never from the request body; only `guided` services can open a case (an `official_portal` service returns 400).
- `POST /v1/cases/:caseId/escalate` — bearer token required, ownership enforced; 400 if the case is already `resolved`/`rejected`.
- `GET /v1/cases/:caseId/document` — bearer token required, ownership enforced; streams a PDF acknowledgement of the submission (not an official government document).
- `GET /v1/users/:userId/mobility-intelligence`
- `POST /v1/users/:userId/mobility-intelligence/refresh`
- `GET /v1/users/:userId/mobility-map`
- `GET /v1/users/:userId/notifications` — bearer token required. Merges mobility nudges with case SLA reminders and tracks read state.
- `POST /v1/users/:userId/notifications/:notificationId/read`
- `POST /v1/users/:userId/standing-agent`
- `GET /v1/users/:userId/compliance`
- `GET /v1/cases/:caseId/challan-verification`
- `POST /v1/voice/transcribe`

Every route above other than login/demo-users/health/services/workflows/intents requires `Authorization: Bearer <token>` from `POST /v1/auth/login`. Set `JWT_SECRET` in `server/.env` (see `.env.example`); without it the server falls back to a development-only secret and logs a warning.

The API uses a seeded in-memory repository in development so the core loop is immediately runnable. The Prisma schema and idempotent seed command are included for the PostgreSQL adapter: run `npm run prisma:generate --workspace @parivahan/server`, migrate, then seed before replacing the development repository in deployment configuration.

**Note on request validation:** this project runs its dev server under `tsx`/esbuild, which does not emit TypeScript's `design:paramtypes` metadata. NestJS's built-in `ValidationPipe` relies on that metadata to know which DTO class to validate a `@Body()` payload against — under esbuild it silently no-ops instead of validating. Every `@Body()` handler in this app uses the `validateBody()` pipe factory in `server/src/common/validate-body.pipe.ts` instead, which takes the DTO class explicitly rather than relying on reflection. Apply the same pattern to any new `@Body()` parameter you add.

The seed dataset contains synthetic users, vehicle profiles, document states, and case histories only. The service catalog mirrors Parivahan's official public service groupings. Only entries marked `guided` are completed within this application; `official_portal` entries link users to the relevant Parivahan flow because eligibility, documents, and state/RTO availability vary by service.

See `docs/service-catalog.md` for catalog maintenance guidance and official source pages.

## Phase 2 intelligence

The Mobility Intelligence Layer is read-only over the Phase 1 identity bundle. It refreshes a rule-based score, compliance alerts, map layers, and notification nudges on an in-process five-minute interval and recomputes a snapshot when the user requests it. Map reference features are explicitly labelled `reference-dataset`; replace them with verified official black-spot and PUC sources before production use. Case-history features are derived only from the user's own seeded case data and the map is not a live traffic or sensor feed.

## Phase 3 agent, compliance, and voice

Set `GROQ_API_KEY` in the server environment to enable the Standing Agent and multilingual voice transcription. The agent calls Groq's OpenAI-compatible `openai/gpt-oss-120b` model and is constrained to the documented tool surface; it never has direct access to the data store. Voice recordings are sent to Groq's `whisper-large-v3-turbo` transcription endpoint only after the user starts and stops recording in the browser.

The compliance panel, challan verifier, and safety-points ledger are deliberately labelled demo-only. They use the seeded Case data and direct users to the official eChallan portal for verification and payment; no government registry is queried by this prototype.

## Next steps

1. Run `npm install` at the repository root.
2. Add a `JWT_SECRET` line to `server/.env` (any long random string; `.env` is gitignored so this stays local — see `.env.example`).
3. Run `npm run dev:server` and `npm run dev:client` in separate terminals.
4. Open the client and sign in — the login screen lists the seeded demo identities (`user-001` "Ananya Sharma" and five others) as one-click "sign in as" options, or sign in manually with a seeded contact number (e.g. `+91-90000-00001`).
5. Run Prisma migrations and replace the repository adapter with Prisma before deploying. The API validates input, ownership, and request bodies, but the current demo data is intentionally process-local.
