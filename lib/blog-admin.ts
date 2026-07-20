import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeBlogData, type BlogData } from './blog.ts';
import { assertBlogStorageWritable, isBlobStorageEnabled, saveBlogDataBlob } from './blog-storage.ts';

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

/** Reads the file-backed blog data after a local save for exact persistence verification. */
export async function readLocalBlogData(): Promise<BlogData> {
  if (!existsSync(dataFile)) {
    throw new Error('Local blog data file does not exist after saving.');
  }

  const raw = await readFile(dataFile, 'utf8');
  return normalizeBlogData(JSON.parse(raw) as Partial<BlogData>);
}

export function createBlogDataRevision(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export function validateBlogDataDraft(input: unknown): BlogDataValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ['博客数据必须是 JSON 对象。'] };
  }

  validateUnicodeText(input, 'root', errors);

  const data = input as Partial<BlogData>;
  if (!isRecord(data.site)) {
    errors.push('site 必须是对象。');
  }

  for (const key of ['links', 'notes', 'chatters', 'projects', 'posts'] as const) {
    if (!Array.isArray(data[key])) {
      errors.push(`${key} 必须是数组。`);
    }
  }

  if (isRecord(data.site)) {
    validateRequiredString(data.site, 'site.title', errors);
    validateRequiredString(data.site, 'site.owner', errors);
    validateRequiredString(data.site, 'site.heroImage', errors);
    validateOptionalAssetPath(data.site.aboutHeroImage, 'site.aboutHeroImage', errors);
    validateRequiredString(data.site, 'site.avatar', errors);
    validateOptionalArray(data.site.backgroundImages, 'site.backgroundImages', errors);
    validateOptionalArray(data.site.columns, 'site.columns', errors);
    validateProjectOrder(data.site.projectOrder, errors);
    validateOptionalArray(data.site.music, 'site.music', errors);
    validateOptionalArray(data.site.gallery, 'site.gallery', errors);
    validatePageContentMap(data.site.pages, errors);
    validateCloudMusicIds(data.site.cloudMusicIds, errors);
    validateMusicTracks(data.site.music, errors);
    validateCommentConfig(data.site.comments, errors);
    validateTagLibrary(data.site.tags, errors);
  }

  const allowedTagKeys = collectAllowedTagKeys(isRecord(data.site) ? data.site.tags : []);

  if (Array.isArray(data.links)) {
    validateLinks(data.links, errors);
  }

  if (Array.isArray(data.posts)) {
    validateUniqueIds(data.posts, 'posts', errors);
    validateUniqueField(data.posts, 'slug', 'posts', errors);
    data.posts.forEach((post, index) => {
      if (!isRecord(post)) {
        errors.push(`posts[${index}] 必须是对象。`);
        return;
      }
      validateRequiredString(post, `posts[${index}].id`, errors, 'id');
      validateRequiredString(post, `posts[${index}].slug`, errors, 'slug');
      validateRequiredString(post, `posts[${index}].title`, errors, 'title');
      validateRequiredString(post, `posts[${index}].summary`, errors, 'summary');
      validateRequiredString(post, `posts[${index}].content`, errors, 'content');
      validateRequiredString(post, `posts[${index}].cover`, errors, 'cover');
      if (post.status !== 'published' && post.status !== 'draft') {
        errors.push(`posts[${index}].status 必须是 "published" 或 "draft"。`);
      }
      validateCuratedTagList(post.tags, `posts[${index}].tags`, allowedTagKeys, errors);
    });
  }

  if (Array.isArray(data.projects)) {
    validateUniqueIds(data.projects, 'projects', errors);
  }

  if (Array.isArray(data.notes)) {
    validateUniqueIds(data.notes, 'notes', errors);
    data.notes.forEach((note, index) => validateMomentHasNoTags(note, index, errors));
  }

  if (Array.isArray(data.chatters)) {
    validateUniqueIds(data.chatters, 'chatters', errors);
    validateUniqueField(data.chatters, 'slug', 'chatters', errors);
    data.chatters.forEach((chatter, index) => {
      if (!isRecord(chatter)) {
        return;
      }
      validateCuratedTagList(chatter.tags, `chatters[${index}].tags`, allowedTagKeys, errors);
    });
  }

  const columns = isRecord(data.site) && Array.isArray(data.site.columns) ? data.site.columns : [];
  validateUniqueIds(columns, 'site.columns', errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: data as BlogData };
}

