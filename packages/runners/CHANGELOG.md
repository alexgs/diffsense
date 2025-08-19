# @diffsense/runners

## 0.2.0

### Minor Changes

- 3f9648a: DS-10 ("Time Capsule")
  - Save run output to a timestamped directory
  - Add explicit `schemaVersion` to `results.json` and `formatVersion` to `manifest.json`.
  - Producers set `RESULTS_SCHEMA_VERSION=1` and `MANIFEST_FORMAT_VERSION=1`.
  - Readers can use these to support forward/backward-compatible parsing.

### Patch Changes

- Updated dependencies [3f9648a]
  - @diffsense/types@0.2.0

## 0.1.0

### Minor Changes

- eeed827: Bootstrap: First Pulse

### Patch Changes

- Updated dependencies [eeed827]
  - @diffsense/types@0.1.0
