import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string[];
  category: string;
  cover: string;
  status: 'published' | 'draft';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogLink = {
  title: string;
  url: string;
  description: string;
};

export type BlogNote = {
  id: string;
  content: string;
  date: string;
  title?: string;
  mood?: string;
  tags?: string[];
};

export type GalleryItem = {
  title: string;
  description: string;
  image: string;
  alt?: string;
  tags?: string[];
  collection?: string;
  location?: string;
  date?: string;
  featured?: boolean;
  items?: Array<{
    title: string;
    image: string;
    alt?: string;
  }>;
};

export type MusicTrack = {
  title: string;
  artist: string;
  mood: string;
  url: string;
  cover?: string;
  source?: string;
  note?: string;
};

export type BlogProject = {
  id: string;
  title: string;
  description: string;
  url: string;
  repo: string;
  cover: string;
  tags: string[];
  status: string;
  featured: boolean;
  startedAt: string;
};

export type CommentConfig = {
  enabled: boolean;
  provider: string;
  repo: string;
  clientId: string;
};

export type BlogSite = {
  title: string;
  subtitle: string;
  owner: string;
  role: string;
  motto: string;
  bio: string;
  status: string;
  location: string;
  email: string;
  github: string;
  themeColor: string;
  accentColor: string;
  heroImage: string;
  avatar: string;
  level: number;
  experience: number;
  streak: number;
  assistantName: string;
  assistantPrompt: string;
  comments: CommentConfig;
  music: MusicTrack[];
  gallery: GalleryItem[];
};

export type BlogData = {
  site: BlogSite;
  links: BlogLink[];
  notes: BlogNote[];
  projects: BlogProject[];
  posts: BlogPost[];
};

export type BlogStats = {
  posts: number;
  drafts: number;
  tags: number;
  categories: number;
  words: number;
  projects: number;
  notes: number;
  gallery: number;
  tracks: number;
  links: number;
};

export type TagSummary = {
  name: string;
  count: number;
  latestAt: string;
};

export type ArchiveGroup = {
  year: string;
  posts: BlogPost[];
};

const fallbackSite: BlogSite = {
  title: '星屿手记',
  subtitle: '写代码，也写生活里发光的片刻。',
  owner: 'Lu Longfei',
  role: '全栈练习生 / 博客系统维护者',
  motto: '把日常、代码和灵感整理成可以再次抵达的星图。',
  bio: '计算机学习者，喜欢把复杂问题拆成可以落地的小系统。',
  status: '正在重构为完整站点型个人博客：文章、项目、动态、音乐、照片墙、友链和 GitHub/Vercel 发布流。',
  location: 'Changsha, China',
  email: 'hello@example.com',
  github: 'https://github.com/yige66/personal-theme-blog',
  themeColor: '#6fb7a8',
  accentColor: '#f0c36a',
  heroImage: '/assets/img/hero-mountain.svg',
  avatar: '/assets/img/avatar-orbit.svg',
  level: 12,
  experience: 68,
  streak: 27,
  assistantName: '星屿助手',
  assistantPrompt: '根据文章、动态和作者资料，为访客推荐阅读路径。',
  comments: {
    enabled: false,
    provider: 'GitHub Issues / Gitalk',
    repo: 'your-name/blog-comments',
    clientId: ''
  },
  music: [
    {
      title: '晚风经过编译器',
      artist: 'Local Playlist',
      mood: '写作 / Coding',
      url: '',
      cover: '/assets/img/desk-notes.svg',
      note: '适合整理草稿和复盘项目时播放。'
    },
    {
      title: '纸页与星轨',
      artist: '星屿电台',
      mood: '阅读 / Quiet',
      url: '',
      cover: '/assets/img/hero-mountain.svg',
      note: '更安静的阅读背景。'
    }
  ],
  gallery: [
    {
      title: '山脊头图',
      description: '首页主题视觉与长期写作的起点。',
      image: '/assets/img/hero-mountain.svg',
      alt: '山脊与星空风格的博客头图'
    },
    {
      title: '桌面笔记',
      description: '把学习碎片整理成专题文章。',
      image: '/assets/img/desk-notes.svg',
      alt: '桌面笔记插画'
    },
    {
      title: '后台面板',
      description: '发布工作流承载内容版本、预览和备份。',
      image: '/assets/img/admin-board.svg',
      alt: '后台面板插画'
    }
  ]
};

