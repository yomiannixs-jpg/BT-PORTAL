# BAUM TenPers Academic Student Portal

A full academic student portal for BAUM TenPers Institute and Premiere Research Academy. Supports student onboarding, course enrollment, assignments, grade tracking, announcements, and admin management. Designed to be embeddable via iframe into WordPress and Wix sites.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/student-portal run dev` — run the frontend (port 21993, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Wouter routing, React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Charts: Recharts

## Where things live

- `lib/db/src/schema/` — all Drizzle schema files (students, programs, courses, enrollments, assignments, submissions, grades, announcements)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/student-portal/src/pages/` — React page components
- `artifacts/student-portal/src/components/layout.tsx` — sidebar nav layout

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks + Zod schemas
- wouter `Link` renders directly as `<a>` — never wrap in `<a>` child elements or you'll get nested anchor hydration errors
- Google Fonts must be in `index.html <head>`, not as `@import url()` inside CSS (PostCSS processes after `@import "tailwindcss"` expansion and rejects late `@import url()`)
- Student ID is persisted in `localStorage` under key `"studentId"`, defaults to student #1 (Amara Mensah) for demo
- Dashboard `/api/dashboard/student/:id` aggregates all student stats server-side for a single-request page load

## Product

- **Student onboarding**: multi-step registration form with program selection
- **Dashboard**: enrolled courses, upcoming assignments, GPA, recent grades, announcements
- **Courses**: browse all courses, see enrollment status, search, enroll in one click
- **Course detail**: assignment list, enrollment count, instructor info
- **Assignments**: filter by pending/submitted, submit assignments, see grades inline
- **Grade transcript**: cumulative GPA, average score, full grade table with GPA points
- **Announcements**: priority-coded (urgent/important/normal) announcement feed
- **Profile**: edit personal info and program selection
- **Admin panel**: student management with status changes, course creation, announcement posting, stats charts

## Demo data

Seeded: 3 students (Amara Mensah, Fatima Ibrahim, Khoury Benaissa), 4 programs, 6 courses, 7 enrollments, 6 assignments, 3 submissions, 3 grades, 3 announcements.

## Embedding (iframe)

To embed in WordPress or Wix, use:
```html
<iframe src="https://YOUR_DOMAIN/" width="100%" height="800px" frameborder="0"></iframe>
```

## User preferences

- Deep navy + amber/gold color scheme
- Montserrat (headings) + Roboto (body) fonts
- Embeddable via iframe into baumtenpers.com (WordPress) and premiereresearchacademy.com (Wix)

## Gotchas

- Never wrap wouter `<Link>` children with `<a>` — Link already renders as `<a>`
- Google Fonts import must go in `index.html`, not CSS (PostCSS order constraint with Tailwind v4)
- API server must be restarted after adding new routes (esbuild bundles on start)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
