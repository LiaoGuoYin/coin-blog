# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server (port 4321)
pnpm build      # Build static site to dist/
pnpm preview    # Preview built output
pnpm deploy     # Build + deploy to Cloudflare Pages

bash scripts/check-drafts.sh  # 将 posts/ 下 published 非 true 的文章包移入 posts/draft/
node --test tests/*.mjs       # Run unit tests
```

Requires Node.js >= 22.12.0 and pnpm.

## Architecture

Astro 6 static blog deployed to Cloudflare Pages. Pure static output — no server runtime.

**Content flow:** Post packages in `posts/{slug}/index.md` with optional `assets/` → parsed by gray-matter (frontmatter) + markdown-it (body) → static HTML pages via Astro SSG. Post-local assets are emitted through `/post-assets/{slug}/...`. Memos are fetched client-side from an external Memos API.

**Routing:**
- `/` and `/post` → homepage with post list (tab-switchable to Memos)
- `/:slug` → article page (generated from `posts/{slug}/index.md` folder names)
- `/memo` → same homepage component, Memos tab selected
- `/atom.xml` → RSS feed

**Key files:**
- `site.config.ts` — central config: site metadata, nav links, UI labels, memos API URL and page size
- `src/lib/posts.ts` — post loading, sorting, reading time calculation
- `src/lib/markdown.ts` — markdown-it pipeline with Shiki highlighting, heading anchors, GitHub alerts, image figure wrapping
- `src/layouts/Layout.astro` — base HTML template with dark mode init script; `showToc` prop adds the mobile Contents button
- `src/lib/nav.ts` / `nav-icons.ts` — nav grouping and active state; icons are keyed by nav `label`
- `src/styles/global.css` — Radix scales, semantic tokens, radius/motion tokens, prose typography overrides

**Styling:** Tailwind CSS v4 (layout utilities) with @tailwindcss/typography. Dark mode via `.dark` class on `<html>` with localStorage persistence.

- **Colors:** Radix 12-step scales (sand, gold, blue, bronze, grass, red), used by step role: 1–2 app bg, 3–5 component bg, 6–8 borders, 9–10 solid, 11–12 text. Components reference semantic tokens only (`--bg-chrome`, `--bg-panel`, `--bg-subtle`, `--bg-element`, `--nav-hover`, `--nav-selected`, `--line`, `--line-chrome`, `--line-control`, `--text`, `--text-2`, `--accent-text`), never raw scale steps. Gold is the accent.
- **Type scale:** only 24 / 16 / 14 / 12 px. Article h2–h4 stay 16px and differ by weight and the UI font.
- **Shape:** 0.5px borders everywhere. Radii are concentric tokens: `--radius-inline` 4, `--radius-control` 8, `--radius-block` 10, `--radius-panel` 12. No box shadows, no colored left borders on cards, quotes or alerts.
- **Motion:** color/opacity transitions only, `var(--ease-base)` (250ms ease-out). Sheets and drawers open without animation.
- **Alignment:** hover backgrounds extend past the text with negative margins (`.nav-item`, `.icon-link` call sites) so glyphs sit on the column edge; touch targets are 44px (`--touch` modifiers).
- **Copy:** UI text is English, no `·` separators, no explanatory filler. Article content stays Chinese.
- Unlayered rules in `global.css` beat Tailwind utilities, so don't try to override `.nav-item` spacing with utility classes.

**Fonts:** Poppins (UI), Lora (article body), JetBrains Mono (code, dates) — self-hosted latin subsets in `public/fonts/`, `font-display: optional`.

## Content

Post frontmatter fields:
```yaml
title: string       # Required
date: string        # ISO 8601 or YYYY-MM-DD
published: boolean  # Must be true to appear on site
feature: string     # Reserved, currently unused
```

Post-local images and attachments live in `posts/{slug}/assets/` and should be referenced from Markdown with relative paths such as `./assets/example.webp`.

Content locale is Chinese — UI text, date formatting, and reading time calculation (300 chars/min for Chinese, 200 words/min for English) are Chinese-optimized.

## Design Spec

`docs/DESIGN_SPEC.md` contains a comprehensive AI-facing design specification covering component details, layout system, color tokens, and rendering pipeline. Consult it for detailed implementation questions.
