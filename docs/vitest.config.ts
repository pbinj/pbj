import { defineConfig } from 'vitest/config';
import markdown from './src/markdown-loader';

export default defineConfig({
  plugins: [ markdown ],
  test: {
    setupFiles: ['./src/setup.ts'],
    include: [
      './*.md',
//      './junk.js'
    ],
    exclude: ['node_modules', 'dist', './vitest.config.ts'],
  },
});