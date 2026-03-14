import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { fromHighlighter } from '@shikijs/markdown-it';
import { createHighlighter } from 'shiki';

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

export async function renderMarkdown(content: string): Promise<{ html: string; headings: Heading[] }> {
  const md = await getMd();
  return {
    html: md.render(content),
    headings: extractHeadings(content),
  };
}
