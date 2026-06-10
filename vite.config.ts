import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Logic layers carry the guarantees; UI/icons are visual and untested here.
      include: ['src/game/**', 'src/store/**', 'src/utils/**', 'src/audio/**', 'src/hooks/**'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/test/**',
        'src/audio/sounds/**',
        'src/**/types.ts', // pure type modules — no runtime
        'src/audio/soundTypes.ts',
        'src/audio/AudioBootstrap.tsx', // side-effect-only wiring (listeners/preload)
      ],
      reporter: ['text', 'html'],
    },
  },
});
