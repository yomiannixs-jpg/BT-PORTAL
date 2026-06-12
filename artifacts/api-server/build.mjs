import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/index.cjs',
  packages: 'bundle',
  sourcemap: false
});

await mkdir('dist/lib', { recursive: true });

await build({
  entryPoints: ['src/lib/worker.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/lib/worker.js',
  packages: 'bundle',
  sourcemap: false
});