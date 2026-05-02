# Repository Policy

## Scope

- These instructions apply to the entire repository unless a deeper `AGENTS.md` overrides them.
- Follow `~/.codex/AGENTS.md` for global working defaults.

## Repo Workflow

- Read the repository `README`, package manifests, lockfiles, and task-specific docs before editing.
- Use the active package manager and existing repository scripts; do not introduce a new toolchain unless required.
- Prefer the smallest change that matches the repository's existing architecture and conventions.

## Commands

- Package manager: `npm`
- Install: `npm install`
- Dev: `npm run dev`
- Test: `Not detected from manifests; inspect README before relying on this command.`
- Lint: `npm run lint`
- Typecheck: `Not detected from manifests; inspect README before relying on this command.`
- Build: `npm run build`

## Validation

- For small changes, run: `npm run lint`
- Before completion, run: `npm run build`
- If a validation step is intentionally skipped, explain why in the final response.

## Codebase Rules

- Preserve the existing directory structure, naming conventions, and style patterns.
- Follow the declared workspace scripts and package boundaries before adding new tooling.
- Touch adjacent tests when behavior changes.

## Task-Specific Notes

- Relevant docs: `README.md`
- Relevant docs: `docs`
- Likely entrypoints: `app`
