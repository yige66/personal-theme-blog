import type { Metadata } from 'next';
import { BlogAdminConsole } from '@/components/admin/BlogAdminConsole';

export const metadata: Metadata = {
  title: '站点后台',
  description: '仅限本人使用的站点内容维护后台。',
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <main className="admin-os admin-private-page article-page">
      <BlogAdminConsole initialData={null} initialStats={null} initialOverview={null} />
    </main>
  );
}
