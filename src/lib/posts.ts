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
  type: 'post' | 'memo';
}

function readMarkdownFiles(dir: string, type: 'post' | 'memo'): Post[] {
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
      } satisfies Post;
    })
    .sort((a, b) => {
      // Sort by date descending
      return b.date.localeCompare(a.date);
    });
}

const CONTENT_DIR = path.resolve(process.cwd(), 'content');

export function getAllPosts(): Post[] {
  return readMarkdownFiles(path.join(CONTENT_DIR, 'posts'), 'post');
}

export function getAllMemos(): Post[] {
  return readMarkdownFiles(path.join(CONTENT_DIR, 'memos'), 'memo');
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug);
}

export function getMemoBySlug(slug: string): Post | undefined {
  const memos = getAllMemos();
  return memos.find((p) => p.slug === slug);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const normalized = dateStr.replace(/\//g, '-');
  const [year, month, rawDay] = normalized.split('-');
  if (!year || !month || !rawDay) return dateStr;
  const day = rawDay.split(/[T\s]/)[0]; // strip time if present
  return `${year}-${month}-${day}`;
}
