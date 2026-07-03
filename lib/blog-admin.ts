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
    validateCloudMusicIds(data.site.cloudMusicIds, errors);
    validateMusicTracks(data.site.music, errors);
    validateCommentConfig(data.site.comments, errors);
  }

  if (Array.isArray(data.links)) {
    validateLinks(data.links, errors);
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

function validateLinks(items: unknown[], errors: string[]): void {
  const seenUrls = new Set<string>();

  items.forEach((link, index) => {
    if (!isRecord(link)) {
      errors.push(`links[${index}] must be an object.`);
      return;
    }

    validateRequiredString(link, `links[${index}].title`, errors, 'title');
    validateRequiredString(link, `links[${index}].description`, errors, 'description');

    const url = typeof link.url === 'string' ? link.url.trim() : '';
    if (!isExternalUrl(url)) {
      errors.push(`links[${index}].url must be an http or https URL.`);
    } else if (seenUrls.has(url)) {
      errors.push(`links[${index}].url duplicates "${url}".`);
    } else {
      seenUrls.add(url);
    }

    validateOptionalAssetPath(link.avatar, `links[${index}].avatar`, errors);
  });
}

function validateCloudMusicIds(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push('site.cloudMusicIds must be an array when provided.');
    return;
  }

  value.forEach((id, index) => {
    if (!/^\d{1,20}$/.test(String(id).trim())) {
      errors.push(`site.cloudMusicIds[${index}] must be a numeric music id.`);
    }
  });
}

function validateMusicTracks(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push('site.music must be an array when provided.');
    return;
  }

  value.forEach((track, index) => {
    if (!isRecord(track)) {
      errors.push(`site.music[${index}] must be an object.`);
      return;
    }

    validateRequiredString(track, `site.music[${index}].title`, errors, 'title');
    validateRequiredString(track, `site.music[${index}].artist`, errors, 'artist');
    validateOptionalPlayableUrl(track.url, `site.music[${index}].url`, errors);
    validateOptionalAssetPath(track.cover, `site.music[${index}].cover`, errors);

    if (track.id !== undefined && !/^[\w.-]{1,100}$/.test(String(track.id).trim())) {
      errors.push(`site.music[${index}].id must contain only letters, numbers, dots, underscores, or hyphens.`);
    }
    if (track.duration !== undefined && (typeof track.duration !== 'number' || track.duration < 0)) {
      errors.push(`site.music[${index}].duration must be a positive number when provided.`);
    }
  });
}

function validateCommentConfig(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push('site.comments must be an object when provided.');
    return;
  }

  if ('clientSecret' in value || 'secret' in value) {
    errors.push('site.comments must not store OAuth secrets. Use GITHUB_CLIENT_SECRET or GITALK_CLIENT_SECRET.');
  }

  if (value.enabled !== undefined && typeof value.enabled !== 'boolean') {
    errors.push('site.comments.enabled must be a boolean.');
  }

  for (const [key, label] of [['repo', 'site.comments.repo'], ['owner', 'site.comments.owner'], ['clientId', 'site.comments.clientId'], ['label', 'site.comments.label']] as const) {
    const current = value[key];
    if (current !== undefined && String(current).trim() && !/^[\w.-]{1,100}$/.test(String(current).trim())) {
      errors.push(`${label} must contain only letters, numbers, dots, underscores, or hyphens.`);
    }
  }

  if (value.admin !== undefined) {
    if (!Array.isArray(value.admin)) {
      errors.push('site.comments.admin must be an array when provided.');
    } else {
      value.admin.forEach((admin, index) => {
        if (!/^[\w.-]{1,100}$/.test(String(admin).trim())) {
          errors.push(`site.comments.admin[${index}] must be a valid GitHub username.`);
        }
      });
    }
  }

  if (value.proxy !== undefined && !isLocalPath(String(value.proxy))) {
    errors.push('site.comments.proxy must be a local API path such as /api/github.');
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

function isExternalUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(value);
}

function isLocalPath(value: string): boolean {
  return /^\/(?!\/)[a-zA-Z0-9/_:.-]+$/.test(value);
}

function validateOptionalPlayableUrl(value: unknown, label: string, errors: string[]): void {
  if (value === undefined || value === null || value === '') {
    return;
  }

  const url = String(value).trim();
  if (!isExternalUrl(url) && !isLocalPath(url)) {
    errors.push(`${label} must be an http(s) URL or a safe local path.`);
  }
}

function validateOptionalAssetPath(value: unknown, label: string, errors: string[]): void {
  validateOptionalPlayableUrl(value, label, errors);
}
