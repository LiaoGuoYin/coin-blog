# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server (port 4321)
pnpm build      # Build static site to dist/
pnpm preview    # Preview built output
pnpm deploy     # Build + deploy to Cloudflare Pages

bash scripts/check-drafts.sh  # 将 posts/ 下 published 非 true 的文章移入 posts/draft/
```

Requires Node.js >= 22.12.0 and pnpm.

## Architecture

Astro 6 static blog deployed to Cloudflare Pages. Pure static output — no server runtime.

**Content flow:** Markdown files in `posts/` → parsed by gray-matter (frontmatter) + markdown-it (body) → static HTML pages via Astro SSG. Memos are fetched client-side from an external Memos API.

**Routing:**
- `/` and `/post` → homepage with post list (tab-switchable to Memos)
- `/:slug` → article page (generated from `posts/*.md` filenames)
- `/memo` → memos timeline
- `/atom.xml` → RSS feed

**Key files:**
- `site.config.ts` — central config: site metadata, nav links, UI labels, memos API URL, post list style
- `src/lib/posts.ts` — post loading, sorting, reading time calculation
- `src/lib/markdown.ts` — markdown-it pipeline with Shiki highlighting, heading anchors, GitHub alerts, image figure wrapping
- `src/layouts/Layout.astro` — base HTML template with dark mode init script
- `src/styles/global.css` — Radix UI color tokens (60 CSS variables for light/dark), Tailwind v4 theme mapping, prose typography overrides

**Styling:** Tailwind CSS v4 with @tailwindcss/typography. Color system uses Radix UI 12-level scales (sand, gold, blue, bronze, grass). Dark mode via `.dark` class on `<html>` with localStorage persistence.

**Fonts:** Poppins (UI), Lora (article body), JetBrains Mono (code) — loaded from Google Fonts with size-adjusted fallbacks to reduce layout shift.

## Content

Post frontmatter fields:
```yaml
title: string       # Required
date: string        # ISO 8601 or YYYY-MM-DD
published: boolean  # Must be true to appear on site
feature: string     # Reserved, currently unused
```

Content locale is Chinese — UI text, date formatting, and reading time calculation (300 chars/min for Chinese, 200 words/min for English) are Chinese-optimized.

## Design Spec

`docs/DESIGN_SPEC.md` contains a comprehensive AI-facing design specification covering component details, layout system, color tokens, and rendering pipeline. Consult it for detailed implementation questions.
