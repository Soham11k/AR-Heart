import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.glb'],
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/._*', '**/.*/**']
  }
});
