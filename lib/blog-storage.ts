import { get, put } from '@vercel/blob';

export const blogDataBlobPath = 'blog/blog.json';
export const publicBlobStoreId = 'store_1ax2zZvi4N0N7Gw4';
const blogBackupPrefix = 'blog/backups';

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function readBlogDataBlob(): Promise<string | null> {
  if (!isBlobStorageConfigured()) {
    return null;
  }

  const result = await get(blogDataBlobPath, {
    access: 'private',
    useCache: false
  });

  if (!result || result.statusCode !== 200) {
    return null;
  }

  return new Response(result.stream).text();
}

export async function saveBlogDataBlob(json: string): Promise<{ backupPath: string | null }> {
  if (!isBlobStorageConfigured()) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for Blob storage.');
  }

  const previous = await readBlogDataBlob();
  let backupPath: string | null = null;

  if (previous) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = await put(`${blogBackupPrefix}/blog-${stamp}.json`, previous, {
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
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60
  });

  return { backupPath };
}

export async function savePublicBlob(pathname: string, bytes: Buffer, contentType: string, multipart = false): Promise<{ url: string; pathname: string }> {
  const publicToken = process.env.BLOB_PUBLIC_READ_WRITE_TOKEN?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!publicToken && !oidcToken) {
    throw new Error('A public Blob token or VERCEL_OIDC_TOKEN is required for media storage.');
  }

  const credentialOptions = publicToken
    ? { token: publicToken }
    : { oidcToken, storeId: process.env.BLOB_PUBLIC_STORE_ID?.trim() || publicBlobStoreId };

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
