# Next Steps

**Project Status (on hold):** DiffSense is a monorepo test harness for evaluating LLM output. Current milestone (“First Pulse”) is complete: a single scenario runs end-to-end with a stub runner and exact-match evaluator. Next steps are release pipeline setup (changesets workflow), richer result formatting (vitest-style summary), and expanding runner/evaluator support (OpenAI + fuzzy match).

### What we’re doing right now

- Building **DiffSense**, a test harness for LLM output quality, with a **monorepo** structure (CLI + harness + evaluators + runners + types).
- Already hit the **“First Pulse”** milestone: run a single scenario end-to-end with hardcoded runner/evaluator.
- Working through **micro-milestones** like adding more runners/evaluators, formatting results, CI integration, and packaging.
- See [DiffSense Plan](https://workflowy.com/#/0d63f7f16d9d) and [kanban board](https://workflowy.com/#/d6432a76b8b6)
- [DS-12: Integrate first realistic scenario from old ChatGPT threads](https://workflowy.com/#/205d5c331e1b)
  - Combing through old ChatGPT conversations to find a good first realistic scenario.
  - I downloaded the conversation history (`scripts/conversations.json`)
  - We've tried a few different scripts to pull out posts and conversations
  - Currently, we're working on one to find a post and pull out the conversation thread around it
  - It grabs the message in questions, but just leaves placeholders for the surrounding messages (`scripts/extract_conversation_arcs.sh`)
- Using **npm workspaces + Turborepo** to coordinate builds and dev tasks.

### What’s next on deck

- **Release pipeline**: tagging, version bumps, changesets workflow. (You were mid-decision on `changeset version` workflow: main branch vs dev branch).
- **Output formatting**: expand test results display (vitest-style summary with colors).
- **Expand runners/evaluators**: only stub + exact match exist; need OpenAI runner + fuzzy/string similarity evaluators next.
- **CI/test strategy**: decide whether to run `turbo run test` across all packages or run tests package-by-package in CI.
- **Docs cleanup**: README summary, diagram, and project guidelines are in progress.

### Longer-term roadmap

- Add **scenario/suite management** (better nomenclature still under discussion).
- Explore **policy-based evaluation** and more nuanced scoring beyond pass/fail.
- Build **developer UX** around running suites locally vs in CI.
- Consider **publishing / open-sourcing** once stable.
