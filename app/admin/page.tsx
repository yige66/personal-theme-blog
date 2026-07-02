import type { Metadata } from 'next';
import { BlogAdminConsole } from '@/components/admin/BlogAdminConsole';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getBlogStats } from '@/lib/blog';

export const metadata: Metadata = {
  title: '博客后台操作系统',
  description: '维护个人博客内容、图片、文章、项目、栏目和后台数据。',
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [data, stats] = await Promise.all([getBlogData(), getBlogStats()]);
  const themeColor = data.site.themeColor;
  const accentColor = data.site.accentColor;

  return (
    <main className="admin-os article-page" style={{ '--theme': themeColor, '--accent': accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <BlogAdminConsole initialData={data} initialStats={stats} />
    </main>
  );
}
