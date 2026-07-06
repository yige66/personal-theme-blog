import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { buildAdminManagementOverview } from '@/lib/admin-management';
import { getBlogData, getBlogStats } from '@/lib/blog';
import { saveBlogData, validateBlogDataDraft } from '@/lib/blog-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: '后台读取已锁定，请配置 ADMIN_WRITE_TOKEN 并在请求中携带。' },
      { status: 401 }
    );
  }

  const [data, stats] = await Promise.all([getBlogData(), getBlogStats()]);
  return NextResponse.json({ data, stats, management: buildAdminManagementOverview(data, stats) });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: '后台写入已锁定，请配置 ADMIN_WRITE_TOKEN 并在请求中携带。' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as { data?: unknown };
    const validation = validateBlogDataDraft(body.data);

    if (!validation.ok) {
      return NextResponse.json({ error: '博客数据校验未通过。', details: validation.errors }, { status: 400 });
    }

    const result = await saveBlogData(validation.data);
    const stats = await getBlogStats();
    revalidatePath('/', 'layout');
    return NextResponse.json({
      data: validation.data,
      stats,
      management: buildAdminManagementOverview(validation.data, stats),
      backupPath: result.backupPath,
      bytes: result.bytes,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '无法保存博客数据。';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
