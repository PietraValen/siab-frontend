import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 já exporta flat config nativo. O FlatCompat
// (formato .eslintrc) quebrava com "Converting circular structure to JSON"
// ao tentar validar esse config novo como se fosse do formato antigo.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**", "tests/**/*.test.tsx"]),
]);

export default eslintConfig;
