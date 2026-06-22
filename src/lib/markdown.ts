import path from 'node:path';
import MarkdownIt from 'markdown-it';
import type StateCore from 'markdown-it/lib/rules_core/state_core.mjs';
import type Token from 'markdown-it/lib/token.mjs';
import anchor from 'markdown-it-anchor';
import { fromHighlighter } from '@shikijs/markdown-it';
import { createHighlighter } from 'shiki';
import githubAlerts from 'markdown-it-github-alerts';

const LANGS = [
  'javascript', 'typescript', 'jsx', 'tsx',
  'css', 'html', 'json', 'markdown', 'yaml', 'toml',
  'python', 'bash', 'sh', 'shell', 'zsh',
  'go', 'rust', 'java', 'c', 'cpp', 'swift', 'kotlin',
  'sql', 'xml', 'dockerfile', 'nginx', 'ini',
] as const;

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export interface RenderMarkdownOptions {
  slug?: string;
}

// Must match markdown-it-anchor's default slugify
const slugify = (s: string) =>
  encodeURIComponent(s.trim().toLowerCase().replace(/\s+/g, '-'));

function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const re = /^(#{2,3}) (.+)$/gm;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const text = m[2].trim();
    headings.push({ level: m[1].length, text, id: slugify(text) });
  }
  return headings;
}

function isRelativePostAssetUrl(url: string): boolean {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(url);
}

function resolvePostAssetUrl(url: string, slug?: string): string {
  if (!slug || !isRelativePostAssetUrl(url)) return url;

  const match = url.match(/^([^?#]*)([?#].*)?$/);
  const pathname = match?.[1] || '';
  const suffix = match?.[2] || '';
  const normalized = path.posix.normalize(pathname.replace(/\\/g, '/')).replace(/^\.\//, '');

  if (
    !normalized ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    (normalized !== 'assets' && !normalized.startsWith('assets/'))
  ) return url;

  const encoded = normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `/post-assets/${encodeURIComponent(slug)}/${encoded}${suffix}`;
}

function walkTokens(tokens: Token[], visit: (token: Token) => void): void {
  for (const token of tokens) {
    visit(token);
    if (token.children) walkTokens(token.children, visit);
  }
}

let _md: MarkdownIt | null = null;

async function getMd(): Promise<MarkdownIt> {
  if (!_md) {
    const highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: LANGS,
    });

    const loaded = new Set(highlighter.getLoadedLanguages());

    _md = new MarkdownIt({ html: true, linkify: true, typographer: true });

    _md.enable(['strikethrough']);

    _md.use(anchor, { slugify });

    _md.use(githubAlerts);

    _md.use((md: MarkdownIt) => {
      md.core.ruler.after('inline', 'resolve_relative_post_assets', (state: StateCore) => {
        const slug = typeof state.env?.postSlug === 'string' ? state.env.postSlug : undefined;
        if (!slug) return;

        walkTokens(state.tokens, (token) => {
          if (token.type === 'image') {
            const src = token.attrGet('src');
            if (src) token.attrSet('src', resolvePostAssetUrl(src, slug));
          }

          if (token.type === 'link_open') {
            const href = token.attrGet('href');
            if (href) token.attrSet('href', resolvePostAssetUrl(href, slug));
          }
        });
      });
    });

    // Convert ![alt](src) images to <figure><img><figcaption> when alt is present
    _md.use((md: MarkdownIt) => {
      md.core.ruler.after('resolve_relative_post_assets', 'image_to_figure', (state: StateCore) => {
        for (let i = 0; i < state.tokens.length; i++) {
          const token = state.tokens[i];
          if (token.type !== 'paragraph_open') continue;
          const inline = state.tokens[i + 1];
          if (!inline || inline.type !== 'inline' || !inline.children) continue;
          // Check if paragraph contains only a single image
          const imgs = inline.children.filter((t) => t.type === 'image');
          if (imgs.length !== 1 || inline.children.filter((t) => t.type !== 'image' && t.content?.trim()).length > 0) continue;
          const imgToken = imgs[0];
          const alt = imgToken.children?.map((t) => t.content).join('') || '';
          const src = imgToken.attrGet('src') || '';
          if (!alt) continue;
          // Replace paragraph_open + inline + paragraph_close with raw HTML
          const figureHtml = `<figure><img src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(alt)}" loading="lazy"><figcaption>${md.utils.escapeHtml(alt)}</figcaption></figure>`;
          const htmlToken = new state.Token('html_block', '', 0);
          htmlToken.content = figureHtml + '\n';
          state.tokens.splice(i, 3, htmlToken);
        }
      });
    });

    _md.use(fromHighlighter(highlighter, {
      themes: { light: 'github-light', dark: 'github-dark' },
    }));

    // Normalize unknown language names before shiki processes them
    const originalFence = _md.renderer.rules.fence!;
    _md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const lang = token.info.trim().split(/\s+/)[0];
      if (lang && !loaded.has(lang)) token.info = '';
      return originalFence(tokens, idx, options, env, self);
    };
  }
  return _md;
}

export async function renderMarkdown(content: string, options: RenderMarkdownOptions = {}): Promise<{ html: string; headings: Heading[] }> {
  const md = await getMd();
  return {
    html: md.render(content, { postSlug: options.slug }),
    headings: extractHeadings(content),
  };
}
