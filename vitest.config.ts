import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-report/index.html',
    },
  },
});
