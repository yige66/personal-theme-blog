import { NextResponse } from 'next/server';
import { saveAdminImageFile, validateAdminImageFile } from '@/lib/admin-assets';
import { isAdminAuthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: 'Admin asset upload is locked. Configure ADMIN_WRITE_TOKEN and send it with the request.' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!isUploadFile(file)) {
      return NextResponse.json({ error: '请选择一张图片再上传。' }, { status: 400 });
    }

    const validation = validateAdminImageFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const saved = await saveAdminImageFile(file);
    return NextResponse.json({
      path: saved.publicPath,
      fileName: saved.fileName,
      originalName: saved.originalName,
      bytes: saved.bytes
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '图片上传失败。';
    return NextResponse.json({ error: message }, { status: 500 });
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
