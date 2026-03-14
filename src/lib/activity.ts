import type { Post } from './posts';

/** Extract a Set of YYYY-MM-DD strings from posts */
export function getPostDateSet(posts: Post[]): Set<string> {
  const dates = new Set<string>();
  for (const post of posts) {
    if (!post.date) continue;
    const normalized = post.date.replace(/\//g, '-');
    const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) dates.add(match[1]);
  }
  return dates;
}

/** Build a map of YYYY-MM-DD → slug (first post of that day) */
export function getPostDateSlugMap(posts: Post[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const post of posts) {
    if (!post.date) continue;
    const normalized = post.date.replace(/\//g, '-');
    const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match && !map[match[1]]) {
      map[match[1]] = post.slug;
    }
  }
  return map;
}

export interface GridCell {
  date: string; // YYYY-MM-DD
}

/**
 * Generate grid cells for the last N weeks up to today.
 * Returns cells ordered for CSS grid with `grid-auto-flow: column`
 * (7 rows per column, each column is a week, Mon-Sun top to bottom).
 */
export function generateGrid(weeks: number): { cells: GridCell[]; monthLabels: { text: string; col: number }[] } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the Monday of the current week
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - mondayOffset);

  // Start from (weeks-1) weeks before the current Monday
  const startDate = new Date(currentMonday);
  startDate.setDate(startDate.getDate() - (weeks - 1) * 7);

  const cells: GridCell[] = [];
  const monthLabels: { text: string; col: number }[] = [];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = -1;

  for (let col = 0; col < weeks; col++) {
    for (let row = 0; row < 7; row++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + col * 7 + row);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      cells.push({ date: dateStr });

      // Track month labels (first occurrence of a new month at row 0)
      if (row === 0 && d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        monthLabels.push({ text: MONTHS[d.getMonth()], col });
      }
    }
  }

  return { cells, monthLabels };
}
