import js from "@eslint/js";
import globals from "globals";

/**
 * Minimal ESLint config for Node ESM projects.
 * - Fast, deterministic, CI-friendly.
 * - Ignores generated folders (dist/ coverage/ out/).
 */
export default [
  {
    ignores: ["dist/**", "coverage/**", "out/**", "node_modules/**"],
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];
