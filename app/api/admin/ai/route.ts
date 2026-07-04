import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getAiAdminConfigView, normalizeAiConfigInput, saveAiConfig } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: 'Admin AI config access is locked. Configure ADMIN_WRITE_TOKEN and send it with the request.' },
      { status: 401 }
    );
  }

  const config = await getAiAdminConfigView();
  return NextResponse.json({ config });
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: 'Admin AI config write access is locked. Configure ADMIN_WRITE_TOKEN and send it with the request.' },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'AI config request must be valid JSON.' }, { status: 400 });
  }

  const input = normalizeAiConfigInput(body);
  if (!input) {
    return NextResponse.json({ error: 'AI config contains an invalid API key or model name.' }, { status: 400 });
  }

  try {
    const config = await saveAiConfig(input);
    return NextResponse.json({ config, savedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'Unable to save AI config.' }, { status: 500 });
  }
}
