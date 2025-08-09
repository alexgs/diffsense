# DiffSense

DiffSense is a modular, open-source benchmark for evaluating large language models on real-world software engineering tasks. It provides a pluggable harness, reusable scoring plugins, and discoverable public and private scenario packs, making it easy to run consistent tests across different models and providers. Results can be published as static artifacts for full transparency, with optional private datasets supported for sensitive evaluations.

## Project Structure

DiffSense is organized as a set of modular npm workspace packages. Each package has a clear, single responsibility.

### **`@diffsense/core`** – Core Types & Schemas

- The **language** of the benchmark.
- Defines all shared type definitions, interfaces, and manifest/data schemas.
- Every other package imports from here so data shapes are consistent.

### **`@diffsense/harness`** – Orchestration Engine

- The **referee** of the benchmark. 
- Runs scenarios by:
  1. Calling a runner to execute the scenario against a model or tool.
  2. Passing the output through one or more evaluators to score it.
  3. Returning a result object with metrics.
- The harness does not care which model/provider you use—it just coordinates the process.

### **`@diffsense/evaluators`** – Scoring Plugins

- The **scorekeepers**.
- Each evaluator applies a specific metric to a model’s output (e.g., exact match, pass\@k, BLEU score, regex match).
- The harness can run multiple evaluators for a single scenario to collect richer metrics.

### **`@diffsense/runners`** – Model/Provider Adapters

- The **competitors’ interpreters**.
- Each runner knows how to send a scenario to a specific API or environment (OpenAI, local model server, mock runner, etc.) and return normalized output.
- The harness calls runners via a consistent interface.

### **`@diffsense/cli`** – Command-Line Interface

- The **tournament organizer**.
- User-facing tool that:
  - Parses command-line options (`--suite`, `--runner`, `--out`, etc.).
  - Selects scenarios from dataset packages.
  - Chooses the correct runner implementation.
  - Invokes the harness and writes results to disk.

### **Datasets** – Scenario Collections

- Packages that export arrays of `Scenario` objects.
- Examples:
  - **`@diffsense/datasets-core`** – main public scenario set.
  - **`@diffsense/datasets-toy`** – small, fast set for CI.
- Dataset packages are **discovered by keyword** (`"diffsense-scenarios"`) so the CLI can auto-load them.

### **Private Dataset Plugins**

Some scenarios may be private (e.g., licensed code, sensitive data). These live in **separate repos** published as private npm packages, e.g.:

```
@diffsense-private/datasets-codefixes
@diffsense-private/datasets-regressions
```

The CLI will load them if they are installed in the workspace.
CI installs private datasets from GitHub Packages when running the full benchmark.
Public releases include metrics and public-only raw data, but omit the private scenario content.

### Analogy

* **Core** → *the dictionary*
* **Harness** → *the referee*
* **Evaluators** → *the scorecards*
* **Runners** → *the competitors’ interpreters*
* **CLI** → *the tournament organizer handing out the scorecards*
* **Datasets** → *the challenges in the competition*
* **Private Datasets** → *secret challenge rounds*

```mermaid
flowchart TD
%% ===== Actors =====
U[Developer / CI] --> CLI["@diffsense/cli\n(command-line entrypoint)"]

%% ===== Repo Packages (Workspaces) =====
subgraph REPO[Monorepo]
CORE["@diffsense/core\n(types & schemas)"]
HAR["@diffsense/harness\n(orchestrator)"]
EVAL["@diffsense/evaluators\n(scoring plugins)"]
RUN["@diffsense/runners\n(provider adapters)"]
RM["@diffsense/runners-mock\n(mock:pass|fail|echo|random)"]
DS1["@diffsense/datasets-core\n(public scenarios)"]
DS2["@diffsense/datasets-toy\n(CI/toy scenarios)"]
CLI
end

%% ===== Private Packs (separate repos, optional) =====
subgraph PRIV[Private Dataset Plugins]
DSP["@diffsense-private/*\n(private scenarios)"]
end

%% ===== Providers / Models =====
subgraph PROV[Providers / Model Endpoints]
OAI[OpenAI / HTTP API]
LOC[Local model server]
end

%% ===== Artifacts produced by a run =====
subgraph ARTS[Run Artifacts]
MAN[manifest.json]
MET[metrics.json]
SCN[scenarios.json]
TAR[diffsense-<run>.tar.zst]
end

%% ===== Distribution & Site =====
subgraph DIST[Distribution & Site]
R2[Cloudflare R2]
GHR[GitHub Release]
SITE[Astro static site]
end

%% ===== Imports (dashed = type/shared dependency) =====
DS1 -. imports .-> CORE
DS2 -. imports .-> CORE
DSP -. imports .-> CORE
RUN -. imports .-> CORE
RM  -. imports .-> CORE
EVAL -. imports .-> CORE
HAR -. imports .-> CORE
CLI -. imports .-> CORE

%% ===== CLI selects data & components =====
CLI -->|discovers scenarios by keyword 'diffsense-scenarios'| DS1
CLI -->|optional| DS2
CLI -->|optional| DSP

%% ===== Execution pipeline =====
CLI -->|invoke| HAR
HAR -->|uses| EVAL

%% Runners
HAR -->|runner=mock:*| RM
HAR -->|runner=openai:* etc.| RUN
RUN -->|HTTP calls| OAI
RUN -->|or| LOC

%% ===== Results & packaging =====
HAR -->|write| MAN
HAR -->|write| MET
HAR -->|write| SCN
MAN --> TAR
MET --> TAR
SCN --> TAR

%% ===== Publish =====
TAR --> R2
TAR --> GHR

%% ===== Site build =====
MET --> SITE
MAN --> SITE
SITE -->|links to| R2
SITE -->|links to| GHR
```
