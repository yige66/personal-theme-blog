import type { BlogData, BlogStats } from '@/lib/blog';
import type { JsonRecord, PathSegment, RecordKind } from '@/components/admin/adminTypes';

export function createDraftStats(data: BlogData, fallback: BlogStats): BlogStats {
  const publishedPosts = data.posts.filter((post) => post.status === 'published');
  return {
    ...fallback,
    posts: publishedPosts.length,
    drafts: data.posts.filter((post) => post.status === 'draft').length,
    tags: new Set(publishedPosts.flatMap((post) => post.tags)).size,
    categories: new Set(publishedPosts.map((post) => post.category)).size,
    words: publishedPosts.reduce((total, post) => total + post.content.length, 0),
    projects: data.projects.length,
    notes: data.notes.length,
    chatters: data.chatters.length,
    gallery: data.site.gallery.length,
    tracks: data.site.music.length,
    links: data.links.length
  };
}

export function createEmptyStats(): BlogStats {
  return {
    posts: 0,
    drafts: 0,
    tags: 0,
    categories: 0,
    words: 0,
    projects: 0,
    notes: 0,
    chatters: 0,
    gallery: 0,
    tracks: 0,
    links: 0
  };
}

export function createEmptyItem(kind: RecordKind): JsonRecord {
  const stamp = Date.now();
  const iso = new Date().toISOString();

  switch (kind) {
    case 'post':
      return {
        id: `post-${stamp}`,
        title: '新文章',
        slug: `new-post-${stamp}`,
        summary: '',
        content: '',
        tags: [],
        category: '未分类',
        cover: '/assets/img/desk-notes.svg',
        status: 'draft',
        featured: false,
        createdAt: iso,
        updatedAt: iso
      };
    case 'project':
      return {
        id: `project-${stamp}`,
        title: '新项目',
        description: '',
        url: '/',
        repo: '',
        cover: '/assets/img/admin-board.svg',
        tags: [],
        status: 'planning',
        featured: false,
        startedAt: iso.slice(0, 10)
      };
    case 'note':
      return {
        id: `note-${stamp}`,
        title: '新动态',
        content: '',
        date: iso.slice(0, 10),
        mood: '',
        tags: [],
        images: []
      };
    case 'chatter':
      return {
        id: `chatter-${stamp}`,
        slug: `new-chatter-${stamp}`,
        title: '新杂谈',
        summary: '',
        content: '',
        date: iso.slice(0, 10),
        tags: [],
        mood: '',
        cover: '/assets/img/desk-notes.svg',
        featured: false
      };
    case 'gallery':
      return {
        title: '新图片',
        description: '',
        image: '/assets/img/hero-mountain.svg',
        alt: '',
        collection: '',
        location: '',
        date: iso.slice(0, 10),
        featured: false,
        tags: [],
        items: []
      };
    case 'music':
      return {
        id: `track-${stamp}`,
        title: '新曲目',
        artist: '',
        mood: '',
        url: '',
        cover: '/assets/img/desk-notes.svg',
        source: 'local',
        note: ''
      };
    case 'link':
      return {
        title: '新友链',
        url: 'https://example.com',
        description: '待确认的友链申请。',
        avatar: '/assets/img/avatar-orbit.svg',
        category: '个人站',
        owner: '',
        status: 'pending',
        addedAt: iso.slice(0, 10),
        reciprocal: false,
        note: '',
        themeColor: 'rgba(124, 217, 255, 0.55)'
      };
    case 'column':
      return {
        id: `custom-${stamp}`,
        href: '/',
        label: '新栏目',
        title: '新栏目',
        intro: '',
        visible: true,
        navVisible: true,
        homeVisible: false,
        toolboxVisible: false,
        coordinate: '',
        tone: 'Custom',
        room: 'Custom'
      };
  }
}

export function withFreshIdentity(record: JsonRecord, kind: RecordKind): JsonRecord {
  const stamp = Date.now();
  const next = cloneData(record);

  if (typeof next.id === 'string') {
    next.id = `${next.id}-copy-${stamp}`;
  }
  if (typeof next.slug === 'string') {
    next.slug = `${next.slug}-copy-${stamp}`;
  }
  if (!next.id && kind !== 'gallery' && kind !== 'link') {
    next.id = `${kind}-${stamp}`;
  }

  return next;
}

export function recordTitle(record: JsonRecord, kind: RecordKind): string {
  if (typeof record.title === 'string' && record.title) {
    return record.title;
  }
  if (typeof record.label === 'string' && record.label) {
    return record.label;
  }
  if (typeof record.url === 'string' && record.url) {
    return record.url;
  }
  return `未命名 ${kind}`;
}

export function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function parseJsonDraft(value: string): { ok: true; data: BlogData } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(value) as BlogData;
    return { ok: true, data: parsed };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '备份文件格式不正确。'
    };
  }
}

export function getAtPath(source: unknown, path: PathSegment[]): unknown {
  return path.reduce((current: unknown, segment) => {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (Array.isArray(current)) {
      return current[Number(segment)];
    }
    if (isRecord(current)) {
      return current[String(segment)];
    }
    return undefined;
  }, source);
}

export function setAtPath<T>(source: T, path: PathSegment[], value: unknown): T {
  return updateAtPath(source, path, () => value);
}

export function updateAtPath<T>(source: T, path: PathSegment[], updater: (current: unknown) => unknown): T {
  if (path.length === 0) {
    return updater(source) as T;
  }

  const [head, ...tail] = path;

  if (Array.isArray(source)) {
    const next = [...source] as unknown[];
    next[Number(head)] = updateAtPath(next[Number(head)], tail, updater);
    return next as T;
  }

  if (isRecord(source)) {
    return {
      ...source,
      [String(head)]: updateAtPath(source[String(head)], tail, updater)
    } as T;
  }

  return source;
}

export function asRecordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord).map((item) => item) : [];
}

export function toTextLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (isRecord(item) && typeof item.text === 'string') {
          return typeof item.time === 'number' ? `${item.time} ${item.text}` : item.text;
        }
        return '';
      })
      .filter(Boolean);
  }

  return typeof value === 'string' && value ? value.split(/\r?\n/) : [];
}

export function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value);
}

export function numberInputValue(value: unknown): string | number {
  return typeof value === 'number' && Number.isFinite(value) ? value : '';
}

export function parseNumberInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
