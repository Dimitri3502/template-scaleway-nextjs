import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import { baseConfig } from "./base.js";

/** Flat config des paquets React : ajoute les règles hooks et Next.js à la base commune. */
export const reactConfig = tseslint.config(...baseConfig, {
  languageOptions: {
    globals: { ...globals.browser, ...globals.node },
  },
  plugins: {
    "react-hooks": reactHooks,
    "@next/next": nextPlugin,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs["core-web-vitals"].rules,
    // App Router uniquement : la règle cherche un répertoire `pages/` qui n'existe pas.
    "@next/next/no-html-link-for-pages": "off",
  },
});

export default reactConfig;
