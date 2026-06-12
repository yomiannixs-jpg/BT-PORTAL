import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/index.cjs',
  packages: 'bundle',
  sourcemap: false,
  external: [
    'pino',
    'pino-http',
    'pino-pretty',
    'thread-stream'
  ]
});