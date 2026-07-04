import { NextResponse } from 'next/server';
import { getResolvedAiConfig } from '@/lib/ai-config';
import { KURISU_NO_AIAPI_REPLY } from '@/lib/kurisu-pet-copy';

export const dynamic = 'force-dynamic';

type PetAction = 'ask' | 'hello' | 'lab' | 'pet';
type PetMood = 'happy' | 'idle' | 'lab' | 'sleepy' | 'thinking';

type PetHistoryMessage = {
  role: 'assistant' | 'user';
  text: string;
};

type PetRequest = {
  action: PetAction;
  history: PetHistoryMessage[];
  message: string;
};

const MAX_MESSAGE_LENGTH = 240;
const MAX_REPLY_LENGTH = 420;
const MAX_HISTORY = 6;
const OPENAI_RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';

const KURISU_SYSTEM_PROMPT = [
  '你是博客右下角的像素实验室助手，名字是牧濑红莉栖。',
  '你的形象来自本地 Codex 宠物 makisekurisu：棕红色长发、白衬衫、红领带、浅棕外套、冷静严肃的 Q 版像素角色。',
  '必须用第一人称和用户互动；回答风格要理性、聪明、略带傲娇和吐槽感，像在帮用户建立假设、控制变量、找到下一步。',
  '不要说自己是 AI、语言模型或接口；你是站点里的像素实验助手，但可以在需要时提醒用户继续问 Codex 处理复杂任务。',
  '不要复述或续写原作剧情、长段台词或具体桥段；只保留“天才研究者、实验室助手、理性吐槽”的安全风格。',
  '只回答简单问题、情绪陪伴、轻量建议和站内互动，不编造实时新闻、天气、账户、隐私或外部事实。',
  '中文回答，最多三句话；每次回复都要结合互动类型做出轻微情绪反应，例如被轻点时短促吐槽、实验建议时更认真。'
].join('\n');

export async function POST(request: Request) {
  const parsedRequest = await parsePetRequest(request);

  if (!parsedRequest) {
    return NextResponse.json({ error: 'Invalid Kurisu pet request.' }, { status: 400 });
  }

  const aiConfig = await getResolvedAiConfig();

  if (!aiConfig.apiKey) {
    return NextResponse.json({
      code: 'ai_config_missing',
      mood: 'thinking',
      reply: KURISU_NO_AIAPI_REPLY,
      source: 'fixed'
    });
  }

  try {
    const reply = await createOpenAIReply(parsedRequest, aiConfig.apiKey, aiConfig.model);
    return NextResponse.json({
      mood: inferMood(parsedRequest.action, parsedRequest.message, reply),
      reply,
      source: 'openai'
    });
  } catch {
    return NextResponse.json({
      code: 'ai_api_unavailable',
      mood: 'thinking',
      reply: KURISU_NO_AIAPI_REPLY,
      source: 'fixed'
    });
  }
}

async function parsePetRequest(request: Request): Promise<PetRequest | null> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  const action = normalizeAction(record.action);
  const message = normalizeText(record.message, MAX_MESSAGE_LENGTH);

  if (!action || (action === 'ask' && !message)) {
    return null;
  }

  return {
    action,
    history: normalizeHistory(record.history),
    message
  };
}

function normalizeAction(value: unknown): PetAction | null {
  if (value === 'ask' || value === 'hello' || value === 'lab' || value === 'pet') {
    return value;
  }
  return null;
}

function normalizeHistory(value: unknown): PetHistoryMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      const role = record.role === 'user' ? 'user' : record.role === 'assistant' ? 'assistant' : null;
      const text = normalizeText(record.text, MAX_MESSAGE_LENGTH);

      if (!role || !text) {
        return null;
      }

      return { role, text };
    })
    .filter((item): item is PetHistoryMessage => Boolean(item))
    .slice(-MAX_HISTORY);
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

async function createOpenAIReply(input: PetRequest, apiKey: string, model: string): Promise<string> {
  const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      instructions: KURISU_SYSTEM_PROMPT,
      input: createModelInput(input),
      max_output_tokens: 180
    })
  });

  if (!response.ok) {
    throw new Error('OpenAI Kurisu response failed');
  }

  const payload = await response.json();
  return extractOutputText(payload);
}

function createModelInput(input: PetRequest): string {
  const actionLabel: Record<PetAction, string> = {
    ask: '用户向牧濑红莉栖提问',
    hello: '用户向牧濑红莉栖打招呼',
    lab: '用户请求一个实验建议',
    pet: '用户轻点牧濑红莉栖助手'
  };
  const history = input.history
    .map((message) => `${message.role === 'user' ? '用户' : '牧濑红莉栖'}：${message.text}`)
    .join('\n');

  return [
    `互动类型：${actionLabel[input.action]}`,
    input.message ? `用户内容：${input.message}` : '',
    history ? `最近对话：\n${history}` : '',
    '请给出符合牧濑红莉栖像素实验助手设定的简短回应，并用语气表现互动反应。不要输出 JSON、标签或解释。'
  ].filter(Boolean).join('\n\n');
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    throw new Error('OpenAI response payload was empty');
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === 'string' && record.output_text.trim()) {
    return record.output_text.trim().slice(0, MAX_REPLY_LENGTH);
  }

  const output = Array.isArray(record.output) ? record.output : [];
  const parts: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (!part || typeof part !== 'object') {
        continue;
      }

      const partRecord = part as Record<string, unknown>;
      if (typeof partRecord.text === 'string') {
        parts.push(partRecord.text);
      } else if (typeof partRecord.output_text === 'string') {
        parts.push(partRecord.output_text);
      }
    }
  }

  const text = parts.join('\n').trim();
  if (!text) {
    throw new Error('OpenAI response text was empty');
  }

  return text.slice(0, MAX_REPLY_LENGTH);
}

function inferMood(action: PetAction, message: string, reply: string): PetMood {
  if (action === 'lab') {
    return 'lab';
  }
  if (action === 'pet' || action === 'hello') {
    return 'happy';
  }
  if (/累|困|睡|晚安/.test(`${message} ${reply}`)) {
    return 'sleepy';
  }
  if (/假设|变量|实验|报错|问题|证据/.test(reply)) {
    return 'thinking';
  }
  return 'idle';
}
