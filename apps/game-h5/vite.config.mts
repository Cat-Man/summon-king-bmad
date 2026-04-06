/// <reference types='vitest' />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/game-h5',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  resolve: {
    alias: {
      '@workspace/bridge': resolve(
        import.meta.dirname,
        '../../libs/platform/bridge/src/index.ts',
      ),
      '@workspace/data-access': resolve(
        import.meta.dirname,
        '../../libs/client/data-access/src/index.ts',
      ),
      '@workspace/contracts': resolve(
        import.meta.dirname,
        '../../libs/shared/contracts/src/index.ts',
      ),
      '@workspace/schemas': resolve(
        import.meta.dirname,
        '../../libs/shared/schemas/src/index.ts',
      ),
      '@workspace/state': resolve(
        import.meta.dirname,
        '../../libs/client/state/src/index.ts',
      ),
      '@workspace/types': resolve(
        import.meta.dirname,
        '../../libs/shared/types/src/index.ts',
      ),
      '@workspace/web-adapter': resolve(
        import.meta.dirname,
        '../../libs/platform/web-adapter/src/index.ts',
      ),
      '@workspace/wechat-adapter': resolve(
        import.meta.dirname,
        '../../libs/platform/wechat-adapter/src/index.ts',
      ),
    },
  },
  plugins: [react()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: '@workspace/game-h5',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
