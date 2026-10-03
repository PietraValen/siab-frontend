import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 já exporta configs "flat" nativas — o FlatCompat
// (@eslint/eslintrc) que era usado aqui quebrava ao carregá-las
// ("Converting circular structure to JSON"). Formato da documentação do
// Next 16 (node_modules/next/dist/docs/.../03-eslint.md).
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts", "tests/**/*.test.tsx"]),
]);

export default eslintConfig;
