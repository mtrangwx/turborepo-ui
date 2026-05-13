# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands are run from the repo root using pnpm + Turbo:

```bash
pnpm dev          # Start all apps in dev mode (web on 127.0.0.1:5173, storybook on 6006)
pnpm build        # Build all packages and apps
pnpm lint         # Lint all packages
pnpm format       # Format all packages with Prettier
pnpm typecheck    # Type-check all packages
```

To run a command for a single package:

```bash
pnpm --filter web dev
pnpm --filter mystorybook storybook   # Runs Storybook dev server on port 6006
pnpm --filter @mtrangio/ui typecheck
```

### Testing

Storybook stories are tested via Vitest + Playwright (headless Chromium). Run from `apps/storybook`:

```bash
pnpm --filter mystorybook vitest      # Run story tests (requires Storybook server or vitest plugin)
```

Tests are configured in `apps/storybook/vite.config.ts` using `@storybook/addon-vitest/vitest-plugin` and `@vitest/browser-playwright`.

### Publishing (`@mtrangio/ui`)

Releases use [Changesets](https://github.com/changesets/changesets) with a two-phase CI workflow:

**Phase 1 — describe the change** (done by the developer):
```bash
pnpm changeset   # select @mtrangio/ui, choose patch/minor/major, write a summary
git add .changeset/
git commit -m "chore: add changeset"
git push
```

**Phase 2 — version + publish** (handled by CI):
1. The Changesets bot opens a **"Version Packages" PR** that bumps `packages/ui/package.json` and updates `CHANGELOG.md`.
2. Review and merge the PR.
3. CI detects the merge and runs `pnpm release`, which builds and publishes `@mtrangio/ui` to npm.

> **Never run `pnpm version-packages` locally** unless you are intentionally managing the release outside CI — it writes the version bump to `packages/ui/package.json` before the package is published, which breaks `pnpm install` for anyone who pulls that commit before the publish completes.

#### Key rule: `apps/web` must always use `workspace:*`

`apps/web/package.json` must keep `"@mtrangio/ui": "workspace:*"`. Changesets leaves `workspace:*` references alone, so only `packages/ui/package.json` gets a version bump. If the specifier is changed to a registry version (e.g. `^1.0.2`), Changesets will try to update it on the next release cycle, causing `pnpm install --frozen-lockfile` to fail in CI because the new version isn't published yet.

#### Testing the published package (alternatives)

**Option A — scratch project (recommended):** Create a throwaway project outside the monorepo that installs from npm:
```bash
mkdir /tmp/test-ui && cd /tmp/test-ui
npm init -y
npm install @mtrangio/ui react react-dom radix-ui
```

**Option B — temporary registry override in apps/web:** Swap `workspace:*` to the registry version, test locally, then revert before committing. Never commit the registry specifier.
```bash
# in apps/web/package.json, temporarily:
"@mtrangio/ui": "^1.0.2"
pnpm install   # fetches from npm
pnpm --filter web dev

# revert when done:
"@mtrangio/ui": "workspace:*"
pnpm install
```

## Adding shadcn/ui Components

Always run the shadcn CLI from the repo root with `-c apps/web`. Components are placed into `packages/ui/src/components/`, not into the app:

```bash
pnpm dlx shadcn@latest add <component> -c apps/web
```

## Architecture

This is a **pnpm + Turborepo monorepo** with two workspaces:

- `apps/` — runnable applications
- `packages/` — shared libraries

### packages/ui (`@mtrangio/ui`)

The shared component library. All shadcn/ui components live here. Individual component/lib/hooks paths resolve directly to source — no build step required for development:

```
@mtrangio/ui             →  packages/ui/dist/index.mjs  (built; for published package)
@mtrangio/ui/styles.css  →  packages/ui/dist/index.css  (built CSS; for published package)
@mtrangio/ui/globals.css →  packages/ui/src/styles/globals.css  (source; local dev)
@mtrangio/ui/components/* →  packages/ui/src/components/*.tsx   (source; local dev)
@mtrangio/ui/lib/*        →  packages/ui/src/lib/*.ts            (source; local dev)
@mtrangio/ui/hooks/*      →  packages/ui/src/hooks/*.ts          (source; local dev)
```

`publishConfig.exports` in `packages/ui/package.json` overrides these to `dist/*.mjs`/`*.cjs`/`*.d.mts` paths for the published package. tsdown outputs `.mjs` (ESM) and `.cjs` (CJS) — the exports map must use those exact extensions.

These mappings exist in two places:
- `packages/ui/package.json` `exports` field — used by Vite/Node at runtime
- `packages/ui/tsconfig.json` `paths` — used by TypeScript for type resolution

Current components: `badge`, `button`, `checkbox`, `dropdown-menu`

- **shadcn config**: `radix-nova` style, Tailwind CSS v4, Lucide icons, CSS variables for theming
- `src/lib/utils.ts` exports the `cn()` helper (clsx + tailwind-merge)
- `src/styles/globals.css` is the Tailwind entry point — imported in `apps/web/src/main.tsx`
- Uses `@fontsource-variable/geist` for the Geist variable font, `tw-animate-css` for animations
- Uses `radix-ui` (unified package) rather than individual `@radix-ui/*` packages
- Built with `tsdown` for publishing: `pnpm build` outputs ESM + CJS + types to `dist/`, plus compiled CSS
- Published to npm as `@mtrangio/ui` (configured via `publishConfig.name` in `package.json`)

### apps/web

Vite 7 + React 19 app (`@vitejs/plugin-react` v5). Consumes `@mtrangio/ui` directly via workspace symlink. Also has its own `components.json` for shadcn (points aliases to `@mtrangio/ui`). Local alias `@` resolves to `./src`.

### apps/storybook

Package name: `mystorybook`. Storybook 10 app using `@storybook/react-vite`, Vite 8 + `@vitejs/plugin-react` v6. Stories are loaded from both:
- `apps/storybook/src/**/*.stories.*` — demo/example stories
- `packages/ui/src/**/*.stories.*` — component stories colocated with the library (none yet; add stories here as components are developed)

Storybook addons: `@storybook/addon-vitest`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@chromatic-com/storybook`.

Storybook story files in `packages/ui/src` are excluded from the `build` Turbo task (see `turbo.json` inputs filter). Testing uses Vitest + `@storybook/addon-vitest` with Playwright for browser tests.

### Key conventions

- TypeScript strict mode throughout; `moduleResolution: bundler`
- Within `packages/ui`, the path alias `@mtrangio/ui/*` resolves to `./src/*` (tsconfig paths)
- Prettier with `prettier-plugin-tailwindcss` for class sorting

## Troubleshooting

**`ERR_PNPM_OUTDATED_LOCKFILE` when running `pnpm install --frozen-lockfile`**

Run `pnpm install` (without `--frozen-lockfile`) to update the lockfile, then commit `pnpm-lock.yaml`.

Common cause in CI: the "Version Packages" PR bumped a version in `package.json` but the lockfile wasn't regenerated before pushing. Always run `pnpm install` and commit the lockfile after `pnpm version-packages`.

**`EPERM: operation not permitted ::1:5173` when running `pnpm dev`**

Vite tries to bind on IPv6 by default. Add `server: { host: "127.0.0.1" }` to `apps/web/vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
  },
  ...
})
```

**`Missing "./globals.css" specifier in "@mtrangio/ui" package`**

Ensure the `exports` field in `packages/ui/package.json` includes the source path mappings (see Architecture section above). The `dist`-only exports are only sufficient for the published package, not for local development.
