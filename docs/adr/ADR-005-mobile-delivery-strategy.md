# ADR-005: Mobile Delivery Strategy (Responsive PWA First, React Native / Expo Phase 4)

## Status

Accepted

## Context

The platform requires mobile access for residents (approving visitors, paying bills, filing complaints), security guards (gate visitor logging, scanning passes), and facility workers (accepting tasks, recording attendance). Launching native iOS and Android apps across 3 distinct persona apps from Day 1 introduces significant store review delays, cross-platform build pipeline overhead, and premature complexity.

## Decision

1. **Phases 1 to 3: Responsive Progressive Web Apps (PWA)**:
   - Provide responsive, touch-optimized PWA interfaces tailored to each persona (Resident, Guard, Worker) delivered through `apps/web`.
   - Implement large-button, low-bandwidth touch UX for guards and workers.
   - Include client-side mutation retry queues and offline-ready service workers.
2. **Phase 4+: Dedicated Native Mobile Apps**:
   - Introduce React Native with Expo in Phase 4 (`apps/mobile`), starting with Android for security guards and facility workers, followed by resident mobile apps.
   - Consume existing backend APIs seamlessly through the generated TypeScript OpenAPI client.

## Consequences

- **Positive**: Rapid feature iteration, zero app store review delays during initial pilot phases, single frontend codebase for web and mobile surfaces, unified session management.
- **Negative**: Native device hardware integrations (e.g. background Bluetooth, advanced offline biometric sync) are deferred to Phase 4+.
