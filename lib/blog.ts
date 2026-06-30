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
  avatar?: string;
  themeColor?: string;
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
  id?: string;
  title: string;
  artist: string;
  mood: string;
  url: string;
  cover?: string;
  source?: string;
  note?: string;
  provider?: 'local' | 'netease' | string;
  duration?: number;
  lrc?: string;
  lyric?: string;
  lyrics?: string | string[] | Array<{ time: number; text: string }>;
};

export type ArticleHeading = {
  level: 2 | 3;
  text: string;
  id: string;
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

export type BlogChatter = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  tags: string[];
  mood?: string;
  cover?: string;
  featured?: boolean;
};

export type CommentConfig = {
  enabled: boolean;
  provider: string;
  repo: string;
  clientId?: string;
  owner?: string;
  admin?: string[];
  proxy?: string;
  mapping?: string;
  label?: string;
  theme?: string;
  category?: string;
  categoryId?: string;
};

export type VisualEffectsConfig = {
  enabled: boolean;
  danmaku: string[];
  fireflies: boolean;
  petals: boolean;
  grass: boolean;
  cursorTrail: boolean;
  floatingCompanion: boolean;
  intensity: number;
};

export type EntryPanelText = {
  eyebrow: string;
  eyebrowHighlight: string;
  title: string;
  description: string;
};

export type EntryHotspotText = {
  label: string;
  hint: string;
  target: string;
};

export type EntryTextConfig = {
  ariaLabel: string;
  preloaderTitle: string;
  preloaderSubtitle: string;
  signaturePrefix: string;
  signatureName: string;
  signatureSuffix: string;
  original: EntryPanelText;
  beyond: EntryPanelText;
  enterButton: string;
  switchToBeyondButton: string;
  switchToInternalButton: string;
  skipButton: string;
  statusLines: string[];
  consoleTitle: string;
  bootLines: string[];
  hotspots: {
    archive: EntryHotspotText;
    music: EntryHotspotText;
    friends: EntryHotspotText;
    desk: EntryHotspotText;
    theme: EntryHotspotText;
  };
  dialogue: {
    eyebrow: string;
    title: string;
    description: string;
  };
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
  cloudMusicIds: string[];
  friendLinkApplyFormat: string;
  entry: EntryTextConfig;
  comments: CommentConfig;
  effects: VisualEffectsConfig;
  music: MusicTrack[];
  gallery: GalleryItem[];
};