const fallbackProjects: BlogProject[] = [
  {
    id: 'project-console',
    title: 'Personal Blog Console',
    description: '一个可部署的个人博客内容系统，用 JSON、GitHub 和 Vercel 串联文章、动态、音乐、相册、友链和部署流程。',
    url: '/console',
    repo: 'https://github.com/yige66/personal-theme-blog',
    cover: '/assets/img/admin-board.svg',
    tags: ['Next.js', 'CMS', 'JSON'],
    status: 'active',
    featured: true,
    startedAt: '2026-06-28'
  }
];

const fallbackData: BlogData = {
  site: fallbackSite,
  links: [],
  notes: [],
  projects: fallbackProjects,
  posts: []
};

const dataFile = path.join(process.cwd(), 'data', 'blog.json');

export async function getBlogData(): Promise<BlogData> {
  if (!existsSync(dataFile)) {
    return fallbackData;
  }

  const raw = await readFile(dataFile, 'utf8');
  const parsed = JSON.parse(raw) as Partial<BlogData>;
  return normalizeBlogData(parsed);
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const data = await getBlogData();
  return data.posts.filter((post) => post.status === 'published').sort(comparePosts);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getPublishedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getFeaturedProjects(): Promise<BlogProject[]> {
  const data = await getBlogData();
  return [...data.projects].sort(compareProjects).slice(0, 4);
}

export async function getTagSummaries(): Promise<TagSummary[]> {
  const posts = await getPublishedPosts();
  const tags = new Map<string, TagSummary>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const current = tags.get(tag);
      if (!current) {
        tags.set(tag, { name: tag, count: 1, latestAt: post.updatedAt });
        continue;
      }
      tags.set(tag, {
        ...current,
        count: current.count + 1,
        latestAt: new Date(post.updatedAt) > new Date(current.latestAt) ? post.updatedAt : current.latestAt
      });
    }
  }

  return [...tags.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  const normalizedTag = decodeURIComponent(tag).toLowerCase();
  return posts.filter((post) => post.tags.some((item) => item.toLowerCase() === normalizedTag));
}

export async function getArchiveGroups(): Promise<ArchiveGroup[]> {
  const posts = await getPublishedPosts();
  const groups = posts.reduce<Map<string, BlogPost[]>>((archive, post) => {
    const year = new Date(post.createdAt).getFullYear().toString();
    const nextPosts = [...(archive.get(year) ?? []), post];
    archive.set(year, nextPosts);
    return archive;
  }, new Map());

  return [...groups.entries()].map(([year, groupPosts]) => ({ year, posts: groupPosts })).sort((a, b) => Number(b.year) - Number(a.year));
}

export async function getBlogStats(): Promise<BlogStats> {
  const data = await getBlogData();
  const posts = data.posts.filter((post) => post.status === 'published');
  return {
    posts: posts.length,
    drafts: data.posts.filter((post) => post.status === 'draft').length,
    tags: new Set(posts.flatMap((post) => post.tags)).size,
    categories: new Set(posts.map((post) => post.category)).size,
    words: posts.reduce((total, post) => total + estimateWords(post.content), 0),
    projects: data.projects.length,
    notes: data.notes.length,
    gallery: data.site.gallery.length,
    tracks: data.site.music.length,
    links: data.links.length
  };
}

