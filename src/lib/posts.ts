import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface PostMeta {
  title: string;
  date: string;
  slug: string;
}

export interface Post extends PostMeta {
  content: string;
  sourcePath: string;
  assetsDir: string;
  type: 'post';
}

export interface PostAsset {
  routePath: string;
  sourcePath: string;
}

const POSTS_DIR = path.resolve(process.cwd(), 'posts');

function getPostSources(dir: string): Array<{ filePath: string; slug: string; assetsDir: string }> {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.name === 'draft') return [];

      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const filePath = path.join(entryPath, 'index.md');
        if (!fs.existsSync(filePath)) return [];
        return [{
          filePath,
          slug: entry.name,
          assetsDir: path.join(entryPath, 'assets'),
        }];
      }

      if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = entry.name.replace(/\.md$/, '');
        return [{
          filePath: entryPath,
          slug,
          assetsDir: path.join(dir, `${slug}.assets`),
        }];
      }

      return [];
    });
}

function readMarkdownFiles(dir: string, type: 'post'): Post[] {
  return getPostSources(dir)
    .map(({ filePath, slug, assetsDir }) => {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);

      return {
        title: data.title || slug,
        date: data.date ? String(data.date) : '',
        slug,
        content,
        sourcePath: filePath,
        assetsDir,
        type,
        published: data.published,
      };
    })
    .filter((item) => {
      if (type === 'post') return item.published === true;
      return true;
    })
    .map(({ published, ...rest }) => rest satisfies Post)
    .sort((a, b) => {
      return b.date.localeCompare(a.date);
    });
}

export function getAllPosts(): Post[] {
  return readMarkdownFiles(POSTS_DIR, 'post');
}

export function getAllPostAssets(): PostAsset[] {
  return getAllPosts().flatMap((post) => {
    if (!fs.existsSync(post.assetsDir)) return [];

    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(entryPath);
        if (entry.isFile()) files.push(entryPath);
      }
    };

    walk(post.assetsDir);

    return files.map((sourcePath) => {
      const rel = path.relative(path.dirname(post.sourcePath), sourcePath).split(path.sep).join('/');
      return {
        routePath: `${post.slug}/${rel}`,
        sourcePath,
      };
    });
  });
}

/** Estimate reading time in minutes (Chinese ~300 chars/min, English ~200 words/min) */
export function estimateReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = content.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(Boolean).length;
  const minutes = chineseChars / 300 + englishWords / 200;
  return Math.max(1, Math.round(minutes));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const normalized = dateStr.replace(/\//g, '-');
  const [year, month, rawDay] = normalized.split('-');
  if (!year || !month || !rawDay) return dateStr;
  const day = rawDay.split(/[T\s]/)[0];
  return `${year}-${month}-${day}`;
}
