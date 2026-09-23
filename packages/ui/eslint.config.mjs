import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// The pack's source is what every install copies into someone's app, where
// create-next-app's own lint runs on it — so it answers to the same rules.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // A component library has no pages/ directory for this rule to read.
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
]);
