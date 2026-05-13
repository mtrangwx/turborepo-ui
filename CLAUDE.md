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
pnpm --filter storybook storybook   # Runs Storybook dev server on port 6006
pnpm --filter @workspace/ui typecheck
```

### Testing

Storybook stories are tested via Vitest + Playwright (headless Chromium). Run from `apps/mystorybook`:

```bash
pnpm --filter storybook vitest        # Run story tests (requires Storybook server or vitest plugin)
```

Tests are configured in `apps/mystorybook/vite.config.ts` using `@storybook/addon-vitest/vitest-plugin` and `@vitest/browser-playwright`.

### Publishing (`@workspace/ui`)

Releases use [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset          # Create a new changeset (describe what changed)
pnpm version-packages   # Bump versions based on changesets
pnpm release            # Build @workspace/ui and publish to npm
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

### packages/ui (`@workspace/ui`)

The shared component library. All shadcn/ui components live here. Source files are exposed directly via the `package.json` `exports` field — no build step required for development:

```
@workspace/ui/globals.css   →  packages/ui/src/styles/globals.css
@workspace/ui/components/*  →  packages/ui/src/components/*.tsx
@workspace/ui/lib/*         →  packages/ui/src/lib/*.ts
@workspace/ui/hooks/*       →  packages/ui/src/hooks/*.ts
```

These mappings exist in two places:
- `packages/ui/package.json` `exports` field — used by Vite/Node at runtime
- `packages/ui/tsconfig.json` `paths` — used by TypeScript for type resolution

Current components: `badge`, `button`, `checkbox`, `dropdown-menu`

- **shadcn config**: `radix-nova` style, Tailwind CSS v4, Lucide icons, CSS variables for theming
- `src/lib/utils.ts` exports the `cn()` helper (clsx + tailwind-merge)
- `src/styles/globals.css` is the Tailwind entry point — imported in `apps/web/src/main.tsx`
- Built with `tsdown` for publishing (`pnpm build` outputs to `dist/`)

### apps/web

Vite 7 + React 19 app. Consumes `@workspace/ui` directly via workspace symlink. Also has its own `components.json` for shadcn (points aliases to `@workspace/ui`). Local alias `@` resolves to `./src`.

### apps/mystorybook

Storybook 10 app using `@storybook/react-vite`. Stories are loaded from both:
- `apps/mystorybook/src/**/*.stories.*` — demo/example stories
- `packages/ui/src/**/*.stories.*` — component stories colocated with the library (none yet; add stories here as components are developed)

Storybook story files in `packages/ui/src` are excluded from the `build` Turbo task (see `turbo.json` inputs filter). Testing uses Vitest + `@storybook/addon-vitest` with Playwright for browser tests.

### Key conventions

- TypeScript strict mode throughout; `moduleResolution: bundler`
- Within `packages/ui`, the path alias `@workspace/ui/*` resolves to `./src/*` (tsconfig paths)
- Prettier with `prettier-plugin-tailwindcss` for class sorting

## Troubleshooting

**`ERR_PNPM_OUTDATED_LOCKFILE` when running `pnpm install --frozen-lockfile`**

`apps/mystorybook/package.json` has `"storybook": "^0.0.0"` which may diverge from the lockfile. For local development, run `pnpm install` (without `--frozen-lockfile`).

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

**`Missing "./globals.css" specifier in "@workspace/ui" package`**

Ensure the `exports` field in `packages/ui/package.json` includes the source path mappings (see Architecture section above). The `dist`-only exports are only sufficient for the published package, not for local development.
