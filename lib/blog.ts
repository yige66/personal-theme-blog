import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
};

export type GalleryItem = {
  title: string;
  description: string;
  image: string;
};

export type MusicTrack = {
  title: string;
  artist: string;
  mood: string;
  url: string;
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
  posts: BlogPost[];
};

export type BlogStats = {
  posts: number;
  drafts: number;
  tags: number;
  categories: number;
  words: number;
};

const fallbackSite: BlogSite = {
  title: '星屿手记',
  subtitle: '写代码，也写生活里发光的片刻。',
  owner: 'Lu Longfei',
  role: '全栈练习生',
  motto: '把日常、代码和灵感整理成可以再次抵达的星图。',
  bio: '计算机学习者 / 后端与前端练习者 / 喜欢把复杂问题拆成可以落地的小系统。',
  status: '正在维护轻量博客、文章后台与个人知识库。',
  location: 'Changsha, China',
  email: 'hello@example.com',
  github: 'https://github.com/',
  themeColor: '#6fb7a8',
  accentColor: '#f0c36a',
  heroImage: '/assets/img/hero-mountain.svg',
  avatar: '/assets/img/avatar-orbit.svg',
  level: 12,
  experience: 68,
  streak: 27,
  assistantName: '星屿助理',
  assistantPrompt: '我会根据站点文章、动态和作者资料给访客提供阅读建议。',
  comments: {
    enabled: false,
    provider: 'GitHub Issues',
    repo: 'your-name/blog-comments',
    clientId: ''
  },
  music: [
    {
      title: '晚风经过编译器',
      artist: 'Local Playlist',
      mood: '写作 / Coding',
      url: ''
    },
    {
      title: '纸页与星轨',
      artist: '星屿电台',
      mood: '阅读 / Quiet',
      url: ''
    }
  ],
  gallery: [
    {
      title: '山脉头图',
      description: '首页主题视觉与长期写作的起点。',
      image: '/assets/img/hero-mountain.svg'
    },
    {
      title: '桌面笔记',
      description: '把学习碎片整理成专题文章。',
      image: '/assets/img/desk-notes.svg'
    },
    {
      title: '后台面板',
      description: '本地控制台承载文章、动态和备份。',
      image: '/assets/img/admin-board.svg'
    }
  ]
};

const fallbackData: BlogData = {
  site: fallbackSite,
  links: [],
  notes: [],
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

export async function getBlogStats(): Promise<BlogStats> {
  const data = await getBlogData();
  const posts = data.posts.filter((post) => post.status === 'published');
  return {
    posts: posts.length,
    drafts: data.posts.filter((post) => post.status === 'draft').length,
    tags: new Set(posts.flatMap((post) => post.tags)).size,
    categories: new Set(posts.map((post) => post.category)).size,
    words: posts.reduce((total, post) => total + estimateWords(post.content), 0)
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

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push(`<h3>${renderInline(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${renderInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${renderInline(line.slice(2))}</h2>`);
      continue;
    }

    if (/^- /.test(line)) {
      flushParagraph();
      listItems.push(line.slice(2));
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
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
    music: Array.isArray(siteInput.music) && siteInput.music.length > 0 ? siteInput.music : fallbackSite.music,
    gallery: Array.isArray(siteInput.gallery) && siteInput.gallery.length > 0 ? siteInput.gallery : fallbackSite.gallery,
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
    posts: Array.isArray(input.posts) ? input.posts : []
  };
}

function comparePosts(a: BlogPost, b: BlogPost): number {
  if (a.featured !== b.featured) {
    return a.featured ? -1 : 1;
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function estimateWords(content: string): number {
  const cjk = content.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const words = content.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  return cjk + words;
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
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
