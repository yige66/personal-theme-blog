import { NextResponse } from 'next/server';
import { saveAdminAudioFile, saveAdminImageFile, validateAdminAudioFile, validateAdminImageFile } from '@/lib/admin-assets';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { consumeAdminRateLimit } from '@/lib/admin-rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rateLimit = consumeAdminRateLimit(request, 'asset-write', { limit: 10 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: '上传请求过于频繁，请稍后重试。' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: '后台素材上传已锁定，请配置 ADMIN_WRITE_TOKEN 并在请求中携带。' },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const kindParam = url.searchParams.get('kind');
    const kind = kindParam === 'audio' ? 'audio' : 'image';
    const formData = await request.formData();
    const file = formData.get('file');

    if (!isUploadFile(file)) {
      return NextResponse.json({ error: kind === 'audio' ? '请选择一个音乐文件再上传。' : '请选择一张图片再上传。' }, { status: 400 });
    }

    const validation = kind === 'audio' ? validateAdminAudioFile(file) : validateAdminImageFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const saved = kind === 'audio' ? await saveAdminAudioFile(file) : await saveAdminImageFile(file);
    return NextResponse.json({
      path: saved.publicPath,
      fileName: saved.fileName,
      originalName: saved.originalName,
      bytes: saved.bytes,
      kind
    });
  } catch (error) {
    console.error('Failed to upload admin asset', error);
    return NextResponse.json({ error: '文件上传失败，请稍后重试。' }, { status: 500 });
  }
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const file = value as File;
  return (
    typeof file.arrayBuffer === 'function' &&
    typeof file.name === 'string' &&
    typeof file.type === 'string' &&
    typeof file.size === 'number'
  );
}
