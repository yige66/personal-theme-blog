import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getBlogData, getBlogStats } from '@/lib/blog';
import { saveBlogData, validateBlogDataDraft } from '@/lib/blog-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: 'Admin read access is locked. Configure ADMIN_WRITE_TOKEN and send it with the request.' },
      { status: 401 }
    );
  }

  const [data, stats] = await Promise.all([getBlogData(), getBlogStats()]);
  return NextResponse.json({ data, stats });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: 'Admin write access is locked. Configure ADMIN_WRITE_TOKEN and send it with the request.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as { data?: unknown };
    const validation = validateBlogDataDraft(body.data);

    if (!validation.ok) {
      return NextResponse.json({ error: 'Blog data failed validation.', details: validation.errors }, { status: 400 });
    }

    const result = await saveBlogData(validation.data);
    revalidatePath('/', 'layout');
    return NextResponse.json({
      data: validation.data,
      backupPath: result.backupPath,
      bytes: result.bytes,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save blog data.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
