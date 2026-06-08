---
name: CSS Google Fonts import order
description: Tailwind v4 + PostCSS rejects @import url() inside CSS body; must use HTML <head> link tag
---

## Rule
When using Tailwind CSS v4 with PostCSS, the `@import "tailwindcss"` directive expands to a large CSS block. Any `@import url()` for Google Fonts placed AFTER `@import "tailwindcss"` in the same CSS file will fail with "must precede all other statements".

**Why:** PostCSS processes imports in order; once @import "tailwindcss" expands to CSS rules, no further @import url() calls are allowed.

**How to apply:** Place Google Fonts (and any external @import url()) in `index.html` as `<link rel="stylesheet">` tags in `<head>`, not in the CSS file.
