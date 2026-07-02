import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type AdminImageFileMeta = {
  name?: string;
  type?: string;
  size?: number;
};

export type AdminImageValidationResult =
  | { ok: true; extension: string; mime: string }
  | { ok: false; error: string };

export type AdminUploadFile = AdminImageFileMeta & {
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type SavedAdminImage = {
  publicPath: string;
  fileName: string;
  originalName: string;
  bytes: number;
};

const maxAdminImageMegabytes = 25;
const maxAdminImageBytes = maxAdminImageMegabytes * 1024 * 1024;
const uploadDirectory = path.join(process.cwd(), 'public', 'assets', 'uploads');

const allowedImageTypes = new Map<string, string[]>([
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/png', ['.png']],
  ['image/webp', ['.webp']],
  ['image/gif', ['.gif']],
  ['image/avif', ['.avif']]
]);

export function validateAdminImageFile(file: AdminImageFileMeta): AdminImageValidationResult {
  const name = typeof file.name === 'string' ? file.name.trim() : '';
  const mime = typeof file.type === 'string' ? file.type.toLowerCase().trim() : '';
  const size = typeof file.size === 'number' ? file.size : 0;
  const extension = path.extname(name).toLowerCase();
  const allowedExtensions = allowedImageTypes.get(mime);

  if (!name) {
    return { ok: false, error: '请选择要上传的图片。' };
  }

  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: '图片文件为空，无法上传。' };
  }

  if (size > maxAdminImageBytes) {
    return { ok: false, error: `图片不能超过 ${maxAdminImageMegabytes}MB。` };
  }

  if (!allowedExtensions) {
    return { ok: false, error: '只支持 JPG、PNG、WebP、GIF 或 AVIF 图片。' };
  }

  if (!allowedExtensions.includes(extension)) {
    return { ok: false, error: '图片扩展名和文件类型不匹配。' };
  }

  return {
    ok: true,
    extension: extension === '.jpeg' ? '.jpg' : extension,
    mime
  };
}

export async function saveAdminImageFile(file: AdminUploadFile): Promise<SavedAdminImage> {
  const validation = validateAdminImageFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectImageMime(bytes);

  if (detectedMime && detectedMime !== validation.mime) {
    throw new Error('图片内容和声明的文件类型不一致。');
  }

  await mkdir(uploadDirectory, { recursive: true });
  const fileName = createSafeUploadName(file.name || 'image', validation.extension);
  const outputPath = path.join(uploadDirectory, fileName);

  await writeFile(outputPath, bytes);

  return {
    publicPath: `/assets/uploads/${fileName}`,
    fileName,
    originalName: file.name || fileName,
    bytes: bytes.length
  };
}

function createSafeUploadName(originalName: string, extension: string): string {
  const base = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image';
  const date = new Date().toISOString().slice(0, 10);
  const id = randomUUID().slice(0, 8);

  return `${date}-${base}-${id}${extension}`;
}

function detectImageMime(bytes: Buffer): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }

  if (bytes.length >= 6 && (bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a')) {
    return 'image/gif';
  }

  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }

  if (bytes.length >= 12 && bytes.subarray(4, 12).toString('ascii') === 'ftypavif') {
    return 'image/avif';
  }

  return '';
}
