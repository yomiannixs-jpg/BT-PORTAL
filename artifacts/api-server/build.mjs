import { build } from 'esbuild';
import { pinoPlugin } from 'esbuild-plugin-pino';

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node20'],
  sourcemap: true,
  plugins: [pinoPlugin({ transports: ['pino-pretty'] })],
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
  ],
});
