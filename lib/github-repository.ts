export type GitHubRepository = {
  owner: string;
  repo: string;
  url: string;
};

export const BLOG_REPOSITORY_OWNER = 'yige66';
export const BLOG_REPOSITORY_NAME = 'personal-theme-blog';
export const BLOG_REPOSITORY_URL = `https://github.com/${BLOG_REPOSITORY_OWNER}/${BLOG_REPOSITORY_NAME}`;

export function parseGitHubRepository(value: unknown): GitHubRepository | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !/^github\.com$/i.test(url.hostname)) {
      return null;
    }

    const parts = url.pathname
      .split('/')
      .filter(Boolean)
      .map((part) => part.replace(/\.git$/i, ''));
    if (parts.length !== 2 || !isSafeGitHubName(parts[0]) || !isSafeGitHubName(parts[1])) {
      return null;
    }

    return {
      owner: parts[0],
      repo: parts[1],
      url: `https://github.com/${parts[0]}/${parts[1]}`
    };
  } catch {
    return null;
  }
}

export function isBlogRepository(value: unknown): boolean {
  const repository = parseGitHubRepository(value);
  return Boolean(
    repository
      && repository.owner.toLowerCase() === BLOG_REPOSITORY_OWNER
      && repository.repo.toLowerCase() === BLOG_REPOSITORY_NAME
  );
}

export function isSafeGitHubName(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(value));
}
