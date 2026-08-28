# Senior Dart Code Review Standards

Master reference for software architecture and quality. The reviewer must strictly enforce these standards.

---

## 1. Dart Idioms & Language Features
- **Effective Dart:** Adhere strictly to Style, Documentation, Usage, and Design guidelines.
- **Null Safety:** Sound null safety. Avoid `!` unless provably safe. Prefer `?`, `??`, or explicit null checks.
- **Immutability:** Use `const` for compile-time constants, `final` for single-assignment variables. State classes must be `@immutable`.
- **Collections:** Use collection if, collection for, and spreads (`...`).
- **Asynchronous Code:** Prefer `async`/`await` over `.then()`. Handle exceptions with `try`/`catch`. Do not use `async` without `await`.

---

## 2. Clean Code Principles
- **Meaningful Names:** Names must reveal intent, be searchable, and avoid encodings.
- **Functions:** Small, single-responsibility, minimal arguments (0-2). Do commands (state change) or queries (return value), never both.
- **Encapsulation:** Do not expose complex object graphs (avoid train wrecks like `a.getB().getC()`).
- **Error Handling:** Use exceptions instead of returning null for error states.

---

## 3. SOLID Principles
- **SRP (Single Responsibility):** A class/module should have one reason to change. Reject god classes or massive utilities.
- **OCP (Open-Closed):** Open for extension, closed for modification. Avoid hardcoded conditionals that should be polymorphic.
- **LSP (Liskov Substitution):** Derived classes must be substitutable for base types.
- **ISP (Interface Segregation):** Small, focused interfaces. Do not force clients to depend on unused methods.
- **DIP (Dependency Inversion):** Depend on abstractions. Use constructor injection.

---

## 4. Design Patterns
- **Creational:** Singleton, Factory Method.
- **Structural:** Adapter, Decorator.
- **Behavioral:** Strategy, Observer (e.g. Streams).

---

## 5. Advanced Architectural Principles
- **Modularity:** High cohesion (functional). Low coupling. Balance implementation and abstraction (Main Sequence).
- **Connascence:** Minimize coupling (Rule of Degree & Locality).
- **Law of Demeter:** Limit component knowledge of rest of system.
- **Component Integrity:** Avoid tying components directly to database entities (Entity Trap). Roles must be single-purpose.
- **Style Constraints:** Layered boundaries (Presentation -> Domain -> Data). Consistent state management (Bloc, Riverpod, etc.).
- **Cyclomatic Complexity:** CC < 10 (target < 5). Minimize accidental complexity.

---

## 6. Test Code Standards
- **AAA Pattern:** Structure tests clearly into Arrange (setup), Act (execute), and Assert (verify).
- **F.I.R.S.T.:** Fast, Independent, Repeatable, Self-Validating, Timely. Mock external dependencies. Reject untested features.

---

## 7. Architectural Governance
- **Fitness Functions:** Custom lints and analyzer checks (`dart analyze`) to enforce isolation and prevent cyclic deps.

---

## 8. Security & Data Integrity
- **Input Validation Hierarchy:** Validate: 1. Origin (sender), 2. Size (prevent DoS), 3. Lexical, 4. Syntax, 5. Semantics.
- **Domain Primitives:** Replace raw types (`String`, `int`) with specialized immutable value objects validating invariants on creation.
- **Data Protection:** No verbatim echoing of inputs in logs/errors. Clear sensitive values (passwords, tokens) from memory immediately after use. Separate Business and Technical exceptions. Least privilege access.
- **Cryptography:** No custom crypto. Use peer-reviewed libraries (e.g., `package:tink`).

---

---

## 9. Fowler Code Smells Baseline
A mandatory baseline of code smells (*Refactoring*, ch.3) evaluated as judgement calls across diffs:
- **Mysterious Name:** A function, variable, or type whose name doesn't reveal what it does or holds. -> *Fix: Rename with intent; if no honest name comes, the design is murky.*
- **Duplicated Code:** The same logic shape appears in more than one hunk or file. -> *Fix: Extract the shared shape and call from both sites.*
- **Feature Envy:** A method reaches into another object's data more than its own. -> *Fix: Move the method onto the data it envies.*
- **Data Clumps:** The same few fields or parameters keep traveling together. -> *Fix: Bundle them into a dedicated immutable value object/class.*
- **Primitive Obsession:** A primitive type (`String`, `int`) standing in for a domain concept. -> *Fix: Wrap with a domain primitive/value object.*
- **Repeated Switches:** The same `switch` or `if`-cascade on the same type/enum recurs. -> *Fix: Replace with polymorphism or sealed class pattern matching in one shared site.*
- **Shotgun Surgery:** One logical change forces scattered edits across many files. -> *Fix: Gather what changes together into one cohesive deep module.*
- **Divergent Change:** One class/module is modified for several unrelated reasons. -> *Fix: Split so each module changes for a single reason (SRP).*
- **Speculative Generality:** Abstractions, parameters, or hooks added for speculative needs not in spec. -> *Fix: Delete or inline until a real requirement exists (YAGNI).*
- **Message Chains:** Long chained walks (`a.b().c().d()`) that expose internal graphs. -> *Fix: Hide navigation behind a single intent-revealing method (Law of Demeter).*
- **Middle Man:** A class or function that mostly just delegates onward with zero value. -> *Fix: Cut the middleman; invoke the target directly.*
- **Refused Bequest:** A subclass that ignores or throws on most inherited behavior. -> *Fix: Replace inheritance with composition.*

---

## Two-Axis Review Output Format
Reviews MUST be reported along two independent axes without merging or cross-ranking:

```markdown
## 📋 Standards Axis
- **Violations & Hard Breaches:**
  - `[File: Line]` **Violation:** [Documented repo standard breach]. **Fix:** [Specific fix].
- **Code Smells (Judgement Calls):**
  - `[File: Line]` **Smell:** [Name of Fowler smell e.g. Data Clumps]. **Fix:** [Refactoring suggestion].
- **Compiler & Analyzer:**
  - `[File: Line]` **Issue:** `dart analyze` / `dart format` finding. **Fix:** [Action].

## 🎯 Spec Axis
- **Missing / Incomplete Requirements:**
  - `[Spec Reference]` **Missing:** [Requirement asked for in spec but missing in diff].
- **Scope Creep / Unrequested Behavior:**
  - `[File: Line]` **Scope Creep:** [Behavior added that was not requested in spec].
- **Incorrect Spec Implementation:**
  - `[File: Line]` **Defect:** [Implementation does not match spec intent]. **Fix:** [Correction].

## Summary
- **Standards Axis:** [X] findings (Worst: [Brief summary or None])
- **Spec Axis:** [Y] findings (Worst: [Brief summary or None])
```

