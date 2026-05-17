import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // Usar fileURLToPath para evitar el leading "/" en Windows que rompe
      // la resolución de imports tipo "@/lib/scoring".
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
