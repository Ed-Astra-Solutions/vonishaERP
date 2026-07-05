import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // The screens fetch on mount via a memoized `load()` that flips a loading
      // flag — the canonical client-side data-fetching pattern. This rule flags
      // that synchronous setState; it's a deliberate, safe choice here.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
