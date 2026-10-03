import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // The new react-hooks/set-state-in-effect rule is overly aggressive
      // for data-fetching effects. The patterns we use (reset state on prop
      // change, then update via async fetch) are intentional.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);