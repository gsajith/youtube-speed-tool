import js from "@eslint/js";
import globals from "globals";

// The add-on linter (web-ext lint) checks the manifest and package. This checks the code.
export default [
  { ignores: ["dist/", ".claude/"] },
  js.configs.recommended,
  {
    rules: {
      // Catches code that only works because of load order or await timing.
      "no-use-before-define": ["error", { functions: false }],
    },
  },
  {
    files: ["src/**/*.js"],
    languageOptions: { sourceType: "script", globals: { ...globals.browser, ...globals.webextensions } },
  },
  {
    // settings.js publishes these through globalThis, for itself and the scripts loaded after it.
    files: ["src/settings.js", "src/content.js", "src/options.js"],
    languageOptions: { globals: { DEFAULT_SETTINGS: "readonly", loadSettings: "readonly", unshiftedKey: "readonly" } },
  },
  {
    // Node scripts whose evaluate() callbacks run in the browser.
    files: ["tests/**/*.mjs", "scripts/**/*.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser, ...globals.webextensions } },
  },
];
