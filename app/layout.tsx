import type { Metadata } from 'next';
import { getBlogData } from '@/lib/blog';
import { createSiteMetadata } from '@/lib/seo';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getBlogData();
  return createSiteMetadata(data.site);
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
