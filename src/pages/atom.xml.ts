import type { APIRoute } from 'astro';
import { getAllPosts, getAllMemos } from '../lib/posts';

const SITE_URL = 'https://coin-blog.pages.dev';
const SITE_TITLE = "Coin's Blog";
const SITE_AUTHOR = 'Coin';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = () => {
  const posts = getAllPosts();
  const memos = getAllMemos();

  // Combine and sort by date
  const all = [...posts, ...memos].sort((a, b) => b.date.localeCompare(a.date));

  const updated = all.length > 0 ? new Date(all[0].date).toISOString() : new Date().toISOString();

  const entries = all.map((post) => {
    const url = `${SITE_URL}/${post.slug}`;
    const dateIso = post.date ? new Date(post.date).toISOString() : new Date().toISOString();

    return `  <entry>
    <id>${escapeXml(url)}</id>
    <title>${escapeXml(post.title)}</title>
    <link href="${escapeXml(url)}" />
    <updated>${dateIso}</updated>
    <published>${dateIso}</published>
    <author>
      <name>${escapeXml(SITE_AUTHOR)}</name>
    </author>
    <content type="html">${escapeXml(post.content.slice(0, 2000))}</content>
  </entry>`;
  });

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${SITE_URL}/atom.xml</id>
  <title>${escapeXml(SITE_TITLE)}</title>
  <link href="${SITE_URL}" />
  <link rel="self" href="${SITE_URL}/atom.xml" />
  <updated>${updated}</updated>
  <author>
    <name>${escapeXml(SITE_AUTHOR)}</name>
  </author>
${entries.join('\n')}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  });
};
