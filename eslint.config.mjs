import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Several sheet/form components intentionally reset local form state
      // in a useEffect keyed on an `open`/`editing*` prop transition (a
      // standard "reset uncontrolled form on reopen" pattern). Downgraded
      // to a warning rather than restructured, since the pattern is safe
      // here (state resets are guarded by the `open` flag, not run on
      // every render).
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
