---
name: Wouter Link nested anchor
description: wouter Link renders as <a> — never wrap in another <a> child
---

## Rule
In wouter, `<Link href="...">` renders directly as an `<a>` element. Never add a child `<a>` inside a Link — this creates nested anchors and causes React hydration errors.

**Why:** Wouter's Link component outputs `<a>` — unlike some router implementations that need a child `<a>` for styling.

**How to apply:** Pass className directly to Link: `<Link href="/foo" className="...">` instead of `<Link href="/foo"><a className="...">...</a></Link>`