function validateUnicodeText(value: unknown, label: string, errors: string[]): void {
  if (errors.length >= 20) {
    return;
  }

  if (typeof value === 'string') {
    if (value.includes('\uFFFD')) {
      errors.push(`${label} contains the Unicode replacement character; please restore this text from a clean UTF-8 source.`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => validateUnicodeText(item, `${label}[${index}]`, errors));
    return;
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, item]) => validateUnicodeText(item, label === 'root' ? key : `${label}.${key}`, errors));
  }
}

export function validateUniqueIds(items: unknown[], label: string, errors: string[]): void {
  validateUniqueField(items, 'id', label, errors);
}

export async function saveBlogData(data: BlogData, expectedEtag: string | null = null): Promise<{ backupPath: string | null; bytes: number }> {
  const validation = validateBlogDataDraft(data);
  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'));
  }

  assertBlogStorageWritable();

  const json = `${JSON.stringify(validation.data, null, 2)}\n`;

  if (isBlobStorageEnabled()) {
    const remoteResult = await saveBlogDataBlob(json, expectedEtag);
    return {
      backupPath: remoteResult.backupPath,
      bytes: Buffer.byteLength(json, 'utf8')
    };
  }

  const backupPath = await createBlogDataBackup();
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
    errors.push(`${label} 必须是非空字符串。`);
  }
}

function validateOptionalArray(value: unknown, label: string, errors: string[]): void {
  if (value !== undefined && !Array.isArray(value)) {
    errors.push(`${label} 填写时必须是数组。`);
  }
}

function validateTagLibrary(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('site.tags must be an array managed by the tag column.');
    return;
  }

  validateTagNames(value, 'site.tags', errors);
}

function validateCuratedTagList(value: unknown, label: string, allowedTagKeys: Set<string>, errors: string[]): void {
  if (value === undefined || value === null) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push(label + ' must be an array.');
    return;
  }

  const seen = new Set<string>();
  value.forEach((item, index) => {
    const tag = typeof item === 'string' ? item.trim() : '';
    const key = tag.toLowerCase();
    if (!isValidTagName(tag)) {
      errors.push(label + '[' + index + '] must be a non-empty tag shorter than 80 characters without control characters.');
      return;
    }
    if (seen.has(key)) {
      errors.push(label + '[' + index + '] duplicates "' + tag + '".');
      return;
    }
    seen.add(key);
    if (!allowedTagKeys.has(key)) {
      errors.push(label + '[' + index + '] "' + tag + '" must exist in site.tags before it can be used.');
    }
  });
}

function validateTagNames(value: unknown[], label: string, errors: string[]): void {
  const seen = new Set<string>();
  value.forEach((item, index) => {
    const tag = typeof item === 'string' ? item.trim() : '';
    const key = tag.toLowerCase();
    if (!isValidTagName(tag)) {
      errors.push(label + '[' + index + '] must be a non-empty tag shorter than 80 characters without control characters.');
      return;
    }
    if (seen.has(key)) {
      errors.push(label + '[' + index + '] duplicates "' + tag + '".');
      return;
    }
    seen.add(key);
  });
}

function collectAllowedTagKeys(value: unknown): Set<string> {
  if (!Array.isArray(value)) {
    return new Set();
  }

  return new Set(
    value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(isValidTagName)
      .map((tag) => tag.toLowerCase())
  );
}
function validateMomentHasNoTags(note: unknown, index: number, errors: string[]): void {
  if (!isRecord(note) || note.tags === undefined) {
    return;
  }

  if (!Array.isArray(note.tags) || note.tags.length > 0) {
    errors.push(`notes[${index}].tags 不受支持，因为动态不使用标签。`);
  }
}

