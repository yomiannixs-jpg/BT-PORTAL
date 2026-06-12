# BT Academic Portal — WordPress/Wix Integration Notes

This portal is now prepared to run as a standalone secure web app and be linked from both BAUM TenPers WordPress and Wix websites.

## Recommended structure

Use a dedicated portal URL such as:

- `https://portal.baumtenpers.com`
- or `https://academic.baumtenpers.com`

Then add a prominent **Academic Portal** or **Student Portal** button in the WordPress/Wix header and admissions pages. Avoid iframe embedding unless absolutely necessary because iframe embeds can break routing, authentication, mobile layout, and browser security settings.

## Frontend environment variables

Set these in Vercel/Netlify/Render for `artifacts/student-portal`:

```bash
VITE_API_URL=https://api.baumtenpers.com
BASE_PATH=/
VITE_SHOW_DEMO_ACCESS=false
```

If the frontend and API are served on the same domain, `VITE_API_URL` can be omitted.

## Backend environment variables

Set these for `artifacts/api-server`:

```bash
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
SESSION_SECRET=use-a-long-random-production-secret
CORS_ORIGIN=https://portal.baumtenpers.com,https://www.baumtenpers.com,https://baumtenpers.com
```

## Branding updates applied

- Removed platform-specific development metadata from the HTML title/description/OpenGraph/Twitter tags.
- Removed development-only Vite plugins and platform config files.
- Updated the portal name to **BT Academic Portal**.
- Aligned styling toward BAUM TenPers public-site branding: deep blue, white, and academic gold accents.
- Disabled demo login buttons by default unless `VITE_SHOW_DEMO_ACCESS=true`.

## Production/security updates applied

- API calls now support a separate backend URL via `VITE_API_URL`.
- CORS is restricted through `CORS_ORIGIN` instead of open `cors()`.
- `SESSION_SECRET` is now required; there is no insecure fallback secret.
- Student context no longer defaults to student ID `1`.
- Vite no longer requires `PORT`/`BASE_PATH` just to build locally.

## Still recommended before launch

- Add forgot-password/password-reset flow.
- Add email verification for new students.
- Replace seeded demo users with real invite/admin-created users.
- Add audit logs for transcript, grades, and approval changes.
- Consider secure HTTP-only cookie sessions if you want stronger browser-side token protection.