export function estimateReadingMinutes(content: string): number {
  return Math.max(1, Math.ceil(estimateWords(content) / 420));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const blocks: string[] = [];
  let listItems: string[] = [];
  let paragraph: string[] = [];
  let quoteLines: string[] = [];
  let codeFence: { language: string; lines: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(`<p>${paragraph.map(renderInline).join('<br />')}</p>`);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
      listItems = [];
    }
  };

  const flushQuote = () => {
    if (quoteLines.length > 0) {
      blocks.push(`<blockquote><p>${quoteLines.map(renderInline).join('<br />')}</p></blockquote>`);
      quoteLines = [];
    }
  };

  const flushCode = () => {
    if (codeFence) {
      const languageClass = codeFence.language ? ` class="language-${escapeAttribute(codeFence.language)}"` : '';
      blocks.push(`<pre><code${languageClass}>${escapeHtml(codeFence.lines.join('\n'))}\n</code></pre>`);
      codeFence = null;
    }
  };

  const flushTextBlocks = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (codeFence) {
      if (line.startsWith('```')) {
        flushCode();
      } else {
        codeFence.lines.push(rawLine);
      }
      continue;
    }

    if (line.startsWith('```')) {
      flushTextBlocks();
      codeFence = { language: line.slice(3).trim(), lines: [] };
      continue;
    }

    if (line === '') {
      flushTextBlocks();
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      quoteLines.push(line.slice(2));
      continue;
    }

    if (line.startsWith('### ')) {
      flushTextBlocks();
      blocks.push(`<h3>${renderInline(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      flushTextBlocks();
      blocks.push(`<h2>${renderInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      flushTextBlocks();
      blocks.push(`<h2>${renderInline(line.slice(2))}</h2>`);
      continue;
    }

    if (/^- /.test(line)) {
      flushParagraph();
      flushQuote();
      listItems.push(line.slice(2));
      continue;
    }

    flushQuote();
    paragraph.push(line);
  }

  flushTextBlocks();
  flushCode();
  return blocks.join('');
}
function normalizeBlogData(input: Partial<BlogData>): BlogData {
  const siteInput: Partial<BlogSite> = input.site ?? {};
  const site: BlogSite = {
    ...fallbackSite,
    ...siteInput,
    comments: {
      ...fallbackSite.comments,
      ...(siteInput.comments ?? {})
    },
    music: normalizeArray(siteInput.music, fallbackSite.music),
    gallery: normalizeArray(siteInput.gallery, fallbackSite.gallery),
    avatar: siteInput.avatar || fallbackSite.avatar,
    role: siteInput.role || fallbackSite.role,
    motto: siteInput.motto || fallbackSite.motto,
    status: siteInput.status || fallbackSite.status,
    level: toInteger(siteInput.level, fallbackSite.level),
    experience: toInteger(siteInput.experience, fallbackSite.experience),
    streak: toInteger(siteInput.streak, fallbackSite.streak),
    assistantName: siteInput.assistantName || fallbackSite.assistantName,
    assistantPrompt: siteInput.assistantPrompt || fallbackSite.assistantPrompt
  };

  return {
    site,
    links: Array.isArray(input.links) ? input.links : [],
    notes: Array.isArray(input.notes) ? input.notes : [],
    projects: normalizeArray(input.projects, fallbackProjects),
    posts: Array.isArray(input.posts) ? input.posts : []
  };
}

function normalizeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;
}

function comparePosts(a: BlogPost, b: BlogPost): number {
  if (a.featured !== b.featured) {
    return a.featured ? -1 : 1;
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function compareProjects(a: BlogProject, b: BlogProject): number {
  if (a.featured !== b.featured) {
    return a.featured ? -1 : 1;
  }
  return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
}

function estimateWords(content: string): number {
  const cjk = content.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const words = content.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  return cjk + words;
}

function renderInline(text: string): string {
  const codeSegments: string[] = [];
  const codeTokenPrefix = '__BLOG_INLINE_CODE_';
  const protectedText = escapeHtml(text).replace(/`([^`]+)`/g, (_match, code: string) => {
    const token = `${codeTokenPrefix}${codeSegments.length}__`;
    codeSegments.push(`<code>${code}</code>`);
    return token;
  });

  const withImages = protectedText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt: string, src: string) => {
    const safeSrc = sanitizeHref(src);
    return safeSrc ? `<img src="${escapeAttribute(safeSrc)}" alt="${escapeAttribute(alt)}" loading="lazy" />` : `<span>${escapeHtml(alt)}</span>`;
  });

  return renderInlineLinks(withImages.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
    .replace(new RegExp(`${codeTokenPrefix}(\\d+)__`, 'g'), (_match, index: string) => codeSegments[Number(index)] ?? '');
}

function renderInlineLinks(value: string): string {
  return value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
    const safeHref = sanitizeHref(href);
    if (!safeHref) {
      return `<span>${label}</span>`;
    }

    const externalAttrs = isExternalHref(safeHref) ? ' target="_blank" rel="noreferrer"' : '';
    return `<a href="${escapeAttribute(safeHref)}"${externalAttrs}>${label}</a>`;
  });
}

function sanitizeHref(value: string): string {
  const href = String(value || '').trim();
  if (/^https?:\/\/[^\s]+$/i.test(href) || /^\/(?!\/)[a-zA-Z0-9/_:.-]+$/.test(href) || /^#[a-zA-Z0-9_-]+$/.test(href)) {
    return href;
  }
  return '';
}

function isExternalHref(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toInteger(value: unknown, fallback: number): number {
  const number = Number.parseInt(String(value), 10);
  return Number.isNaN(number) ? fallback : number;
}
