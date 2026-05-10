I am setting up a Turborepo design system to publish components under a personal NPM scope initially under `@my-org/ui`, with a plan to migrate to a private Azure Artifacts registry later.

Please perform the following setup:

1. ARCHITECTURE & ENTRY POINT:
   - Create 'packages/ui/src/index.ts' and export all public components, hooks, and 'cn' utils.
   - Update 'packages/ui/package.json' to use a single "." export for the bundle and "./styles.css" for Tailwind.

2. BUNDLING WITH TSDOWN:
   - Configure 'tsdown.config.ts' for ESM/CJS output with 'src/index.ts' as the entry.
   - Set 'react', 'react-dom', and '@radix-ui/*' as external.

3. DYNAMIC REGISTRY CONFIG:
   - Add a 'publishConfig' block to 'packages/ui/package.json'. 
   - Set 'access': 'public' for now, but include a commented-out 'registry' field for Azure Artifacts (https://pkgs.dev.azure.com/YOUR_ORG/_packaging/YOUR_FEED/npm/registry/) under scope `@org/ui` so I can switch easily.

4. CHANGESETS FOR AZURE COMPATIBILITY:
   - Initialize changesets. 
   - In '.changeset/config.json', set 'access': 'public'.
   - Create TWO release workflows:
     a) '.github/workflows/release.yml' (Standard GitHub Action for my personal NPM phase).
     b) 'azure-pipelines.yml' (A placeholder Azure DevOps Pipeline using the 'npmAuthenticate@0' task and 'changeset publish' so I’m ready for the migration).

5. ASSET HANDLING:
   - Ensure the 'build' script in 'packages/ui' runs 'tsdown' and ensures Tailwind styles are generated into 'dist/index.css'.