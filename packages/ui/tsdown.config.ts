import { defineConfig } from "tsdown"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/components/*.tsx",
    "src/lib/*.ts",
    "src/hooks/*.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "radix-ui", /^@radix-ui\//],
})
