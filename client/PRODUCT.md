# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Indian citizens managing vehicle services, documents, compliance, and mobility-related cases. They need a clear, trustworthy way to understand their current status and take the right next action.

## Product Purpose

Parivahan Track combines service discovery, guided government-service workflows, case tracking, and mobility intelligence in one citizen-facing product.

## Positioning

It turns fragmented vehicle, case, and compliance records into contextual decision support while preserving the underlying service journey and source data.

## Operating Context

Users begin with the Intent Assistant, complete guided flows, then follow their cases and mobility status. Phase 3 adds an explicitly assistive agent, demo-only compliance checks, and multilingual voice transcription at the Intent Assistant boundary.

## Capabilities and Constraints

- The dark retheme (see Brand Commitments) is the new incumbent visual baseline and must not be reverted to the earlier light theme; further visual work builds on it rather than restyling from scratch.
- The Standing Agent may use only documented tool results; it has no direct database access.
- GPT-OSS 120B is served through the Groq OpenAI-compatible API.
- Compliance verification and scam intelligence are demo-only until official data sources are integrated.
- Multilingual speech-to-text uses Groq Whisper with the browser as the recording interface.

## Brand Commitments

A dark, calm, high-legibility product interface using amber (brand/warning), emerald (success), rose (danger/critical), and slate (neutral) status language — implemented across the client in this pass, correcting an earlier light-themed build that had drifted from this commitment.

## Evidence on Hand

Existing application implementation in this workspace and the supplied Phase 3 PRD / implementation-plan PDFs.

## Product Principles

- Decision support never obscures the source record.
- Automation is constrained, explainable, and clearly labelled when illustrative.
- A citizen can move from a spoken or typed need to a concrete service action.
- New intelligence extends the core loop instead of creating parallel data systems.

## Accessibility & Inclusion

Support multilingual input, keyboard interaction, reduced motion, and clear status/error recovery.
