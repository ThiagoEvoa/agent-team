# Dart Frog Architecture Standard

## 📁 Project Structure
```text
/
├── .dart_frog/          # Internal build artifacts
├── public/              # Static assets
├── routes/              # API Routes (File-system based)
│   ├── _middleware.dart # Global middleware
│   ├── index.dart       # /
│   └── api/
│       ├── _middleware.dart # Scoped middleware
│       └── v1/
│           ├── users/
│           │   ├── [id].dart   # /api/v1/users/:id
│           │   └── index.dart  # /api/v1/users
├── lib/                 # Shared logic, models, repositories
│   ├── src/
│   │   ├── models/
│   │   ├── repositories/
│   │   └── services/
└── test/                # Unit and Integration tests
```

## 🛤️ Routing Principles
- **Dynamic Routes:** Use `[id].dart` for path parameters.
- **Index Routes:** Use `index.dart` for root of a directory.
- **Methods:** Check `context.request.method` to handle GET, POST, etc., in a single file.

## 💉 Dependency Injection
- Use `provider` middleware to inject dependencies.
- Inject at the highest scope possible.
- **Access:** `final repository = context.read<MyRepository>();`

## 🛠️ CLI Operations
- **New Route:** `dart_frog new route "/users/[id]"`
- **New Middleware:** `dart_frog new middleware "/api"`
- **Dev Server:** `dart_frog dev`
- **Build:** `dart_frog build`
