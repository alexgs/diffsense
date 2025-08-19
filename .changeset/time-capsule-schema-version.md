---
"@diffsense/cli": minor
"@diffsense/harness": minor
"@diffsense/types": minor
"@diffsense/evaluators": minor
"@diffsense/runners": minor
---

Add explicit `schemaVersion` to `results.json` and `formatVersion` to `manifest.json`. Producers set
`RESULTS_SCHEMA_VERSION=1` and `MANIFEST_FORMAT_VERSION=1`. Readers can use these to support
forward/backward-compatible parsing.