export type BlogData = {
  site: BlogSite;
  links: BlogLink[];
  notes: BlogNote[];
  chatters: BlogChatter[];
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
  chatters: number;
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
  cloudMusicIds: ['1901371647', '1859245776', '1974443814'],
  friendLinkApplyFormat: '名称：星屿手记\n简介：写代码，也写生活里发光的片刻。\n链接：https://github.com/yige66/personal-theme-blog\n头像：/assets/img/avatar-orbit.svg',
  entry: {
    ariaLabel: 'Site entry',
    preloaderTitle: 'InternalBeyond',
    preloaderSubtitle: 'loading entry shell',
    signaturePrefix: 'Design by',
    signatureName: 'Lu Longfei',
    signatureSuffix: 'Codex',
    original: {
      eyebrow: 'Welcome to',
      eyebrowHighlight: '星屿手记',
      title: 'Welcome',
      description: 'Step through mist and starlight. Articles, projects, music, photos, friends and daily fragments wake behind the glass.'
    },
    beyond: {
      eyebrow: 'Internal',
      eyebrowHighlight: 'Beyond',
      title: 'Internal Beyond',
      description: 'Background crossfade, rain, glass blur, mode switching and the delayed route reveal rise together.'
    },
    enterButton: 'Enter Site',
    switchToBeyondButton: 'Switch Beyond',
    switchToInternalButton: 'Return Internal',
    skipButton: 'Skip Intro',
    statusLines: [
      'Static shell prepared',
      'Internal / Beyond layer ready',
      'Choose a mode to begin'
    ],
    consoleTitle: 'ENTRY LOG',
    bootLines: [
      'background crossfade ready',
      'mist field calibrated',
      'rain ambience online',
      'welcome route unlocked'
    ],
    hotspots: {
      archive: { label: 'Archive', hint: 'articles / years', target: 'ARCHIVE' },
      music: { label: 'Radio', hint: 'cloud playlist', target: 'MUSIC' },
      friends: { label: 'Friends', hint: 'linked worlds', target: 'FRIENDS' },
      desk: { label: 'Desk', hint: 'notes / projects', target: 'DESK' },
      theme: { label: 'Mode', hint: 'swap atmosphere', target: 'MODE' }
    },
    dialogue: {
      eyebrow: 'BOOT CHANNEL',
      title: 'Entry channel connected',
      description: 'Pick a marker in the scenery or use the welcome controls to open the blog.'
    }
  },
  effects: {
    enabled: true,
    danmaku: [
      '前方高能反应',
      '正在整理灵感碎片',
      'Markdown 写作中',
      '照片墙素材补给完成',
      'GitHub / Vercel 发布流运行中',
      '今天也在向目标站靠齐',
      '把日常写成可回看的星图',
      '评论与音乐入口待部署'
    ],
    fireflies: true,
    petals: true,
    grass: true,
    cursorTrail: false,
    floatingCompanion: true,
    intensity: 72
  },
  comments: {
    enabled: true,
    provider: 'gitalk',
    repo: 'personal-theme-blog',
    owner: 'yige66',
    admin: ['yige66'],
    clientId: '',
    proxy: '/api/github',
    mapping: 'pathname',
    label: 'comment',
    theme: 'auto'
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
  chatters: [],
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

export async function getChatters(): Promise<BlogChatter[]> {
  const data = await getBlogData();
  return [...data.chatters].sort(compareByDateDesc);
}

export async function getChatterBySlug(slug: string): Promise<BlogChatter | null> {
  const chatters = await getChatters();
  return chatters.find((chatter) => chatter.slug === slug) ?? null;
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
    chatters: data.chatters.length,
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
  const headingIds = new Map<string, number>();

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
      const text = line.slice(4);
      blocks.push(`<h3 id="${escapeAttribute(createHeadingId(text, headingIds))}">${renderInline(text)}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      flushTextBlocks();
      const text = line.slice(3);
      blocks.push(`<h2 id="${escapeAttribute(createHeadingId(text, headingIds))}">${renderInline(text)}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      flushTextBlocks();
      const text = line.slice(2);
      blocks.push(`<h2 id="${escapeAttribute(createHeadingId(text, headingIds))}">${renderInline(text)}</h2>`);
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

export function extractTableOfContents(markdown: string): ArticleHeading[] {
  const headingIds = new Map<string, number>();
  return markdown
    .split(/\r?\n/)
    .map((rawLine) => rawLine.trim())
    .filter((line) => /^#{1,3}\s+/.test(line))
    .map((line): ArticleHeading | null => {
      if (line.startsWith('### ')) {
        const text = cleanHeadingText(line.slice(4));
        return { level: 3, text, id: createHeadingId(text, headingIds) };
      }

      if (line.startsWith('## ')) {
        const text = cleanHeadingText(line.slice(3));
        return { level: 2, text, id: createHeadingId(text, headingIds) };
      }

      if (line.startsWith('# ')) {
        const text = cleanHeadingText(line.slice(2));
        return { level: 2, text, id: createHeadingId(text, headingIds) };
      }

      return null;
    })
    .filter((item): item is ArticleHeading => Boolean(item && item.text));
}

function createHeadingId(text: string, seen: Map<string, number>): string {
  const cleanText = cleanHeadingText(text);
  const base = cleanText
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'section';
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? `toc-${base}` : `toc-${base}-${count + 1}`;
}

function cleanHeadingText(value: string): string {
  return String(value || '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/[*_~`#]/g, '')
    .trim();
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
    cloudMusicIds: normalizeCloudMusicIds(siteInput.cloudMusicIds),
    friendLinkApplyFormat: siteInput.friendLinkApplyFormat || fallbackSite.friendLinkApplyFormat,
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
    assistantPrompt: siteInput.assistantPrompt || fallbackSite.assistantPrompt,
    entry: normalizeEntry(siteInput.entry),
    effects: normalizeEffects(siteInput.effects)
  };

  return {
    site,
    links: Array.isArray(input.links) ? input.links : [],
    notes: Array.isArray(input.notes) ? input.notes : [],
    chatters: Array.isArray(input.chatters) ? input.chatters : [],
    projects: normalizeArray(input.projects, fallbackProjects),
    posts: Array.isArray(input.posts) ? input.posts : []
  };
}

function compareByDateDesc(a: { date: string }, b: { date: string }): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function normalizeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;
}

function normalizeEffects(value: unknown): VisualEffectsConfig {
  const source = typeof value === 'object' && value !== null ? value as Partial<VisualEffectsConfig> : {};
  const fallback = fallbackSite.effects;
  const danmaku = Array.isArray(source.danmaku)
    ? source.danmaku.map((item) => String(item).trim()).filter(Boolean).slice(0, 24)
    : fallback.danmaku;

  return {
    enabled: source.enabled ?? fallback.enabled,
    danmaku: danmaku.length > 0 ? danmaku : fallback.danmaku,
    fireflies: source.fireflies ?? fallback.fireflies,
    petals: source.petals ?? fallback.petals,
    grass: source.grass ?? fallback.grass,
    cursorTrail: source.cursorTrail ?? fallback.cursorTrail,
    floatingCompanion: source.floatingCompanion ?? fallback.floatingCompanion,
    intensity: Math.min(100, Math.max(0, toInteger(source.intensity, fallback.intensity)))
  };
}

function normalizeEntry(value: unknown): EntryTextConfig {
  const source = typeof value === 'object' && value !== null ? value as Partial<EntryTextConfig> : {};
  const fallback = fallbackSite.entry;

  return {
    ariaLabel: textOrFallback(source.ariaLabel, fallback.ariaLabel),
    preloaderTitle: textOrFallback(source.preloaderTitle, fallback.preloaderTitle),
    preloaderSubtitle: textOrFallback(source.preloaderSubtitle, fallback.preloaderSubtitle),
    signaturePrefix: textOrFallback(source.signaturePrefix, fallback.signaturePrefix),
    signatureName: textOrFallback(source.signatureName, fallback.signatureName),
    signatureSuffix: textOrFallback(source.signatureSuffix, fallback.signatureSuffix),
    original: normalizeEntryPanel(source.original, fallback.original),
    beyond: normalizeEntryPanel(source.beyond, fallback.beyond),
    enterButton: textOrFallback(source.enterButton, fallback.enterButton),
    switchToBeyondButton: textOrFallback(source.switchToBeyondButton, fallback.switchToBeyondButton),
    switchToInternalButton: textOrFallback(source.switchToInternalButton, fallback.switchToInternalButton),
    skipButton: textOrFallback(source.skipButton, fallback.skipButton),
    statusLines: normalizeTextList(source.statusLines, fallback.statusLines, 6),
    consoleTitle: textOrFallback(source.consoleTitle, fallback.consoleTitle),
    bootLines: normalizeTextList(source.bootLines, fallback.bootLines, 8),
    hotspots: {
      archive: normalizeEntryHotspot(source.hotspots?.archive, fallback.hotspots.archive),
      music: normalizeEntryHotspot(source.hotspots?.music, fallback.hotspots.music),
      friends: normalizeEntryHotspot(source.hotspots?.friends, fallback.hotspots.friends),
      desk: normalizeEntryHotspot(source.hotspots?.desk, fallback.hotspots.desk),
      theme: normalizeEntryHotspot(source.hotspots?.theme, fallback.hotspots.theme)
    },
    dialogue: {
      eyebrow: textOrFallback(source.dialogue?.eyebrow, fallback.dialogue.eyebrow),
      title: textOrFallback(source.dialogue?.title, fallback.dialogue.title),
      description: textOrFallback(source.dialogue?.description, fallback.dialogue.description)
    }
  };
}

function normalizeEntryPanel(value: unknown, fallback: EntryPanelText): EntryPanelText {
  const source = typeof value === 'object' && value !== null ? value as Partial<EntryPanelText> : {};
  return {
    eyebrow: textOrFallback(source.eyebrow, fallback.eyebrow),
    eyebrowHighlight: textOrFallback(source.eyebrowHighlight, fallback.eyebrowHighlight),
    title: textOrFallback(source.title, fallback.title),
    description: textOrFallback(source.description, fallback.description)
  };
}

function normalizeEntryHotspot(value: unknown, fallback: EntryHotspotText): EntryHotspotText {
  const source = typeof value === 'object' && value !== null ? value as Partial<EntryHotspotText> : {};
  return {
    label: textOrFallback(source.label, fallback.label),
    hint: textOrFallback(source.hint, fallback.hint),
    target: textOrFallback(source.target, fallback.target)
  };
}

function normalizeTextList(value: unknown, fallback: string[], limit: number): string[] {
  const items = Array.isArray(value)
    ? value.map((item) => typeof item === 'string' ? item.trim() : '').filter(Boolean).slice(0, limit)
    : [];

  return items.length > 0 ? items : fallback;
}

function textOrFallback(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeCloudMusicIds(value: unknown): string[] {
  const source = Array.isArray(value) ? value : fallbackSite.cloudMusicIds;
  const ids = source
    .map((item) => String(item).trim())
    .filter((item) => /^\d{1,20}$/.test(item))
    .slice(0, 20);

  return ids.length > 0 ? ids : fallbackSite.cloudMusicIds;
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
