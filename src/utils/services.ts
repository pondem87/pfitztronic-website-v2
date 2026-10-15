import { getCollection, type CollectionEntry } from 'astro:content';

export async function getServices() {
  return (await getCollection('services'))
    .sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}

export function serviceUrl(service: CollectionEntry<'services'>) {
  return `/services/${service.id}/`;
}
