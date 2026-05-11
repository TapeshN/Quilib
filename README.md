# Quilib

Quilib is a TypeScript-first QA harness for analyzing web app quality gaps and generating actionable reports from real app + repo scans.

## Current Status

MVP path is implemented end-to-end:

- CLI `analyze` flow is wired through `observe -> think -> act`.
- Playwright explorer performs route discovery and page signal capture.
- Repo scanner inventories routes/tests and Cypress structure.
- Gap engine computes deterministic quality gaps and release confidence.
- Reports are generated as JSON and Markdown.
- State and decision logs are persisted in `.scan-state`.

## Tech Stack

- TypeScript (strict, NodeNext)
- Commander (CLI)
- Zod (schemas and validation)
- Playwright (URL exploration)
- fast-glob (repo analysis)
- Anthropic API integration (optional scenario generation)

## Project Structure

```text
src/
  adapters/      # test rendering adapters (playwright, cypress, api)
  cli/           # command-line entrypoint
  harness/       # state + decision logging contracts
  llm/           # LLM provider/context contracts
  phases/        # observe / think / act orchestration contracts
  reporters/     # output report contracts
  schemas/       # shared zod schemas + inferred types
  tools/         # explorers, gap engine, repo scanner contracts
```

## Configuration

Primary config lives in `quilib.config.ts` and is typed with `HarnessConfig`.

Optional **authenticated scanning** uses `auth` on the config (`form-login` or `storage-state`). See the commented example in `quilib.config.ts`. For local-only credentials, use a separate file such as `quilib.test-auth.config.ts` (listed in `.gitignore`) and pass `--config quilib.test-auth.config.ts`.

## Scripts

- `npm run dev` - run CLI entry (`src/cli/index.ts`)
- `npm run analyze -- --url <app-url> [--repo <repo-path>]` - run full analysis pipeline
- `npm run clean` - remove `output/` and `.scan-state/` (generated artifacts)
- `npm run build` - compile TypeScript into `dist/`

## Usage

```bash
# analyze app only
npm run analyze -- --url http://localhost:3000

# analyze app + repo
npm run analyze -- --url http://localhost:3000 --repo ../notquality-app

# alternate config file (e.g. local auth — keep that file out of git)
npm run analyze -- --config quilib.test-auth.config.ts --url https://example.com

# stateless run: no files on disk; full JSON payload on stdout (for MCP/CI)
npm run analyze -- --url https://example.com --ephemeral

# wipe generated output and scan state
npm run clean
```

## Validate Setup

```bash
npm install
npx tsc --noEmit
```

## Output and State Folders

- `.scan-state/` holds persisted scan state files.
- `output/` holds generated reports.

Expected state files:

- `.scan-state/discovered-routes.json`
- `.scan-state/repo-inventory.json` (when `--repo` is provided)
- `.scan-state/gap-analysis.json`
- `.scan-state/decision-log.json`

Expected reports:

- `output/report.json`
- `output/report.md`
