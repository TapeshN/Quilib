# AQIW

Adaptive Quality Intelligence Wrapper (AQIW) is a TypeScript-first QA harness scaffold for analyzing app quality gaps and generating test assets through pluggable explorers and adapters.

## Current Status

This repository is intentionally scaffold-only:

- Folder structure and module boundaries are in place.
- Schemas, interfaces, and exported signatures are defined.
- Runtime implementations are not added yet (`Not implemented` placeholders).

## Tech Stack

- TypeScript (strict, NodeNext)
- Commander (CLI)
- Zod (schemas and validation)
- Playwright + axe-core integration points
- Cypress integration points

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

Primary config lives in `aqiw.config.ts` and is typed with `HarnessConfig`.

## Scripts

- `npm run dev` - run CLI entry (`src/cli/index.ts`)
- `npm run analyze` - run analyze command entry
- `npm run build` - compile TypeScript into `dist/`

## Validate Setup

```bash
npm install
npx tsc --noEmit
```

## Output and State Folders

- `.scan-state/` holds persisted scan state files.
- `output/` holds generated reports/tests.
- `.gitkeep` placeholders preserve required empty directories.

## Next Milestones

1. Implement `observe` phase to collect route/repo inventory.
2. Implement `think` phase gap analysis and scenario generation.
3. Implement `act` phase adapter rendering + report writing.
4. Wire CLI command to end-to-end harness flow.
