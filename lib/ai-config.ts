import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type AiConfigSource = 'backend' | 'env' | 'none';

export type AiModelOption = {
  label: string;
  value: string;
};

export type AiAdminConfigView = {
  apiKeySource: AiConfigSource;
  hasApiKey: boolean;
  model: string;
  modelOptions: AiModelOption[];
  updatedAt: string | null;
};

export type ResolvedAiConfig = {
  apiKey: string;
  apiKeySource: AiConfigSource;
  model: string;
};

type StoredAiConfig = {
  apiKey?: string;
  model?: string;
  updatedAt?: string;
};

type SaveAiConfigInput = {
  apiKey?: string;
  clearApiKey?: boolean;
  model?: string;
};

const AI_CONFIG_FILE = path.join(process.cwd(), 'data', 'ai-config.json');
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';

export const AI_MODEL_OPTIONS: AiModelOption[] = [
  { label: 'GPT-4.1 mini（轻量推荐）', value: 'gpt-4.1-mini' },
  { label: 'GPT-4.1（更强理解）', value: 'gpt-4.1' },
  { label: 'GPT-4o mini（低成本）', value: 'gpt-4o-mini' },
  { label: 'GPT-4o（多模态通用）', value: 'gpt-4o' }
];

export async function getResolvedAiConfig(): Promise<ResolvedAiConfig> {
  const stored = await readStoredAiConfig();
  const storedApiKey = normalizeApiKey(stored.apiKey);
  const envApiKey = normalizeApiKey(process.env.OPENAI_API_KEY);
  const storedModel = normalizeModel(stored.model);
  const envModel = normalizeModel(process.env.OPENAI_PET_MODEL || process.env.OPENAI_SHEEP_MODEL || process.env.OPENAI_MODEL);

  return {
    apiKey: storedApiKey || envApiKey,
    apiKeySource: storedApiKey ? 'backend' : envApiKey ? 'env' : 'none',
    model: storedModel || envModel || DEFAULT_OPENAI_MODEL
  };
}

export async function getAiAdminConfigView(): Promise<AiAdminConfigView> {
  const stored = await readStoredAiConfig();
  const resolved = await getResolvedAiConfig();

  return {
    apiKeySource: resolved.apiKeySource,
    hasApiKey: Boolean(resolved.apiKey),
    model: resolved.model,
    modelOptions: AI_MODEL_OPTIONS,
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : null
  };
}

export async function saveAiConfig(input: SaveAiConfigInput): Promise<AiAdminConfigView> {
  const current = await readStoredAiConfig();
  const model = normalizeModel(input.model) || normalizeModel(current.model) || DEFAULT_OPENAI_MODEL;
  const nextApiKey = input.clearApiKey
    ? ''
    : normalizeApiKey(input.apiKey) || normalizeApiKey(current.apiKey);
  const nextConfig: StoredAiConfig = {
    model,
    updatedAt: new Date().toISOString()
  };

  if (nextApiKey) {
    nextConfig.apiKey = nextApiKey;
  }

  await writeStoredAiConfig(nextConfig);
  return getAiAdminConfigView();
}

export function normalizeAiConfigInput(input: unknown): SaveAiConfigInput | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as Record<string, unknown>;
  const apiKey = typeof record.apiKey === 'string' ? record.apiKey : undefined;
  const model = typeof record.model === 'string' ? record.model : undefined;
  const clearApiKey = record.clearApiKey === true;

  if (apiKey !== undefined && apiKey.trim() && !normalizeApiKey(apiKey)) {
    return null;
  }

  if (model !== undefined && !normalizeModel(model)) {
    return null;
  }

  return { apiKey, clearApiKey, model };
}

async function readStoredAiConfig(): Promise<StoredAiConfig> {
  if (!existsSync(AI_CONFIG_FILE)) {
    return {};
  }

  try {
    const raw = await readFile(AI_CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const record = parsed as Record<string, unknown>;
    return {
      apiKey: typeof record.apiKey === 'string' ? record.apiKey : undefined,
      model: typeof record.model === 'string' ? record.model : undefined,
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined
    };
  } catch {
    return {};
  }
}

async function writeStoredAiConfig(config: StoredAiConfig): Promise<void> {
  await mkdir(path.dirname(AI_CONFIG_FILE), { recursive: true });
  const temporaryFile = path.join(path.dirname(AI_CONFIG_FILE), `ai-config.${Date.now()}.tmp.json`);
  const json = `${JSON.stringify(config, null, 2)}\n`;

  await writeFile(temporaryFile, json, 'utf8');
  await rename(temporaryFile, AI_CONFIG_FILE);
}

function normalizeApiKey(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 512 || /[\s\0]/.test(trimmed)) {
    return '';
  }

  return trimmed;
}

function normalizeModel(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 100 || !/^[A-Za-z0-9._:-]+$/.test(trimmed)) {
    return '';
  }

  return trimmed;
}