function isValidTagName(value: string): boolean {
  return Boolean(value) && value.length <= 80 && !/[\u0000-\u001f\u007f]/.test(value);
}
function validateProjectOrder(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push('site.projectOrder 填写时必须是数组。');
    return;
  }

  const seen = new Set<string>();
  value.forEach((entry, index) => {
    const text = typeof entry === 'string' ? entry.trim() : '';
    if (!text) {
      errors.push(`site.projectOrder[${index}] 必须是非空项目名称或 GitHub 地址。`);
      return;
    }
    if (text.length > 200 || /[\u0000-\u001f\u007f]/.test(text)) {
      errors.push(`site.projectOrder[${index}] 长度必须小于 200 个字符，且不能包含控制字符。`);
      return;
    }
    const key = text.toLowerCase();
    if (seen.has(key)) {
      errors.push(`site.projectOrder[${index}] 与 "${text}" 重复。`);
      return;
    }
    seen.add(key);
  });
}

function validateLinks(items: unknown[], errors: string[]): void {
  const seenUrls = new Set<string>();

  items.forEach((link, index) => {
    if (!isRecord(link)) {
      errors.push(`links[${index}] 必须是对象。`);
      return;
    }

    validateRequiredString(link, `links[${index}].title`, errors, 'title');
    validateRequiredString(link, `links[${index}].description`, errors, 'description');

    const url = typeof link.url === 'string' ? link.url.trim() : '';
    if (!isExternalUrl(url)) {
      errors.push(`links[${index}].url 必须是 http 或 https 地址。`);
    } else if (seenUrls.has(url)) {
      errors.push(`links[${index}].url 与 "${url}" 重复。`);
    } else {
      seenUrls.add(url);
    }

    validateOptionalAssetPath(link.avatar, `links[${index}].avatar`, errors);

    if (link.category !== undefined) {
      validateBoundedOptionalString(link.category, `links[${index}].category`, errors, 40);
    }
    if (link.owner !== undefined) {
      validateBoundedOptionalString(link.owner, `links[${index}].owner`, errors, 60);
    }
    if (link.note !== undefined) {
      validateBoundedOptionalString(link.note, `links[${index}].note`, errors, 240);
    }
    if (link.addedAt !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(link.addedAt))) {
      errors.push(`links[${index}].addedAt 必须是 YYYY-MM-DD 格式的日期。`);
    }
  });
}

function validateBoundedOptionalString(value: unknown, label: string, errors: string[], maxLength: number): void {
  const text = typeof value === 'string' ? value.trim() : '';
  if (value !== undefined && typeof value !== 'string') {
    errors.push(`${label} 填写时必须是字符串。`);
    return;
  }
  if (text.length > maxLength || /[\u0000-\u001f\u007f]/.test(text)) {
    errors.push(`${label} 长度必须小于 ${maxLength} 个字符，且不能包含控制字符。`);
  }
}

function validateCloudMusicIds(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push('site.cloudMusicIds 填写时必须是数组。');
    return;
  }

  value.forEach((id, index) => {
    if (!/^\d{1,20}$/.test(String(id).trim())) {
      errors.push(`site.cloudMusicIds[${index}] 必须是数字形式的音乐编号。`);
    }
  });
}

function validateMusicTracks(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push('site.music 填写时必须是数组。');
    return;
  }

  value.forEach((track, index) => {
    if (!isRecord(track)) {
      errors.push(`site.music[${index}] 必须是对象。`);
      return;
    }

    validateRequiredString(track, `site.music[${index}].title`, errors, 'title');
    validateRequiredString(track, `site.music[${index}].artist`, errors, 'artist');
    validateOptionalPlayableUrl(track.url, `site.music[${index}].url`, errors);
    validateOptionalAssetPath(track.cover, `site.music[${index}].cover`, errors);

    if (track.id !== undefined && !/^[\w.-]{1,100}$/.test(String(track.id).trim())) {
      errors.push(`site.music[${index}].id 只能包含字母、数字、点、下划线或连字符。`);
    }
    if (track.duration !== undefined && (typeof track.duration !== 'number' || track.duration < 0)) {
      errors.push(`site.music[${index}].duration 填写时必须是正数。`);
    }
  });
}

