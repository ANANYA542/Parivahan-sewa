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

## Phase 1 API

- `GET /v1/health`
- `GET /v1/users/:userId/identity`
- `GET /v1/services`
- `POST /v1/intents/resolve`
- `GET /v1/workflows/:serviceId`
- `GET /v1/users/:userId/cases`
- `GET /v1/cases/:caseId`
- `POST /v1/cases`
- `GET /v1/users/:userId/mobility-intelligence`
- `POST /v1/users/:userId/mobility-intelligence/refresh`
- `GET /v1/users/:userId/mobility-map`
- `GET /v1/users/:userId/notifications`

The API uses a seeded in-memory repository in development so the core loop is immediately runnable. The Prisma schema and idempotent seed command are included for the PostgreSQL adapter: run `npm run prisma:generate --workspace @parivahan/server`, migrate, then seed before replacing the development repository in deployment configuration.

The seed dataset contains synthetic users, vehicle profiles, document states, and case histories only. The service catalog mirrors Parivahan's official public service groupings. Only entries marked `guided` are completed within this application; `official_portal` entries link users to the relevant Parivahan flow because eligibility, documents, and state/RTO availability vary by service.

See `docs/service-catalog.md` for catalog maintenance guidance and official source pages.

## Phase 2 intelligence

The Mobility Intelligence Layer is read-only over the Phase 1 identity bundle. It refreshes a rule-based score, compliance alerts, map layers, and notification nudges on an in-process five-minute interval and recomputes a snapshot when the user requests it. Map reference features are explicitly labelled `reference-dataset`; replace them with verified official black-spot and PUC sources before production use. Case-history features are derived only from the user's own seeded case data and the map is not a live traffic or sensor feed.

## Next steps

1. Run `npm install` at the repository root.
2. Run `npm run dev:server` and `npm run dev:client` in separate terminals.
3. The development identity is `user-001`; it is seeded in the in-memory repository for the Phase 1 demo flow.
4. Run Prisma migrations and replace the repository adapter with Prisma before deploying. The API validates input and ownership, but the current demo data is intentionally process-local.
