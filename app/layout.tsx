import type { Metadata } from 'next';
import { getBlogData } from '@/lib/blog';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getBlogData();
  const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

  return {
    metadataBase,
    title: {
      default: data.site.title,
      template: `%s | ${data.site.title}`
    },
    description: data.site.subtitle,
    openGraph: {
      title: data.site.title,
      description: data.site.subtitle,
      type: 'website',
      images: [data.site.heroImage]
    }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
