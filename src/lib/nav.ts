import { siteConfig } from './config';

export const mainLinks = siteConfig.navLinks.filter((l) => !l.iconOnly);
export const iconLinks = siteConfig.navLinks.filter((l) => l.iconOnly);

/** Homepage tab a nav link switches to, if any */
export function tabFor(href: string): 'posts' | 'memos' | undefined {
  if (href === '/post') return 'posts';
  if (href === '/memo') return 'memos';
  return undefined;
}

/** Article pages belong to Posts, so every internal page except /memo highlights it */
export function isActive(href: string, currentPath: string): boolean {
  const onMemo = currentPath.replace(/\/+$/, '') === '/memo';
  if (href === '/memo') return onMemo;
  if (href === '/post') return !onMemo;
  return false;
}
