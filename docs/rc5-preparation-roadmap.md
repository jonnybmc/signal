# RC5 preparation roadmap

Status: implementation complete; PR72 documentation reconciliation and normal merge authorized. No release date, version bump or npm publication approved.
Baseline: `8185b8460297f953df727af93e8f5c5c7f6c204d` (verified GitHub main).
SDK baseline: `0.1.0-rc.4`; private workspace version: `0.1.0`.

1. Measurement correctness: snapshot lifecycle entry context/path, preserve restore/prerender scope, implement maximum CLS session windows and observable zero, correct bounded INP outlier rank and interaction counting. Add regressions. Reconcile the narrow dependency security fixes without the separate major toolchain migration.
2. Report delivery: recover from URL encoding failures, invalidate edited outputs, create a dedicated offline evidence brief from an allowlisted aggregate projection. Prefer original JSON, disclose URL fidelity limits, support explicit site labels, escape all output, include coverage and limitations, print styling and engineering handoff. No live-page serialization, scripts, telemetry, forms, storage, network, or new dependencies.
3. Documentation and release preparation: correct privacy/sampling claims, add opt-in path normalization if compatible, route prereleases to npm `next` and stable to `latest`. Run lint, types, unit, build, budgets, boundaries, export/pack checks, `test:cli:pack`, and available browser checks. Record unavailable BigQuery, framework, package-manager, and Node-version gates honestly.

Constraints: preserve original checkout/user changes; work on `codex/rc5-evidence-preparation` in an isolated checkout. Initial scope prohibited remote changes; later user approval authorized pushing PR72 and then normal merge after documentation reconciliation. Publication, scheduling, new hosted environments and Signal runtime dependency additions remain outside this scope. The later user approval permits isolated test-only runtimes, browsers, image QA tooling, and fresh framework fixtures; it does not permit credentials or access creation. No causal/revenue claims. No release readiness claim until manual gates pass.


Implementation complete locally; validation and unresolved gates are recorded in
[rc5-validation.md](./rc5-validation.md). The SDK remains rc.4 until a release
version and date are approved. The branch is published as [PR72](https://github.com/jonnybmc/signal/pull/72). BigQuery validation was accepted for that merge only; it remains unrun. See the validation record and PR for final CI/merge status.
