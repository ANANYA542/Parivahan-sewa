# Product

## Platform

web

## Users

The general public: car owners, truck drivers, bus operators, learners, new applicants, and any individual who needs access to Parivahan Seva services. RTOs, dealers, and manufacturers are not primary users; the product reaches their systems only through existing government services or future external handoffs.

## Product Purpose

Parivahan Journey Platform makes government transport services easier to discover and complete. It replaces fragmented portal navigation and static forms with a guided, intuitive journey through mobility services. Success means a citizen can understand what to do next and progress through a transport task with less confusion.

## Positioning

A universal public access layer that treats a transport task as a guided journey with checkpoints, rather than requiring citizens to understand government portal structure before they can begin.

## Operating Context

Visitors can explore services from a public homepage, use intent-based assistance to describe what they need, and sign in to see active applications, status tracking, recommended actions, and mobility features. Core service flows use a journey/checkpoint model with progressive disclosure. Post-login features remain modular while sharing one design language.

## Capabilities and Constraints

- The current hackathon prototype uses mock data only.
- It must not collect or store real personally identifiable information.
- It has no direct integration with official government APIs or databases.
- Future production work may add secure official-system integrations, real-data safeguards, authentication, and verification.
- AI assistance acts as a process navigation guide: it interprets intent, explains steps, and guides the user through execution rather than functioning as a generic chatbot.

## Brand Commitments

- Product name: Parivahan Journey Platform.
- The experience should feel like a guided travel journey through mobility services, not a traditional form-based system.
- Services should be visually discoverable, use road and moving-car metaphors where appropriate, and maintain motion, continuity, and clarity.

## Evidence on Hand

- The working React client, NestJS API, shared domain models, and synthetic seed data are in this repository.
- `docs/service-catalog.md` records the official service-directory sources used for the prototype catalog.
- No real customer data, testimonials, government API access, or verified real-time mobility feeds are available. Future work must not fabricate them.

## Product Principles

- Journey first: express each service as a navigable sequence of meaningful checkpoints.
- Progressive interaction: surface only the information and choices relevant to the current step.
- Intent over portal literacy: let people describe their need in plain language before mapping it to a service.
- Low cognitive load: reduce clutter and make the next action obvious.
- One companion, many tasks: keep discovery, guided completion, tracking, and mobility insights coherent across the product.

## Accessibility & Inclusion

- The platform serves a broad public audience, including learners and commercial-vehicle operators.
- Interactions must remain clear on desktop and mobile web, support keyboard operation, and respect reduced-motion preferences.
- Future language and voice support should preserve the same guided workflows rather than creating separate experiences.
