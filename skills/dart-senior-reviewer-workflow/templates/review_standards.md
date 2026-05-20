# Senior Dart Code Review Standards

This document serves as the master reference for software architecture and quality standards for the Dart Senior Architect Reviewer. It combines universal principles, advanced architectural governance, and Dart-specific implementations. The reviewer must be extremely picky, rejecting any code that falls short of these rules.

---

## 1. Dart Idioms & Language Features

- **Effective Dart:** Code must adhere strictly to the [Effective Dart](https://dart.dev/effective-dart) guidelines (Style, Documentation, Usage, Design).
- **Null Safety:** Must use sound null safety correctly. Avoid the bang operator (`!`) unless absolutely certain and mathematically provable. Prefer `?` and `??`, or explicit null checks.
- **Immutability:** Use `const` for compile-time constants and `final` for single-assignment variables wherever possible. Classes representing state should generally be `@immutable`.
- **Collections:** Use collection if, collection for, and spreads (`...`) for declarative collection construction.
- **Asynchronous Code:** 
  - Prefer `async`/`await` over raw `.then()`.
  - Handle exceptions properly in async code using `try`/`catch`.
  - Do not use `async` if the function does not use `await` (unless required to satisfy an interface returning a Future).

---

## 2. Clean Code Principles

### **Meaningful Names**
*   **General Principle:** Names must reveal intent, be searchable, and avoid encodings. A name should answer why it exists, what it does, and how it is used without needing a comment.
*   **Dart Examples:**
    ```dart
    // 🔴 Bad: Vague name
    var d = 86400; 
    // 🟢 Good: Intent-revealing
    var secondsPerDay = 86400;

    // 🔴 Bad: Encoding type in name
    String sName = 'John';
    // 🟢 Good: Clean name
    String name = 'John';
    ```

### **Functions**
*   **General Principle:** Functions should be small, do exactly one thing, and have a minimal number of arguments (ideally 0-2). They should either change state (command) or return info (query), but never both.
*   **Dart Examples:**
    ```dart
    // 🟢 Good: Small, focused, single responsibility
    void sendWelcomeEmail(User user) {
      if (user.isValid) {
        _emailService.send(user.email, 'Welcome!');
      }
    }
    ```

### **Objects and Data Structures**
*   **General Principle:** Encapsulate internal structure. Do not create "train wrecks" by exposing complex object graphs.
*   **Dart Examples:**
    ```dart
    // 🔴 Bad (Train Wreck)
    user.getAccount().getProfile().getPhotoUrl();
    // 🟢 Good (Encapsulated)
    user.photoUrl;
    ```

### **Error Handling**
*   **General Principle:** Use exceptions for error handling to separate error-processing logic from the main business logic. Never return null for error states.
*   **Dart Examples:**
    ```dart
    // 🟢 Good: Explicit exception handling
    void process() {
      try {
        _doWork();
      } on NetworkException catch (e) {
        _handleError(e);
      }
    }
    ```

---

## 3. SOLID Principles

### **Single Responsibility Principle (SRP)**
*   **General Principle:** A class or module should have one, and only one, reason to change. It should be responsible to only one actor. Reject "god classes" or massive utility files.
*   **Dart Examples:**
    ```dart
    // 🟢 Good: Logic and Persistence are separated
    class UserProfile {
      void updateName(String name) { ... }
    }

    class UserPersistence {
      void save(UserProfile profile) { ... }
    }
    ```

### **Open-Closed Principle (OCP)**
*   **General Principle:** Software entities should be open for extension but closed for modification. Look for hardcoded conditionals that should be polymorphic.
*   **Dart Examples:**
    ```dart
    abstract class Shape {
      double calculateArea();
    }

    class Circle implements Shape {
      final double radius;
      Circle(this.radius);
      @override
      double calculateArea() => 3.14 * radius * radius;
    }
    ```

### **Liskov Substitution Principle (LSP)**
*   **General Principle:** Derived classes must be substitutable for their base types without affecting system correctness.
*   **Dart Examples:**
    ```dart
    void applyDiscount(Discount discount, double price) {
      print(discount.apply(price)); // Works for any implementation
    }
    ```

### **Interface Segregation Principle (ISP)**
*   **General Principle:** Clients should not be forced to depend on interfaces they do not use. Prefer small, focused interfaces/abstract classes.
*   **Dart Examples:**
    ```dart
    abstract class Workable {
      void work();
    }

    abstract class Feedable {
      void eat();
    }

    class Human implements Workable, Feedable {
      @override void work() { ... }
      @override void eat() { ... }
    }
    ```

### **Dependency Inversion Principle (DIP)**
*   **General Principle:** Depend on abstractions, not concretions. High-level modules should not depend on low-level details. Look for tightly coupled classes and suggest constructor injection.
*   **Dart Examples:**
    ```dart
    abstract class ILogger {
      void log(String message);
    }

    class Service {
      final ILogger logger; // Depends on abstraction
      Service(this.logger);
    }
    ```

---

## 4. Design Patterns

### **Creational Patterns**
*   **Singleton:** Ensure a class has only one instance and provide a global point of access to it.
*   **Factory Method:** Provide an interface for creating objects, but let subclasses decide which class to instantiate.

### **Structural Patterns**
*   **Adapter:** Convert the interface of a class into another interface clients expect.
*   **Decorator:** Attach additional responsibilities to an object dynamically.

### **Behavioral Patterns**
*   **Strategy:** Define a family of algorithms, encapsulate each one, and make them interchangeable.
*   **Observer:** Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified (e.g., Streams in Dart).

---

## 5. Advanced Architectural Principles (Fundamentals of Software Architecture)

### **Modularity & Coupling**
*   **Cohesion:** Aim for **Functional Cohesion** (related/essential parts). Flag **Coincidental Cohesion** (incidentally grouped).
*   **Coupling Metrics:** Monitor **Afferent (incoming)** and **Efferent (outgoing)** coupling.
*   **Distance from Main Sequence:** Balance implementation and abstraction. Avoid the **Zone of Pain** (no abstraction) and **Zone of Uselessness** (too abstract).
*   **Connascence:** Minimize coupling by following the **Rule of Degree** (convert strong connascence like Meaning to weak like Name) and **Rule of Locality** (stronger coupling only for closer elements).
*   **Law of Demeter:** Limit component knowledge of the rest of the system (Principle of Least Knowledge).

### **Component Integrity**
*   **Entity Trap Antipattern:** Avoid components tied directly to database entities (e.g., `UserManager`) that become "kitchen sink" dumping grounds.
*   **Single-Purpose Roles:** Components should have clear, distinct roles. If a responsibility statement needs "and", "also", or "in addition", it is likely doing too much.

### **Architectural Styles Constraints**
*   **Layered Architecture:** Maintain clear boundaries between Presentation, Domain, and Data layers. Domain should never import Presentation.
*   **State Management:** Ensure the chosen state management solution (e.g., Bloc, Riverpod, Provider) is used consistently and cleanly, without leaking UI logic into business logic or vice-versa.

### **Architectural Characteristics ("Ilities")**
*   **Priority:** Ensure non-domain capabilities (scalability, security, etc.) are not sacrificed for convenience.
*   **Cyclomatic Complexity (CC):** Monitor CC (target < 10, ideally < 5). Distinguish between **Essential Complexity** (domain problem) and **Accidental Complexity** (poor partitioning/brute force).

---

## 6. Test Code Standards

### **AAA Pattern**
*   **General Principle:** Structure tests into three distinct phases: **Arrange** (setup), **Act** (execution), and **Assert** (verification).
*   **Dart Examples:**
    ```dart
    void testCalculateTotal() {
      // 1. Arrange
      final cart = ShoppingCart();
      cart.add(Item(price: 10));

      // 2. Act
      final total = cart.total;

      // 3. Assert
      expect(total, equals(10));
    }
    ```

### **F.I.R.S.T. Principles**
*   **General Principle:** Tests must be **Fast**, **Independent**, **Repeatable**, **Self-Validating**, and **Timely**.
*   **Coverage & Isolation:** Every significant branch of logic must be tested. Tests must not depend on external state or the order of execution. Mock external dependencies. Reject any feature implementation that lacks tests.

---

## 7. Architectural Governance

### **Fitness Functions**
*   **Definition:** Automated mechanisms providing objective integrity assessments of architectural characteristics.
*   **Implementation:** Use tools (e.g., `dart analyze`, custom lint rules) to enforce layer isolation and detect cyclic dependencies.

---

## 8. Security & Data Integrity

### **Input Validation Hierarchy**
*   **General Principle:** Validate data in a strict 5-step hierarchy to protect resources.
    1. **Origin:** Is the sender legitimate?
    2. **Size:** Is it reasonably sized (prevent DoS)?
    3. **Lexical:** Right characters/encoding?
    4. **Syntax:** Is the format correct?
    5. **Semantics:** Does it make sense in the business context?
*   **Dart Example:**
    ```dart
    // 🟢 Good: Validation in constructor (Semantics)
    class Quantity {
      final int value;
      Quantity(this.value) {
        if (value < 0) throw ArgumentError('Quantity cannot be negative');
      }
    }
    ```

### **Domain Primitives**
*   **General Principle:** Replace generic types (`String`, `int`) with specialized, immutable value objects that enforce invariants on creation. If the object exists, it is valid.
*   **Dart Example:**
    ```dart
    // 🔴 Bad: Using raw String for sensitive data
    void process(String email) { ... }
    
    // 🟢 Good: Domain Primitive
    class Email {
      final String value;
      Email(this.value) {
        if (!_isValid(value)) throw FormatException('Invalid email');
      }
      static bool _isValid(String v) => ...;
    }
    ```

### **Data Protection & Privacy**
*   **Verbatim Echoing:** Never echo raw input into logs or error messages (prevents XSS/Injection).
*   **Read-Once Objects:** For highly sensitive data (passwords, tokens), clear the value from memory immediately after its first use.
*   **Separation of Exceptions:** Separate Business Exceptions (domain rule violations) from Technical Exceptions (leaking system internals).
*   **Principle of Least Privilege:** Ensure components only have access to the data and APIs they strictly need.

### **Cryptography**
*   **No Roll-Your-Own:** Never implement custom crypto logic. Use peer-reviewed libraries (e.g., `package:tink`).

---

## Output Format Enforcement
**STRICT MANDATE:** The reviewer is strictly required to output issues mapped to these standards as actionable **bullet points only**. Do not lecture the user; provide the File/Line, the Issue (citing the relevant standard from this document), and the exact Fix.
