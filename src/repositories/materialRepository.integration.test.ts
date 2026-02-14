import { once } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createMaterialRepository } from './materialRepository';
import type { Material } from '../types/material';

function makeMaterial(id: string, name: string): Material {
  const now = Date.now();
  return {
    id,
    name,
    color: '#ffffff',
    metalness: 0.5,
    roughness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 0,
    clearcoat: 0,
    clearcoatRoughness: 0.03,
    transmission: 0,
    ior: 1.5,
    opacity: 1,
    createdAt: now,
    updatedAt: now,
  };
}

async function waitForHealth(url: string, timeoutMs = 7000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`Timed out waiting for mock API health at ${url}`);
}

describe('materialRepository integration with mock API', () => {
  const port = 8787 + Math.floor(Math.random() * 800);
  const apiUrl = `http://127.0.0.1:${port}`;
  let serverProcess: ChildProcessWithoutNullStreams | null = null;

  beforeAll(async () => {
    serverProcess = spawn('node', ['scripts/mock-material-server.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port) },
      stdio: 'pipe',
    });
    await waitForHealth(`${apiUrl}/health`);
  }, 15000);

  afterAll(async () => {
    if (!serverProcess) return;
    serverProcess.kill('SIGTERM');
    await Promise.race([once(serverProcess, 'exit'), new Promise((resolve) => setTimeout(resolve, 1500))]);
    serverProcess = null;
  });

  it('persists and hydrates scoped materials over HTTP fallback repository', async () => {
    const scope = 'integration-user';
    const repository = createMaterialRepository({ apiUrl, fetchImpl: fetch, userScope: scope });
    const material = makeMaterial('integration-1', 'Integration Material');

    const saveResult = await repository.saveAll([material]);
    expect(saveResult).toEqual({ ok: true, remoteSynced: true });

    const remoteMaterials = await repository.loadFromRemote?.();
    expect(remoteMaterials).toHaveLength(1);
    expect(remoteMaterials?.[0]?.name).toBe('Integration Material');
    expect(repository.source).toBe('http+local-fallback');
    expect(repository.scope).toBe(scope);
  });
});
