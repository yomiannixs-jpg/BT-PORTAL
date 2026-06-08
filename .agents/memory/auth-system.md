---
name: Auth system
description: JWT-based auth with bcryptjs; SESSION_SECRET env var; users table with student/admin roles
---

## Rule
Use JWT (jsonwebtoken) + bcryptjs for auth. Tokens stored in localStorage under `authToken`. SESSION_SECRET env var is available as the signing key.

**Why:** Simple stateless auth that works with the proxy/iframe setup. No cookie complexity.

**How to apply:**
- `artifacts/api-server/src/middleware/auth.ts` exports `requireAuth`, `requireAdmin`, `optionalAuth`, `signToken`, `verifyToken`
- Route files import from `../middleware/auth`
- Frontend `AuthProvider` in `artifacts/student-portal/src/lib/auth-context.tsx` exposes `user`, `token`, `login`, `logout`
- `AuthGuard` and `AdminGuard` components in App.tsx protect routes
- Auth user: `{ id, email, role: "student"|"admin", name, studentId }`

## User accounts (demo)
- admin@baumtenpers.com / admin123
- amara.mensah@example.com / student1
- fatima.ibrahim@example.com / student2
- khoury.benaissa@example.com / student3
