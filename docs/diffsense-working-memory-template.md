# DiffSense Working Memory

## Quick "Reload" Summary

- **Goal:** Implement toy scenario runner with hardcoded evaluator for First Pulse milestone  
- **Zoom:** **Close Up** -> Types — add just enough structure for Scenario, Runner, Evaluator.
- **Key APIs:**
```ts
runScenario(suite: TestSuite): ScenarioResult
evaluateOutput(output: string, evaluator: Evaluator): number
```  
- **Decisions:**
  - Store shared types in `@diffsense/types`
  - Use `@diffsense/scenarios` for suite definitions

## Full Project Summary

### 1. Project Overview

- DiffSense is a modular benchmark tool for evaluating LLMs on real-world software engineering tasks.  
- Core packages: `types`, `harness`, `evaluators`, `runners`, `cli`.

### 2. Key APIs

```ts
function runScenario(suite: TestSuite): ScenarioResult
function evaluateOutput(output: string, evaluator: Evaluator): number
```

### 3. Architecture Decisions

- Store shared types in `@diffsense/types`
- Use `@diffsense/scenarios` for suite definitions
- Evaluators are pluggable via config, not hardcoded in harness

### 4. Current Goal

Implement toy scenario runner with hardcoded evaluator for First Pulse milestone.

### 5. Current Zoom Level

- **Close Up** -> Types — add just enough structure for Scenario, Runner, Evaluator.

### 6. Open Questions / TODOs

### 7. Last Checkpoint Summary

- Added `@diffsense/scenarios` package with toy test suite; CLI can now run it through harness and print raw result.

### How to use this with ChatGPT

- Keep this doc open in another tab or split-screen.
- At any major context shift, paste **only the relevant sections** back into chat.
- When something changes, update here first, then continue working.

#### Zoom-level options

- **Wide Shot** = package structure & dependencies
- **Medium Shot** = module-level design
- **Close-Up** = single function or small code block

