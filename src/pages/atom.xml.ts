import type { APIRoute } from 'astro';
import { getAllPosts, getAllMemos } from '../lib/posts';
import { siteConfig } from '../lib/config';

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
    const url = `${siteConfig.url}/${post.slug}`;
    const dateIso = post.date ? new Date(post.date).toISOString() : new Date().toISOString();

    return `  <entry>
    <id>${escapeXml(url)}</id>
    <title>${escapeXml(post.title)}</title>
    <link href="${escapeXml(url)}" />
    <updated>${dateIso}</updated>
    <published>${dateIso}</published>
    <author>
      <name>${escapeXml(siteConfig.author)}</name>
    </author>
    <content type="html">${escapeXml(post.content.slice(0, 2000))}</content>
  </entry>`;
  });

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${siteConfig.url}/atom.xml</id>
  <title>${escapeXml(siteConfig.title)}</title>
  <link href="${siteConfig.url}" />
  <link rel="self" href="${siteConfig.url}/atom.xml" />
  <updated>${updated}</updated>
  <author>
    <name>${escapeXml(siteConfig.author)}</name>
  </author>
${entries.join('\n')}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  });
};
