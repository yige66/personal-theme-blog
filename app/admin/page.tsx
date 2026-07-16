import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AdminAccessGate } from '@/components/admin/AdminAccessGate';
import { BlogAdminConsole } from '@/components/admin/BlogAdminConsole';
import { ADMIN_SESSION_COOKIE, isAdminSessionAuthorized } from '@/lib/admin-auth';

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
  const cookieStore = await cookies();
  const hasSession = isAdminSessionAuthorized(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  const allowLocalDevelopment = process.env.NODE_ENV !== 'production' && process.env.LOCAL_ADMIN_BYPASS === 'true';

  return (
    <main className="admin-os admin-private-page article-page">
      {hasSession || allowLocalDevelopment ? (
        <BlogAdminConsole initialData={null} initialStats={null} initialOverview={null} />
      ) : (
        <AdminAccessGate />
      )}
    </main>
  );
}