function validateCommentConfig(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push('site.comments 填写时必须是对象。');
    return;
  }

  if ('clientSecret' in value || 'secret' in value) {
    errors.push('site.comments 不允许保存 OAuth 密钥，请使用 GITHUB_CLIENT_SECRET 或 GITALK_CLIENT_SECRET。');
  }

  if (value.enabled !== undefined && typeof value.enabled !== 'boolean') {
    errors.push('site.comments.enabled 必须是布尔值。');
  }

  for (const [key, label] of [['repo', 'site.comments.repo'], ['owner', 'site.comments.owner'], ['clientId', 'site.comments.clientId'], ['label', 'site.comments.label']] as const) {
    const current = value[key];
    if (current !== undefined && String(current).trim() && !/^[\w.-]{1,100}$/.test(String(current).trim())) {
      errors.push(`${label} 只能包含字母、数字、点、下划线或连字符。`);
    }
  }

  if (value.admin !== undefined) {
    if (!Array.isArray(value.admin)) {
      errors.push('site.comments.admin 填写时必须是数组。');
    } else {
      value.admin.forEach((admin, index) => {
        if (!/^[\w.-]{1,100}$/.test(String(admin).trim())) {
          errors.push(`site.comments.admin[${index}] 必须是有效的 GitHub 用户名。`);
        }
      });
    }
  }

  if (value.proxy !== undefined && !isLocalPath(String(value.proxy))) {
    errors.push('site.comments.proxy 必须是本地 API 路径，例如 /api/github。');
  }
}

function validatePageContentMap(value: unknown, errors: string[]): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push('site.pages 填写时必须是对象。');
    return;
  }

  Object.entries(value).forEach(([pageId, page]) => {
    if (!/^[a-z][a-z0-9-]{1,39}$/.test(pageId)) {
      errors.push(`site.pages 的键 "${pageId}" 必须是安全的页面 ID。`);
      return;
    }
    if (!isRecord(page)) {
      errors.push(`site.pages.${pageId} 必须是对象。`);
      return;
    }

    for (const field of ['eyebrow', 'title', 'description'] as const) {
      if (page[field] !== undefined && typeof page[field] !== 'string') {
        errors.push(`site.pages.${pageId}.${field} 填写时必须是字符串。`);
      }
    }

    for (const field of ['primaryActionHref', 'secondaryActionHref'] as const) {
      const href = typeof page[field] === 'string' ? page[field].trim() : '';
      if (href && !isSafeHref(href)) {
        errors.push(`site.pages.${pageId}.${field} 必须是 http(s)、本地路径或锚点地址。`);
      }
    }

    for (const field of ['statLabels', 'detailLines'] as const) {
      if (page[field] !== undefined && !Array.isArray(page[field])) {
        errors.push(`site.pages.${pageId}.${field} 填写时必须是数组。`);
      }
    }
  });
}

function validateUniqueField(items: unknown[], field: string, label: string, errors: string[]): void {
  const seen = new Set<string>();

  items.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`${label}[${index}] 必须是对象。`);
      return;
    }

    const value = item[field];
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${label}[${index}].${field} 必须是非空字符串。`);
      return;
    }

    if (seen.has(value)) {
      errors.push(`${label}[${index}].${field} 与 "${value}" 重复。`);
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

function isLocalHref(value: string): boolean {
  const href = value.trim();
  if (!href.startsWith('/') || href.startsWith('//') || /[\s\\]/.test(href)) {
    return false;
  }

  try {
    const url = new URL(href, 'https://local.invalid');
    return url.origin === 'https://local.invalid' && url.pathname.startsWith('/');
  } catch {
    return false;
  }
}

function isHashHref(value: string): boolean {
  return /^#[A-Za-z0-9%._~!$&'()*+,;=:@/?-]*$/.test(value);
}

function isSafeHref(value: string): boolean {
  return isExternalUrl(value) || isLocalHref(value) || isHashHref(value);
}

function validateOptionalPlayableUrl(value: unknown, label: string, errors: string[]): void {
  if (value === undefined || value === null || value === '') {
    return;
  }

  const url = String(value).trim();
  if (!isExternalUrl(url) && !isLocalPath(url)) {
    errors.push(`${label} 必须是 http(s) 地址或安全的本地路径。`);
  }
}

function validateOptionalAssetPath(value: unknown, label: string, errors: string[]): void {
  validateOptionalPlayableUrl(value, label, errors);
}
