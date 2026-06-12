import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  packages: 'external',
  sourcemap: false,
  external: [
    'bcryptjs',
    'cookie-parser',
    'cors',
    'drizzle-orm',
    'drizzle-orm/*',
    'express',
    'jsonwebtoken',
    'pg',
    'pino',
    'pino-http',
    'pino-pretty',
    'thread-stream',
    'zod'
  ]
});