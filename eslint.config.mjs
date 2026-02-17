import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "@typescript-eslint/eslint-plugin";

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
    plugins: {
      react,
      "react-hooks": reactHooks,
      "@typescript-eslint": tseslint,
    },
    rules: {
      // The codebase is still mid-hardening; keep these as warnings to avoid blocking release builds.
      "@typescript-eslint/no-explicit-any": "warn",

      // These rules are valuable, but currently too noisy for our patterns (hydration guards, timers, etc.).
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",

      // Prefer fixing these over time; don't block shipping on marketing/legal copy text.
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;
