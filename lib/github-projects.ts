import type { BlogProject, BlogSite } from './blog';

type GitHubRepository = {
  archived?: unknown;
  created_at?: unknown;
  description?: unknown;
  fork?: unknown;
  html_url?: unknown;
  language?: unknown;
  name?: unknown;
  pushed_at?: unknown;
  topics?: unknown;
  updated_at?: unknown;
};

export type GitHubProjectSource = {
  error?: string;
  projects: BlogProject[];
  source: 'github' | 'fallback';
  username: string;
};

const GITHUB_REVALIDATE_SECONDS = 30 * 60;
const DEFAULT_PROJECT_COVER = '/assets/img/admin-board.svg';
const INTRODUCTION_ONLY_PROJECT_NAMES = new Set(['personal-theme-blog']);
export const GITHUB_PROJECTS_CACHE_TAG = 'github-projects';

export async function getGithubProjects(site: Pick<BlogSite, 'github' | 'projectOrder'>, fallbackProjects: BlogProject[] = []): Promise<GitHubProjectSource> {
  const username = resolveGithubProjectOwner(site.github);
  const projectOrder = Array.isArray(site.projectOrder) ? site.projectOrder : [];

  if (!username) {
    return fallbackProjectSource('', fallbackProjects, 'missing-github-owner', projectOrder);
  }

  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=100&type=owner`, {
      headers: githubHeaders(),
      next: { revalidate: GITHUB_REVALIDATE_SECONDS, tags: [GITHUB_PROJECTS_CACHE_TAG, githubProjectOwnerCacheTag(username)] }
    });

    if (!response.ok) {
      return fallbackProjectSource(username, fallbackProjects, `github-${response.status}`, projectOrder);
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return fallbackProjectSource(username, fallbackProjects, 'github-invalid-response', projectOrder);
    }

    const projects = payload
      .filter(isGitHubRepository)
      .filter((repo) => !Boolean(repo.fork))
      .filter((repo) => !isIntroductionOnlyProjectName(textValue(repo.name)))
      .map((repo) => repositoryToProject(repo, fallbackProjects))
      .filter((project): project is BlogProject => Boolean(project))
      .filter(isProjectPageProject)
      .slice(0, 48);

    if (projects.length === 0) {
      return fallbackProjectSource(username, fallbackProjects, 'github-empty', projectOrder);
    }

    return {
      projects: applyProjectOrder(projects, projectOrder),
      source: 'github',
      username
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'github-fetch-failed';
    return fallbackProjectSource(username, fallbackProjects, message, projectOrder);
  }
}

export function resolveGithubProjectOwner(github: string): string {
  const envOwner = normalizeGithubName(readRuntimeEnv('GITHUB_PROJECTS_OWNER', 'GITHUB_USERNAME', 'NEXT_PUBLIC_GITHUB_USERNAME'));
  if (envOwner) {
    return envOwner;
  }

  const raw = typeof github === 'string' ? github.trim() : '';
  if (!raw) {
    return '';
  }

  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(`https://github.com/${raw}`);
    if (/^github\.com$/i.test(url.hostname)) {
      return normalizeGithubName(url.pathname.split('/').filter(Boolean)[0] ?? '');
    }
  } catch {
    // Fall through to simple path parsing below.
  }

  return normalizeGithubName(raw.replace(/^@/, '').split('/').filter(Boolean)[0] ?? '');
}

