# Flutter Pubspec & Linting Standards

Ensures consistency across workspace packages.

## 1. Mandatory Linting
All packages MUST use `flutter_lints` or `very_good_analysis`.
- **analysis_options.yaml:** Must enable `always_use_package_imports: true`.

## 2. Golden Dependencies
Prefer these packages for consistency:
- **Data:** `dio`, `json_annotation`, `freezed_annotation`.
- **Logic:** `bloc`, `flutter_bloc`, `equatable`.
- **Testing:** `mocktail`, `bloc_test`.

## 3. Workspace Rules (fws)
- **New Projects:** Always create using `fws create`.
- **Version Pinning:** Use caret syntax (`^`) but avoid `any`.
- **Internal Deps:** Local package dependencies must use `path:` references.
