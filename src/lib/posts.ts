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
  type: 'post';
}

function readMarkdownFiles(dir: string, type: 'post'): Post[] {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

  return files
    .map((file) => {
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);

      const slug = data.slug || file.replace(/\.md$/, '');

      return {
        title: data.title || slug,
        date: data.date ? String(data.date) : '',
        slug,
        content,
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

const CONTENT_DIR = path.resolve(process.cwd(), 'content');

export function getAllPosts(): Post[] {
  return readMarkdownFiles(path.join(CONTENT_DIR, 'posts'), 'post');
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug);
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
