import type { MetadataRoute } from 'next';
import { getBlogData } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const data = await getBlogData();

  return {
    name: data.site.title,
    short_name: data.site.title.slice(0, 12),
    description: data.site.subtitle,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#090d12',
    theme_color: data.site.themeColor,
    icons: [
      {
        src: data.site.avatar,
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ]
  };
}
