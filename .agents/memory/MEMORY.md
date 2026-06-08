# Memory Index

- [Wouter Link nested anchor](wouter-link-anchor.md) — Link renders as <a>; never add <a> child inside Link or you get hydration errors
- [CSS Google Fonts import order](css-google-fonts.md) — Google Fonts URL must be in index.html <head>, not @import url() in CSS (PostCSS rejects late @import after Tailwind v4 expansion)
- [Auth system](auth-system.md) — JWT-based auth with bcryptjs; SESSION_SECRET env var signs tokens; users table with roles student/admin; AuthGuard + AdminGuard in App.tsx
- [DB seed pattern](db-seed-pattern.md) — Seed scripts live in lib/db/src/ and run with `pnpm dlx tsx ./src/<script>.ts` from lib/db/ dir (tsx not available as local dep; pnpm dlx installs it on-demand)
