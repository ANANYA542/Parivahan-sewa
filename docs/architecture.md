# Architecture Notes

This repository is organized around the PRD's four core layers:

1. User interface
2. Core system logic
3. Data layer
4. External and government systems

The initial build keeps the PRD's core entities small:

- User
- Vehicle
- Case
- Service

The mobility intelligence layer is treated as a read-side layer over the same core records.

## Phase 2 read-side pipelines

`MobilityIntelligenceService` reads the identity bundle through `CoreDataService` and produces one cached snapshot per user. The snapshot contains a rule-based mobility score, compliance alerts, five map overlay layers, and proactive nudges. It does not mutate User, Vehicle, Case, or Service records.

The server refreshes snapshots every five minutes and on request. The current cache is process-local for the prototype; deploy it as a Redis/BullMQ worker when the API runs across multiple instances.
