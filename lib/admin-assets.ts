import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type AdminImageFileMeta = {
  name?: string;
  type?: string;
  size?: number;
};

export type AdminAudioFileMeta = AdminImageFileMeta;

export type AdminImageValidationResult =
  | { ok: true; extension: string; mime: string }
  | { ok: false; error: string };

export type AdminAudioValidationResult = AdminImageValidationResult;

export type AdminUploadFile = AdminImageFileMeta & {
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type SavedAdminImage = {
  publicPath: string;
  fileName: string;
  originalName: string;
  bytes: number;
};

export type SavedAdminAudio = SavedAdminImage;

const maxAdminImageMegabytes = 25;
const maxAdminImageBytes = maxAdminImageMegabytes * 1024 * 1024;
const maxAdminAudioMegabytes = 100;
const maxAdminAudioBytes = maxAdminAudioMegabytes * 1024 * 1024;
const uploadDirectory = path.join(process.cwd(), 'public', 'assets', 'uploads');
const audioUploadDirectory = path.join(process.cwd(), 'public', 'assets', 'audio');

const allowedImageTypes = new Map<string, string[]>([
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/png', ['.png']],
  ['image/webp', ['.webp']],
  ['image/gif', ['.gif']],
  ['image/avif', ['.avif']]
]);

const allowedAudioTypes = new Map<string, string[]>([
  ['audio/mpeg', ['.mp3']],
  ['audio/mp3', ['.mp3']],
  ['audio/mp4', ['.m4a', '.mp4']],
  ['audio/aac', ['.aac']],
  ['audio/ogg', ['.ogg', '.oga', '.opus']],
  ['audio/wav', ['.wav']],
  ['audio/x-wav', ['.wav']],
  ['audio/webm', ['.webm']],
  ['audio/flac', ['.flac']],
  ['audio/x-flac', ['.flac']]
]);

const mp3MimeTypes = new Set(['audio/mpeg', 'audio/mp3']);
const minimumPlayableMp3Frames = 4;
const mpegAudioBitratesKilobits: Record<string, number[]> = {
  V1L1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  V1L2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  V1L3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  V2L1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  V2L2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  V2L3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
};
const mpegAudioSampleRates: Record<string, number[]> = {
  '1': [44100, 48000, 32000],
  '2': [22050, 24000, 16000],
  '2.5': [11025, 12000, 8000]
};

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

export function validateAdminAudioFile(file: AdminAudioFileMeta): AdminAudioValidationResult {
  const name = typeof file.name === 'string' ? file.name.trim() : '';
  const mime = typeof file.type === 'string' ? file.type.toLowerCase().trim() : '';
  const size = typeof file.size === 'number' ? file.size : 0;
  const extension = path.extname(name).toLowerCase();
  const allowedExtensions = allowedAudioTypes.get(mime);

  if (!name) {
    return { ok: false, error: '请选择要上传的音乐文件。' };
  }

  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: '音乐文件为空，无法上传。' };
  }

  if (size > maxAdminAudioBytes) {
    return { ok: false, error: `音乐文件不能超过 ${maxAdminAudioMegabytes}MB。` };
  }

  if (!allowedExtensions) {
    return { ok: false, error: '只支持 MP3、M4A、AAC、OGG、WAV、WebM 或 FLAC 音频。' };
  }

  if (!allowedExtensions.includes(extension)) {
    return { ok: false, error: '音频扩展名和文件类型不匹配。' };
  }

  return {
    ok: true,
    extension: extension === '.oga' || extension === '.opus' ? extension : extension === '.mp4' && mime === 'audio/mp4' ? '.m4a' : extension,
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

export async function saveAdminAudioFile(file: AdminUploadFile): Promise<SavedAdminAudio> {
  const validation = validateAdminAudioFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectAudioMime(bytes);

  if (detectedMime && !isCompatibleAudioMime(detectedMime, validation.mime)) {
    throw new Error('音乐文件内容和声明的文件类型不一致。');
  }

  if (mp3MimeTypes.has(validation.mime) && !hasPlayableMp3Frames(bytes)) {
    throw new Error('MP3 文件没有检测到可播放的音频帧，请重新导出为标准 MP3/M4A/WAV/FLAC 后上传。');
  }

  await mkdir(audioUploadDirectory, { recursive: true });
  const fileName = createSafeUploadName(file.name || 'audio', validation.extension, 'audio');
  const outputPath = path.join(audioUploadDirectory, fileName);

  await writeFile(outputPath, bytes);

  return {
    publicPath: `/assets/audio/${fileName}`,
    fileName,
    originalName: file.name || fileName,
    bytes: bytes.length
  };
}

function createSafeUploadName(originalName: string, extension: string, fallback = 'image'): string {
  const base = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || fallback;
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

export function hasPlayableMp3Frames(bytes: Buffer): boolean {
  const startOffset = getId3v2EndOffset(bytes);

  for (let offset = startOffset; offset < bytes.length - 4; offset += 1) {
    let frameOffset = offset;
    let frameCount = 0;

    while (frameCount < minimumPlayableMp3Frames) {
      const frame = parseMpegAudioFrame(bytes, frameOffset);
      if (!frame) {
        break;
      }

      frameOffset += frame.frameLength;
      frameCount += 1;
    }

    if (frameCount >= minimumPlayableMp3Frames) {
      return true;
    }
  }

  return false;
}

function getId3v2EndOffset(bytes: Buffer): number {
  if (bytes.length < 10 || bytes.subarray(0, 3).toString('ascii') !== 'ID3') {
    return 0;
  }

  const tagSize = readSynchsafeInteger(bytes, 6);
  const hasFooter = (bytes[5] & 0x10) === 0x10;
  return Math.min(bytes.length, 10 + tagSize + (hasFooter ? 10 : 0));
}

function readSynchsafeInteger(bytes: Buffer, offset: number): number {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function parseMpegAudioFrame(bytes: Buffer, offset: number): { frameLength: number } | null {
  if (offset + 4 > bytes.length || bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) {
    return null;
  }

  const versionBits = (bytes[offset + 1] >> 3) & 0x03;
  const layerBits = (bytes[offset + 1] >> 1) & 0x03;
  const bitrateIndex = (bytes[offset + 2] >> 4) & 0x0f;
  const sampleRateIndex = (bytes[offset + 2] >> 2) & 0x03;
  const padding = (bytes[offset + 2] >> 1) & 0x01;

  if (versionBits === 0x01 || layerBits === 0 || bitrateIndex === 0 || bitrateIndex === 0x0f || sampleRateIndex === 0x03) {
    return null;
  }

  const version = versionBits === 0x03 ? '1' : versionBits === 0x02 ? '2' : '2.5';
  const layer = layerBits === 0x03 ? 1 : layerBits === 0x02 ? 2 : 3;
  const bitrateKey = `${version === '1' ? 'V1' : 'V2'}L${layer}`;
  const bitrate = mpegAudioBitratesKilobits[bitrateKey]?.[bitrateIndex] ?? 0;
  const sampleRate = mpegAudioSampleRates[version]?.[sampleRateIndex] ?? 0;

  if (!bitrate || !sampleRate) {
    return null;
  }

  const frameLength = layer === 1
    ? Math.floor(((12 * bitrate * 1000) / sampleRate + padding) * 4)
    : Math.floor((((layer === 3 && version !== '1') ? 72 : 144) * bitrate * 1000) / sampleRate + padding);

  if (frameLength < 24 || frameLength > 2000 || offset + frameLength > bytes.length) {
    return null;
  }

  return { frameLength };
}

function detectAudioMime(bytes: Buffer): string {
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WAVE') {
    return 'audio/wav';
  }

  if (bytes.length >= 3 && bytes.subarray(0, 3).toString('ascii') === 'ID3') {
    return 'audio/mpeg';
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return 'audio/mpeg';
  }

  if (bytes.length >= 4 && bytes.subarray(0, 4).toString('ascii') === 'OggS') {
    return 'audio/ogg';
  }

  if (bytes.length >= 4 && bytes.subarray(0, 4).toString('ascii') === 'fLaC') {
    return 'audio/flac';
  }

  if (bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return 'audio/webm';
  }

  if (bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp') {
    return 'audio/mp4';
  }

  return '';
}

function isCompatibleAudioMime(detectedMime: string, declaredMime: string): boolean {
  if (detectedMime === declaredMime) {
    return true;
  }

  const aliases: Record<string, string[]> = {
    'audio/flac': ['audio/x-flac'],
    'audio/mpeg': ['audio/mp3'],
    'audio/wav': ['audio/x-wav']
  };

  return aliases[detectedMime]?.includes(declaredMime) ?? false;
}
