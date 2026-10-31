import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      // Existing API boundary/legacy components still narrow several provider payloads at runtime.
      '@typescript-eslint/no-explicit-any': 'warn',
      // The Hostinger custom server and Tailwind config are Node CJS entrypoints.
      '@typescript-eslint/no-require-imports': 'warn',
      // These effects intentionally reconcile server-provided snapshots after router.refresh().
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
