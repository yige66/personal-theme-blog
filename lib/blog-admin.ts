import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BlogData } from '@/lib/blog';

type ValidationSuccess = {
  ok: true;
  data: BlogData;
};

type ValidationFailure = {
  ok: false;
  errors: string[];
};

export type BlogDataValidationResult = ValidationSuccess | ValidationFailure;

const dataFile = path.join(process.cwd(), 'data', 'blog.json');
const backupDirectory = path.join(process.cwd(), 'data', 'backups');

export function validateBlogDataDraft(input: unknown): BlogDataValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ['Blog data must be a JSON object.'] };
  }

  const data = input as Partial<BlogData>;
  if (!isRecord(data.site)) {
    errors.push('site must be an object.');
  }

  for (const key of ['links', 'notes', 'chatters', 'projects', 'posts'] as const) {
    if (!Array.isArray(data[key])) {
      errors.push(`${key} must be an array.`);
    }
  }

  if (isRecord(data.site)) {
    validateRequiredString(data.site, 'site.title', errors);
    validateRequiredString(data.site, 'site.owner', errors);
    validateRequiredString(data.site, 'site.heroImage', errors);
    validateRequiredString(data.site, 'site.avatar', errors);
    validateOptionalArray(data.site.backgroundImages, 'site.backgroundImages', errors);
    validateOptionalArray(data.site.columns, 'site.columns', errors);
    validateOptionalArray(data.site.music, 'site.music', errors);
    validateOptionalArray(data.site.gallery, 'site.gallery', errors);
  }

  if (Array.isArray(data.posts)) {
    validateUniqueIds(data.posts, 'posts', errors);
    validateUniqueField(data.posts, 'slug', 'posts', errors);
    data.posts.forEach((post, index) => {
      if (!isRecord(post)) {
        errors.push(`posts[${index}] must be an object.`);
        return;
      }
      validateRequiredString(post, `posts[${index}].id`, errors, 'id');
      validateRequiredString(post, `posts[${index}].slug`, errors, 'slug');
      validateRequiredString(post, `posts[${index}].title`, errors, 'title');
      validateRequiredString(post, `posts[${index}].summary`, errors, 'summary');
      validateRequiredString(post, `posts[${index}].content`, errors, 'content');
      validateRequiredString(post, `posts[${index}].cover`, errors, 'cover');
      if (post.status !== 'published' && post.status !== 'draft') {
        errors.push(`posts[${index}].status must be "published" or "draft".`);
      }
      validateOptionalArray(post.tags, `posts[${index}].tags`, errors);
    });
  }

  if (Array.isArray(data.projects)) {
    validateUniqueIds(data.projects, 'projects', errors);
  }

  if (Array.isArray(data.notes)) {
    validateUniqueIds(data.notes, 'notes', errors);
  }

  if (Array.isArray(data.chatters)) {
    validateUniqueIds(data.chatters, 'chatters', errors);
    validateUniqueField(data.chatters, 'slug', 'chatters', errors);
  }

  const columns = isRecord(data.site) && Array.isArray(data.site.columns) ? data.site.columns : [];
  validateUniqueIds(columns, 'site.columns', errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: data as BlogData };
}

export function validateUniqueIds(items: unknown[], label: string, errors: string[]): void {
  validateUniqueField(items, 'id', label, errors);
}

export async function saveBlogData(data: BlogData): Promise<{ backupPath: string | null; bytes: number }> {
  const validation = validateBlogDataDraft(data);
  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'));
  }

  const backupPath = await createBlogDataBackup();
  const json = `${JSON.stringify(validation.data, null, 2)}\n`;
  const temporaryFile = path.join(path.dirname(dataFile), `blog.${Date.now()}.tmp.json`);

  await writeFile(temporaryFile, json, 'utf8');
  await rename(temporaryFile, dataFile);

  return {
    backupPath,
    bytes: Buffer.byteLength(json, 'utf8')
  };
}

export async function createBlogDataBackup(): Promise<string | null> {
  if (!existsSync(dataFile)) {
    return null;
  }

  await mkdir(backupDirectory, { recursive: true });
  const raw = await readFile(dataFile, 'utf8');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDirectory, `blog-${stamp}.json`);
  await writeFile(backupPath, raw, 'utf8');
  return backupPath;
}

function validateRequiredString(record: Record<string, unknown>, label: string, errors: string[], key = label.split('.').at(-1) || label): void {
  if (typeof record[key] !== 'string' || !record[key].trim()) {
    errors.push(`${label} must be a non-empty string.`);
  }
}

function validateOptionalArray(value: unknown, label: string, errors: string[]): void {
  if (value !== undefined && !Array.isArray(value)) {
    errors.push(`${label} must be an array when provided.`);
  }
}

function validateUniqueField(items: unknown[], field: string, label: string, errors: string[]): void {
  const seen = new Set<string>();

  items.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`${label}[${index}] must be an object.`);
      return;
    }

    const value = item[field];
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${label}[${index}].${field} must be a non-empty string.`);
      return;
    }

    if (seen.has(value)) {
      errors.push(`${label}[${index}].${field} duplicates "${value}".`);
    }
    seen.add(value);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
