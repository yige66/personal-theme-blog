import { get, put } from '@vercel/blob';

export const blogDataBlobPath = 'blog/blog.json';
export const aiConfigBlobPath = 'admin/ai-config.json';
const blogBackupPrefix = 'blog/backups';

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function assertBlogStorageWritable(): void {
  if (process.env.NODE_ENV === 'production' && !isBlobStorageConfigured()) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for production blog writes.');
  }
}

export function isPublicBlobStorageConfigured(): boolean {
  const publicToken = process.env.BLOB_PUBLIC_READ_WRITE_TOKEN?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  const storeId = process.env.BLOB_PUBLIC_STORE_ID?.trim();
  return Boolean(publicToken || (oidcToken && storeId));
}

export function assertMediaStorageWritable(): void {
  if (process.env.NODE_ENV !== 'production' || isPublicBlobStorageConfigured()) {
    return;
  }

  if (process.env.VERCEL_OIDC_TOKEN?.trim() && !process.env.BLOB_PUBLIC_STORE_ID?.trim()) {
    throw new Error('BLOB_PUBLIC_STORE_ID is required when production media writes use VERCEL_OIDC_TOKEN.');
  }

  throw new Error('A public Blob token or VERCEL_OIDC_TOKEN is required for production media writes.');
}

export async function readBlogDataBlob(): Promise<string | null> {
  return readPrivateBlob(blogDataBlobPath);
}

export async function readPrivateBlob(pathname: string): Promise<string | null> {
  const snapshot = await readPrivateBlobSnapshot(pathname);
  return snapshot?.content ?? null;
}

export async function readPrivateBlobSnapshot(pathname: string): Promise<{ content: string; etag: string } | null> {
  if (!isBlobStorageConfigured()) {
    return null;
  }

  const result = await get(pathname, {
    access: 'private',
    useCache: false
  });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  return {
    content: await new Response(result.stream).text(),
    etag: result.blob.etag
  };
}

export async function readBlogDataBlobSnapshot(): Promise<{ content: string; etag: string } | null> {
  return readPrivateBlobSnapshot(blogDataBlobPath);
}

export async function savePrivateBlob(pathname: string, content: string): Promise<void> {
  if (!isBlobStorageConfigured()) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for private Blob storage.');
  }

  await put(pathname, content, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60
  });
}

export async function saveBlogDataBlob(json: string, expectedEtag: string | null): Promise<{ backupPath: string | null }> {
  if (!isBlobStorageConfigured()) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for Blob storage.');
  }

  const previous = await readBlogDataBlobSnapshot();
  let backupPath: string | null = null;

  if (previous) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = await put(`${blogBackupPrefix}/blog-${stamp}.json`, previous.content, {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 60
    });
    backupPath = backup.pathname;
  }

  await put(blogDataBlobPath, json, {
    access: 'private',
    addRandomSuffix: false,
    ...(expectedEtag
      ? { allowOverwrite: true, ifMatch: expectedEtag }
      : { allowOverwrite: false }),
    contentType: 'application/json',
    cacheControlMaxAge: 60
  });

  return { backupPath };
}

export async function savePublicBlob(pathname: string, bytes: Buffer, contentType: string, multipart = false): Promise<{ url: string; pathname: string }> {
  const publicToken = process.env.BLOB_PUBLIC_READ_WRITE_TOKEN?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  const storeId = process.env.BLOB_PUBLIC_STORE_ID?.trim();

  const credentialOptions = publicToken
    ? { token: publicToken }
    : oidcToken && storeId
      ? { oidcToken, storeId }
      : null;

  if (!credentialOptions) {
    throw new Error('A public Blob token or VERCEL_OIDC_TOKEN with BLOB_PUBLIC_STORE_ID is required for media storage.');
  }

  const blob = await put(pathname, bytes, {
    access: 'public',
    addRandomSuffix: false,
    contentType,
    cacheControlMaxAge: 31536000,
    multipart,
    ...credentialOptions
  });

  return { url: blob.url, pathname: blob.pathname };
}
