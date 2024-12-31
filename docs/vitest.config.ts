import { defineConfig } from 'vitest/config';
import markdown from './src/markdown-loader';

export default defineConfig({
  plugins: [markdown as any],
  resolve: {
    alias: {
      'express': `${__dirname}/src/mock-express.ts`,
    },
  },
  test: {

    setupFiles: ['./src/setup.ts'],
    include: [
      './*.md',
      './**/*.md'
      //      './junk.js'
    ],
    exclude: ['node_modules', 'dist', './vitest.config.ts'],
  },
});
