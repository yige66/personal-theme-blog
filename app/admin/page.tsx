import type { Metadata } from 'next';
import { BlogAdminConsole } from '@/components/admin/BlogAdminConsole';
import { buildAdminManagementOverview } from '@/lib/admin-management';
import { getBlogData, getBlogStats } from '@/lib/blog';

export const metadata: Metadata = {
  title: '站点后台',
  description: '仅限本人使用的站点内容维护后台。',
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
  const overview = buildAdminManagementOverview(data, stats);

  return (
    <main className="admin-os admin-private-page article-page" style={{ '--theme': themeColor, '--accent': accentColor } as React.CSSProperties}>
      <BlogAdminConsole initialData={data} initialStats={stats} initialOverview={overview} />
    </main>
  );
}
