# HTML Architecture Review Report Scaffold

Architecture review reports are generated as standalone, self-contained HTML documents written to the OS temp directory (`$TMPDIR` or `/tmp/architecture-review-<timestamp>.html`) and opened for the user (`open <path>`).

## Technologies:
- **Tailwind CSS:** Loaded via CDN (`https://cdn.tailwindcss.com`) for modern, dark-mode/light-mode styling.
- **Mermaid.js:** Loaded via CDN (`https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js`) for before/after architecture graphs and sequence diagrams.

---

## Report Structure Template

```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codebase Architecture & Deepening Review</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-8 font-sans">
  <div class="max-w-5xl mx-auto space-y-8">
    <header class="border-b border-slate-800 pb-6">
      <h1 class="text-3xl font-bold tracking-tight text-white">🏗️ Codebase Architecture Review</h1>
      <p class="text-slate-400 mt-2">Deepening opportunities, seam analysis, and AI-navigability improvements.</p>
    </header>

    <!-- Top Recommendation -->
    <section class="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-6">
      <div class="flex items-center space-x-3 mb-2">
        <span class="px-3 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-full uppercase tracking-wider">Top Recommendation</span>
        <h2 class="text-xl font-bold text-indigo-200">[Candidate Title]</h2>
      </div>
      <p class="text-slate-300">[Summary of highest-impact deepening refactor and expected leverage.]</p>
    </section>

    <!-- Candidates List -->
    <div class="space-y-6">
      <!-- Candidate Card -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
        <div class="flex justify-between items-start">
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Strong</span>
            <h3 class="text-xl font-semibold text-white mt-2">[Candidate 1: Deepen Feature Module]</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono">lib/src/features/...</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="p-4 bg-slate-950/50 rounded-lg border border-red-500/20">
            <h4 class="font-semibold text-red-400 mb-1">❌ Current Problem (Shallow Module / Friction)</h4>
            <p class="text-slate-300">[Description of shallowness, scattered logic, or difficult testability]</p>
          </div>
          <div class="p-4 bg-slate-950/50 rounded-lg border border-emerald-500/20">
            <h4 class="font-semibold text-emerald-400 mb-1">✅ Proposed Solution (Deepened Interface)</h4>
            <p class="text-slate-300">[Description of unified interface, hidden complexity, and enhanced locality]</p>
          </div>
        </div>

        <!-- Before / After Visuals (Mermaid) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h5 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Before: Shallow & Coupled</h5>
            <div class="mermaid">
              graph TD
                Caller --> A[Helper 1]
                Caller --> B[Helper 2]
                Caller --> C[Helper 3]
                A --> DB
                B --> DB
            </div>
          </div>
          <div class="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h5 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">After: Deep Module</h5>
            <div class="mermaid">
              graph TD
                Caller --> Unified[Deep Module Interface]
                subgraph Implementation
                  Unified --> A[Internal Part A]
                  Unified --> B[Internal Part B]
                end
                Implementation --> Port[Storage Port]
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```
