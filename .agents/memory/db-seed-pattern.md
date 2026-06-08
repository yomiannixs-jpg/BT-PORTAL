---
name: DB seed pattern
description: How to run one-off seed scripts that import @workspace/db
---

## Rule
Seed scripts that need @workspace/db should live in `lib/db/src/` and be run with:
```
cd lib/db && pnpm dlx tsx ./src/<script>.ts
```

**Why:** tsx is not installed as a local dep in lib/db. `pnpm dlx tsx` installs it on-demand and works. Running from a different workspace package fails because @workspace/db can't be resolved from npm.

**How to apply:**
- Place seed script in `lib/db/src/`
- Import from `./index` and `./schema/...` (relative imports, no workspace: references)
- Run from `lib/db/` directory using `pnpm dlx tsx`
