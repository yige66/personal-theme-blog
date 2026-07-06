import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getAiAdminConfigView, normalizeAiConfigInput, saveAiConfig } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: '后台 AI 配置读取已锁定，请配置 ADMIN_WRITE_TOKEN 并在请求中携带。' },
      { status: 401 }
    );
  }

  const config = await getAiAdminConfigView();
  return NextResponse.json({ config });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: '后台 AI 配置写入已锁定，请配置 ADMIN_WRITE_TOKEN 并在请求中携带。' },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'AI 配置请求必须是有效 JSON。' }, { status: 400 });
  }

  const input = normalizeAiConfigInput(body);
  if (!input) {
    return NextResponse.json({ error: 'AI 配置里的接口密钥或模型名称不合法。' }, { status: 400 });
  }

  try {
    const config = await saveAiConfig(input);
    return NextResponse.json({ config, savedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: '无法保存 AI 配置。' }, { status: 500 });
  }
}
