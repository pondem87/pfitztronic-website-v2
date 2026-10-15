import type { CollectionEntry } from 'astro:content';

export function newestFirst(a: CollectionEntry<'blogs'>, b: CollectionEntry<'blogs'>) {
  return b.data.published.getTime() - a.data.published.getTime() || a.id.localeCompare(b.id);
}

export function blogUrl(post: CollectionEntry<'blogs'>) {
  return `/blog/${post.id}/`;
}

export function formatBlogDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}
