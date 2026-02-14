import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function resolveBasePath(): string {
  const envBase = process.env.VITE_BASE_PATH;
  if (envBase) {
    return envBase.endsWith('/') ? envBase : `${envBase}/`;
  }

  if (process.env.NODE_ENV !== 'production') {
    return '/';
  }

  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { homepage?: string };
    if (!packageJson.homepage) return '/';
    const homepage = new URL(packageJson.homepage);
    return homepage.pathname.endsWith('/') ? homepage.pathname : `${homepage.pathname}/`;
  } catch {
    return '/';
  }
}

export default defineConfig({
  plugins: [react()],
  base: resolveBasePath(),
  build: {
    outDir: 'build',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('/three/') ||
            id.includes('@react-three/') ||
            id.includes('/three-stdlib/') ||
            id.includes('/troika-')
          ) {
            return 'vendor-three';
          }
          if (id.includes('/framer-motion/')) return 'vendor-motion';
          if (id.includes('@headlessui/') || id.includes('@radix-ui/')) return 'vendor-ui';
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
