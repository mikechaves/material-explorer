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
          if (id.includes('/three/examples/')) return 'vendor-three-examples';
          if (id.includes('/three/')) return 'vendor-three-core';
          if (id.includes('@react-three/fiber')) return 'vendor-r3f';
          if (id.includes('@react-three/drei')) return 'vendor-drei';
          if (id.includes('/three-stdlib/')) return 'vendor-stdlib';
          if (id.includes('/troika-') || id.includes('/maath/')) return 'vendor-3d-utils';
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
