# DiffSense Versioning & Stability

**Goals:** predictable releases, easy bisecting, clear expectations for contributors and users.

## Versioning model

* **Lockstep SemVer across all `@diffsense/*` packages.** One version for the whole suite.
* **Pre‑1.0 (`0.y.z`)**
  * `0.y+1.0` (**minor**) may include breaking changes.
  * `0.y.z+1` (**patch**) = bugfixes only.
* **Post‑1.0**
  * **major** = breaking changes
  * **minor** = backward‑compatible features
  * **patch** = bug fixes / docs / tooling only

## Release cadence & tags

* **Milestone releases:** tag each micro‑milestone (`v0.2.0` = Time Capsule, `v0.3.0` = Quick Verdict, …).
* **Prereleases:** `1.0.0-beta.1`, `1.0.0-beta.2`, … (npm dist‑tag `beta`).
* **Canaries (optional):** `next` tag (e.g., `2.1.0-next.0`) for early adopters.

## What is “breaking” in DiffSense?

Treat any incompatible change in these surfaces as breaking:

* **CLI UX:** flag names, defaults, exit code semantics.
* **Result artifacts:** `SuiteRunResult` / `ScenarioRunResult` shapes; filenames and layout under `runs/`.
* **Plugin contracts:** `Runner`, `Evaluator`, and public types in `@diffsense/types`.
* **Scenario schema & loader:** required fields; resolution rules; naming conventions.
* **Config/env:** config file schema; env var names/semantics.
* **Public imports:** renamed/removed exports or package entry points.

**Usually non‑breaking:** adding optional fields; adding new files under `runs/`; new CLI flags default‑off; internal refactors.

## Stability markers (communicate intent)

Use JSDoc on exported APIs:

```ts
/** @stability stable */
export interface SuiteRunResult { /* … */ }

/** @stability experimental */
export interface FancyNewEvaluatorOptions { /* … */ }

/** @stability deprecated – use `runSuiteV2` */
export function runSuiteLegacy(/* … */) {}
```

## Schema & format versions (future‑proof artifacts)

Embed explicit versions to allow painless evolution:

```jsonc
// results.json
{
  "schemaVersion": 1,
  "suiteId": "toy",
  "results": [ /* … */ ],
  "summary": { /* … */ }
}

// manifest.json
{ "formatVersion": 1, /* … */ }
```

If you change shapes or file layout, bump the version and (optionally) ship a tiny migrator for old runs.

## Deprecation policy

* **Pre‑1.0:** mark deprecated, note in CHANGELOG, keep for ≥1 minor before removal.
* **Post‑1.0:** deprecate in a minor, remove in the next major.
* Emit a one‑line runtime warning for deprecated flags/APIs; allow opt‑out via `DIFFSENSE_NO_DEPRECATION_WARNINGS=1`.

## Lightweight release flow

* Each PR that changes user‑visible behavior includes a **changeset**.
* On main: run versioning + publish from CI or manually to generate tags and dist‑tags.

### Changesets config (lockstep)

Root `.changeset/config.json`:

```json
{
  "baseBranch": "main",
  "changelog": "@changesets/cli/changelog",
  "commit": true,
  "fixed": [["@diffsense/*"]],
  "privatePackages": { "version": true, "tag": true },
  "updateInternalDependencies": "patch"
}
```

Scripts in root `package.json`:

```json
{
  "scripts": {
    "changeset": "changeset",
    "prerelease:enter": "changeset pre enter beta",
    "prerelease:exit": "changeset pre exit",
    "tag": "changeset tag",
    "version": "changeset version && npm run build"
  }
}
```

### Day‑to‑day

```bash
npx changeset                # create a bump entry
npm run version

# Betas
npm run prerelease:enter
# …land changesets…
npm run version
npm run prerelease:exit
```

### Release steps

```bash
# 1) Collect changes during development (one per PR)
npx changeset

# 2) When you’re ready to cut a release
npm run version      # bumps versions + writes CHANGELOGs + commits
npm run tag          # creates git tags for the bumped versions
git push && git push --tags

# 3) If you want a GitHub Release object
gh release create v0.2.0 --generate-notes
```

## PR checklist (paste into template)

* [ ] Public surface changed (CLI/results/types/config/loader)?
* [ ] If **breaking**, is bump level correct (pre‑1.0: **minor**, post‑1.0: **major**)?
* [ ] JSDoc `@stability` annotations updated?
* [ ] `schemaVersion` / `formatVersion` bumped if artifact shapes changed?
* [ ] Deprecation notice added (CHANGELOG + runtime warning if applicable)?
* [ ] Changeset included.

## Glossary

* **Schema version** – version of a JSON structure (e.g., `results.json`).
* **Format version** – version of a container/manifest layout (e.g., directory or `manifest.json`).
* **Dist‑tag** – npm channel label (`latest`, `beta`, `next`).
