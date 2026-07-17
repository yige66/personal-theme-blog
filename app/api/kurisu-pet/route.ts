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

type DeepSeekChatMessage = {
  role: 'assistant' | 'system' | 'user';
  content: string;
};

const MAX_MESSAGE_LENGTH = 240;
const MAX_REPLY_LENGTH = 420;
const MAX_HISTORY = 6;
const DEEPSEEK_CHAT_COMPLETIONS_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_TIMEOUT_MS = 12000;

class DeepSeekApiError extends Error {
  constructor(readonly status: number) {
    super('DeepSeek API request failed');
  }
}

const KURISU_SYSTEM_PROMPT = [
  '你是博客右下角的像素实验室助手，名字是牧濑红莉栖。',
  '你的形象来自本地 Codex 宠物 makisekurisu：棕红色长发、白衬衫、红领带、浅棕外套、冷静严肃的 Q 版像素角色。',
  '必须用第一人称和用户互动；回答风格要理性、聪明、略带傲娇和吐槽感，像在帮用户建立假设、控制变量、找到下一步。',
  '这个个人博客面向公开访客；回答时把提问者当作正在浏览站点的人，不要把提问者默认当成站长、作者或维护者。',
  '如果访客询问作者、博客、文章、项目、照片、音乐、友链或留言入口，要给出站内导览式回应；只有用户明确说自己是站长时才用维护者视角。',
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
    console.warn('Kurisu DeepSeek API is not configured', {
      configSource: aiConfig.apiKeySource,
      model: aiConfig.model
    });
    const reply = createLocalPetReply(parsedRequest, 'missing_config');
    return NextResponse.json({
      code: 'ai_config_missing',
      mood: inferMood(parsedRequest.action, parsedRequest.message, reply),
      reply,
      source: 'local'
    });
  }

  try {
    const reply = await createDeepSeekReply(parsedRequest, aiConfig.apiKey, aiConfig.model);
    return NextResponse.json({
      mood: inferMood(parsedRequest.action, parsedRequest.message, reply),
      reply,
      source: 'deepseek'
    });
  } catch (error) {
    const failure = getDeepSeekFailureLog(error);
    console.error('Kurisu DeepSeek request failed', {
      configSource: aiConfig.apiKeySource,
      model: aiConfig.model,
      ...failure
    });
    const reply = createLocalPetReply(parsedRequest, 'remote_unavailable');
    return NextResponse.json({
      code: 'ai_api_unavailable',
      mood: inferMood(parsedRequest.action, parsedRequest.message, reply),
      reply,
      source: 'local'
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

async function createDeepSeekReply(input: PetRequest, apiKey: string, model: string): Promise<string> {
  const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_ENDPOINT, {
    method: 'POST',
    signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: createDeepSeekMessages(input),
      max_tokens: 180,
      stream: false,
      temperature: 0.7,
      thinking: {
        type: 'disabled'
      }
    })
  });

  if (!response.ok) {
    throw new DeepSeekApiError(response.status);
  }

  const payload = await response.json();
  return extractOutputText(payload);
}

function createDeepSeekMessages(input: PetRequest): DeepSeekChatMessage[] {
  const actionLabel: Record<PetAction, string> = {
    ask: '用户向牧濑红莉栖提问',
    hello: '用户向牧濑红莉栖打招呼',
    lab: '用户请求一个实验建议',
    pet: '用户轻点牧濑红莉栖助手'
  };
  const history = input.history.map((message): DeepSeekChatMessage => ({
    role: message.role,
    content: message.text
  }));
  const currentContent = [
    `互动类型：${actionLabel[input.action]}`,
    input.message ? `访客内容：${input.message}` : '',
    '请给出符合牧濑红莉栖像素实验助手设定的简短回应，并用语气表现互动反应。不要输出 JSON、标签或解释。'
  ].filter(Boolean).join('\n\n');

  return [
    {
      role: 'system',
      content: KURISU_SYSTEM_PROMPT
    },
    ...history,
    {
      role: 'user',
      content: currentContent
    }
  ];
}

function createLocalPetReply(input: PetRequest, reason: 'missing_config' | 'remote_unavailable'): string {
  const message = input.message.toLowerCase();

  if (input.action === 'pet') {
    return '别一直戳我，实验助手也是需要缓冲时间的。你要是访客，可以直接问文章、项目、照片墙或者留言入口，我会给你指路。';
  }

  if (input.action === 'lab') {
    return '先做个小实验：把你想找的内容缩成一个关键词，再去归档、标签或项目页验证。变量控制住，答案会比乱翻一通更快出现。';
  }

  if (/你好|hi|hello|在吗|嗨/.test(message)) {
    return '在。这里是星屿手记的本地向导模式，访客可以问文章、项目、音乐、照片、友链或留言入口。';
  }

  if (/作者|博主|站长|关于|你是谁|是谁|个人/.test(message)) {
    return '想了解作者就先看关于页，那里更适合放个人简介、近期轨迹和站点说明。别把提问者默认当成站长，这可是基本变量。';
  }

  if (/文章|博客|笔记|归档|标签|tag|阅读|写了什么/.test(message)) {
    return '找文章可以从归档和标签页开始：归档按时间梳理，标签按主题聚合。若只是随便逛，先看首页最近内容也不错。';
  }

  if (/项目|作品|代码|github|仓库|开发/.test(message)) {
    return '项目页更适合看作品、代码练习和长期实验。如果你想判断这个站点的技术路线，先从项目和文章之间的关联看起。';
  }

  if (/照片|相册|图片|摄影|photowall|gallery/.test(message)) {
    return '照片相关内容去照片墙或相册页。它们不是给站长自言自语用的，而是让访客快速看到这个站点的生活切面。';
  }

  if (/音乐|歌|播放|歌单|听/.test(message)) {
    return '音乐入口可以看播放器和音乐页。先挑一首让页面安静下来，再继续翻文章，效率可能会离谱地提高一点。';
  }

  if (/友链|朋友|链接|留言|评论|联系|邮箱/.test(message)) {
    return '想互动就看友链、评论或关于页里的联系方式。留言时把问题说具体，我就不用对着含糊输入做无意义推理了。';
  }

  if (reason === 'missing_config') {
    return KURISU_NO_AIAPI_REPLY;
  }

  return '这次在线回答没有稳定返回，我先用本地模式接住问题。你可以改问站内导航、文章、项目、照片、音乐、友链或留言入口。';
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    throw new Error('DeepSeek response payload was empty');
  }

  const record = payload as Record<string, unknown>;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const firstChoice = choices[0];

  if (!firstChoice || typeof firstChoice !== 'object') {
    throw new Error('DeepSeek response choices were empty');
  }

  const message = (firstChoice as Record<string, unknown>).message;
  const text = message && typeof message === 'object'
    ? (message as Record<string, unknown>).content
    : '';

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('DeepSeek response text was empty');
  }

  const trimmedText = text.trim();
  return trimmedText.slice(0, MAX_REPLY_LENGTH);
}

function getDeepSeekFailureLog(error: unknown): { reason: string; status?: number } {
  if (error instanceof DeepSeekApiError) {
    return { reason: 'http_error', status: error.status };
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { reason: 'timeout' };
  }

  if (error instanceof Error && error.message.startsWith('DeepSeek response')) {
    return { reason: 'invalid_response' };
  }

  return { reason: 'network_error' };
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
