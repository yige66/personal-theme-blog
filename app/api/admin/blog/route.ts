import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { BlobPreconditionFailedError } from '@vercel/blob';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { buildAdminManagementOverview } from '@/lib/admin-management';
import { getBlogData, getBlogStats, getBlogStatsFromData, normalizeBlogData } from '@/lib/blog';
import { createBlogDataRevision, readLocalBlogData, saveBlogData, validateBlogDataDraft } from '@/lib/blog-admin';
import { consumeAdminRateLimit } from '@/lib/admin-rate-limit';
import { isBlobStorageEnabled, readBlogDataBlobSnapshot } from '@/lib/blog-storage';
import { getSiteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const rateLimit = consumeAdminRateLimit(request, 'blog-read', { limit: 60 });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: '后台读取已锁定，请配置 ADMIN_WRITE_TOKEN 并在请求中携带。' },
      { status: 401 }
    );
  }

  const [data, stats] = await Promise.all([getBlogData(), getBlogStats()]);
  return NextResponse.json({
    data,
    stats,
    management: buildAdminManagementOverview(data, stats),
    revision: createBlogDataRevision(data)
  });
}

export async function POST(request: Request) {
  const rateLimit = consumeAdminRateLimit(request, 'blog-write', { limit: 20 });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: '后台写入已锁定，请配置 ADMIN_WRITE_TOKEN 并在请求中携带。' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as { baseRevision?: unknown; data?: unknown };
    const validation = validateBlogDataDraft(body.data);

    if (!validation.ok) {
      return NextResponse.json({ error: '博客数据校验未通过。', details: validation.errors }, { status: 400 });
    }

    if (typeof body.baseRevision !== 'string' || !/^[a-f0-9]{64}$/.test(body.baseRevision)) {
      return NextResponse.json({ error: '请先重新读取线上数据，再保存修改。' }, { status: 409 });
    }

    const currentSnapshot = await readBlogDataBlobSnapshot();
    const currentData = currentSnapshot
      ? normalizeBlogData(JSON.parse(currentSnapshot.content))
      : await getBlogData();
    const currentRevision = createBlogDataRevision(currentData);
    if (body.baseRevision !== currentRevision) {
      return NextResponse.json(
        { error: '线上内容已被其他页面更新，请重新读取后合并修改。', revision: currentRevision },
        { status: 409 }
      );
    }

    const normalizedData = normalizeBlogData(validation.data);
    const result = await saveBlogData(normalizedData, currentSnapshot?.etag ?? null);
    const persistedSnapshot = await readBlogDataBlobSnapshot();
    let persistedData;
    if (isBlobStorageEnabled()) {
      if (!persistedSnapshot) {
        throw new Error('Persisted blog data could not be read from Blob after saving.');
      }
      persistedData = normalizeBlogData(JSON.parse(persistedSnapshot.content));
    } else {
      persistedData = await readLocalBlogData();
    }
    const revision = createBlogDataRevision(normalizedData);
    if (createBlogDataRevision(persistedData) !== revision) {
      throw new Error('Persisted blog data did not match the submitted revision.');
    }
    const stats = getBlogStatsFromData(persistedData);
    revalidatePath('/', 'layout');
    return NextResponse.json({
      data: persistedData,
      stats,
      management: buildAdminManagementOverview(persistedData, stats),
      backupPath: result.backupPath,
      bytes: result.bytes,
      publishedUrl: getSiteUrl().origin,
      revision,
      verified: true,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) {
      return NextResponse.json(
        { error: '线上内容刚刚发生变化，请重新读取后合并修改。' },
        { status: 409 }
      );
    }
    console.error('Failed to save blog data', error);
    return NextResponse.json({ error: '无法保存博客数据，请稍后重试。' }, { status: 500 });
  }
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: '请求过于频繁，请稍后重试。' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}
