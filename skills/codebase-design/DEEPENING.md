# Deepening Modules & Dependency Strategies

Deepening is the process of refactoring a cluster of shallow modules into a cohesive, deep module.

## 1. Dependency Categories

When assessing a candidate module for deepening, classify its external dependencies:

### Category 1: In-Process
- Pure business logic, calculation, data manipulation, in-memory state.
- **Deepening Strategy:** Merge shallow helpers/classes directly behind the new module interface. No adapter required.

### Category 2: Local-Substitutable
- Dependencies with lightweight in-memory or embedded test stand-ins (e.g. in-memory SQLite/Drift, mock storage).
- **Deepening Strategy:** Test directly against the local stand-in. The seam is internal; callers only see the unified module interface.

### Category 3: Remote Owned (Ports & Adapters)
- Internal services, backend microservices, database servers you own.
- **Deepening Strategy:** Define a clean **Port** (interface) at the seam. The deep module contains domain logic; provide an HTTP/gRPC/Database adapter for production, and an in-memory fake adapter for tests.

### Category 4: True External (Mock)
- Third-party SaaS APIs (Stripe, Twilio, Apple IAP, Firebase).
- **Deepening Strategy:** Inject an interface at the boundary. Provide production SDK adapter and test mock adapter.

---

## 2. Seam Discipline
- **Two-Adapter Rule:** "One adapter means a hypothetical seam; two adapters means a real seam." Do not introduce complex interface indirections unless you actually have at least two implementations (e.g. Production + Test fake).
- **Internal vs External Seams:** A deep module may have internal private seams for sub-parts, but its public interface remains minimal and unified.

---

## 3. Testing Strategy: Replace, Don't Layer
- Old unit tests on shallow intermediate helpers become obsolete when the deepened module interface is tested. **Delete obsolete micro-tests.**
- Write robust behavioral tests at the deepened module's interface ("The interface is the test surface").
- Tests should describe observable outcomes and survive internal refactoring without breaking.
