import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "**/dev-dist/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  // Regla de oro 1: el motor es puro y determinista.
  {
    files: ["packages/engine/src/**/*.ts"],
    rules: {
      "no-console": "error",
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "Usa el RNG con semilla del estado." },
        { object: "Date", property: "now", message: "El motor no puede depender del reloj." },
      ],
      "no-restricted-globals": [
        "error",
        { name: "Date", message: "El motor no puede depender del reloj." },
        { name: "fetch", message: "El motor no hace E/S." },
        { name: "setTimeout", message: "El motor no hace E/S." },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["node:*", "fs", "path", "zod"], message: "El motor no tiene dependencias ni E/S." },
          ],
        },
      ],
    },
  },
  prettier,
);
