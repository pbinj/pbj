import { defineConfig } from 'vitest/config';
import markdown from './src/markdown-loader';
import {fileURLToPath} from "node:url";

// @ts-ignore
export default defineConfig({
  plugins: [markdown as any],
  resolve: {
    alias: [
      {
        find: 'express',
        replacement: fileURLToPath(new URL('./src/mock-express.ts',
            // @ts-ignore
            import.meta.url
        ))
      },
      {
        find: '@pbinj/pbj',
        replacement: fileURLToPath(new URL('../packages/pbj/src',
          // @ts-ignore
            import.meta.url
        ))
      },
    ],
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