function repositoryToProject(repo: GitHubRepository, fallbackProjects: BlogProject[]): BlogProject | null {
  const name = textValue(repo.name);
  const repoUrl = httpUrlValue(repo.html_url);
  if (!name || !repoUrl) {
    return null;
  }

  const fallback = findFallbackProject(name, repoUrl, fallbackProjects);
  const tags = uniqueValues([textValue(repo.language), ...arrayTextValues(repo.topics)]).slice(0, 5);
  const createdAt = dateOnly(textValue(repo.created_at));
  const updatedAt = dateOnly(textValue(repo.pushed_at) || textValue(repo.updated_at) || textValue(repo.created_at));

  return {
    id: `github-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/-+$/g, ''),
    title: name,
    description: textValue(repo.description) || fallback?.description || `${name} GitHub repository`,
    url: repoUrl,
    repo: repoUrl,
    cover: fallback?.cover || DEFAULT_PROJECT_COVER,
    tags: tags.length > 0 ? tags : fallback?.tags ?? ['GitHub'],
    status: Boolean(repo.archived) ? 'archived' : 'active',
    featured: fallback?.featured ?? false,
    startedAt: updatedAt || createdAt
  };
}

export function githubProjectOwnerCacheTag(username: string): string {
  return `${GITHUB_PROJECTS_CACHE_TAG}:${username}`;
}

function fallbackProjectSource(username: string, fallbackProjects: BlogProject[], error: string, projectOrder: string[] = []): GitHubProjectSource {
  return {
    error,
    projects: applyProjectOrder(
      fallbackProjects.filter(isProjectPageProject).map((project) => ({
        ...project,
        url: project.repo || project.url,
        repo: project.repo || project.url
      })),
      projectOrder
    ),
    source: 'fallback',
    username
  };
}

export function isProjectPageProject(project: Pick<BlogProject, 'id' | 'title' | 'repo' | 'url'>): boolean {
  return ![project.id, project.title, project.repo, project.url].some(isIntroductionOnlyProjectReference);
}

export function applyProjectOrder(projects: BlogProject[], projectOrder: string[] = []): BlogProject[] {
  const rankByKey = createProjectOrderRank(projectOrder);
  if (rankByKey.size === 0) {
    return projects;
  }

  return projects
    .map((project, index) => ({
      index,
      project,
      rank: findProjectOrderRank(project, rankByKey)
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((item) => item.project);
}

function createProjectOrderRank(projectOrder: string[]): Map<string, number> {
  const rankByKey = new Map<string, number>();
  projectOrder.forEach((entry, index) => {
    normalizeProjectReference(entry).forEach((key) => {
      if (!rankByKey.has(key)) {
        rankByKey.set(key, index);
      }
    });
  });
  return rankByKey;
}

function findProjectOrderRank(project: BlogProject, rankByKey: Map<string, number>): number {
  let rank = Number.MAX_SAFE_INTEGER;
  normalizeProjectReference(project.id)
    .concat(normalizeProjectReference(project.title))
    .concat(normalizeProjectReference(project.repo))
    .concat(normalizeProjectReference(project.url))
    .forEach((key) => {
      const matched = rankByKey.get(key);
      if (matched !== undefined && matched < rank) {
        rank = matched;
      }
    });
  return rank;
}

function normalizeProjectReference(value: unknown): string[] {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return [];
  }

  const keys = new Set<string>();
  const add = (key: string) => {
    const normalized = key.trim().toLowerCase().replace(/\.git$/i, '').replace(/\/+$/g, '');
    if (normalized) {
      keys.add(normalized);
      if (normalized.startsWith('github-')) {
        keys.add(normalized.slice('github-'.length));
      }
      const lastSegment = normalized.split('/').filter(Boolean).at(-1);
      if (lastSegment) {
        keys.add(lastSegment);
      }
    }
  };

  add(raw);

  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(`https://github.com/${raw}`);
    add(`${url.hostname}${url.pathname}`);
    add(url.pathname.replace(/^\/+/, ''));
    add(url.pathname.split('/').filter(Boolean).at(-1) ?? '');
  } catch {
    // Non-URL project names are already handled by add(raw).
  }

  return [...keys];
}

function isIntroductionOnlyProjectReference(value: unknown): boolean {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return false;
  }

  const normalized = raw.toLowerCase().replace(/\.git$/i, '').replace(/\/+$/g, '');
  const name = normalized.split('/').filter(Boolean).at(-1) || normalized;
  return isIntroductionOnlyProjectName(name) || normalized === 'project-personal-theme-blog';
}

function isIntroductionOnlyProjectName(value: string): boolean {
  return INTRODUCTION_ONLY_PROJECT_NAMES.has(value.trim().toLowerCase());
}

function githubHeaders(): HeadersInit {
  const token = readRuntimeEnv('GITHUB_PROJECTS_TOKEN', 'GITHUB_TOKEN');
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'personal-theme-blog',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function readRuntimeEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

function findFallbackProject(name: string, repoUrl: string, fallbackProjects: BlogProject[]): BlogProject | undefined {
  const normalizedName = name.toLowerCase();
  const normalizedRepoUrl = repoUrl.toLowerCase();
  return fallbackProjects.find((project) => {
    const repoName = project.repo.split('/').filter(Boolean).at(-1)?.replace(/\.git$/i, '').toLowerCase();
    return project.id.toLowerCase() === normalizedName
      || project.title.toLowerCase() === normalizedName
      || repoName === normalizedName
      || project.repo.toLowerCase() === normalizedRepoUrl;
  });
}

function isGitHubRepository(value: unknown): value is GitHubRepository {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeGithubName(value: string): string {
  return /^[\w.-]{1,100}$/.test(value) ? value : '';
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function httpUrlValue(value: unknown): string {
  const url = textValue(value);
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : '';
}

function arrayTextValues(value: unknown): string[] {
  return Array.isArray(value) ? value.map(textValue).filter(Boolean) : [];
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function dateOnly(value: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';
}
