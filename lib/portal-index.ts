import type { BlogData, BlogPost } from './blog';

export type PortalEntryKind = '文章' | '项目' | '动态' | '杂谈' | '相册' | '音乐' | '友链' | '路由';

export type PortalSearchEntry = {
  id: string;
  type: PortalEntryKind;
  title: string;
  description: string;
  href: string;
  keywords: string[];
  weight: number;
};

export type PortalChannel = {
  id: string;
  title: string;
  eyebrow: string;
  href: string;
  count: number;
  entries: PortalSearchEntry[];
};

export type PortalSearchResult = PortalSearchEntry & {
  score: number;
  matched: string[];
};

export function createPortalSearchEntries(data: BlogData, posts: BlogPost[]): PortalSearchEntry[] {
  return [
    ...posts.map((post) => ({
      id: `post:${post.slug}`,
      type: '文章' as const,
      title: post.title,
      description: post.summary,
      href: `/posts/${post.slug}`,
      keywords: [post.category, ...post.tags, post.featured ? 'featured' : ''].filter(Boolean),
      weight: post.featured ? 120 : 90
    })),
    ...data.projects.map((project) => ({
      id: `project:${project.id}`,
      type: '项目' as const,
      title: project.title,
      description: project.description,
      href: project.repo || project.url || '/projects',
      keywords: [project.status, ...project.tags, project.repo].filter(Boolean),
      weight: project.featured ? 110 : 78
    })),
    ...data.notes.slice(0, 12).map((note, index) => ({
      id: `note:${note.id}`,
      type: '动态' as const,
      title: note.title || note.content.slice(0, 18),
      description: note.content,
      href: '/moments',
      keywords: [note.mood || '', ...(note.tags ?? []), note.date].filter(Boolean),
      weight: 72 - index
    })),
    ...data.chatters.map((chatter, index) => ({
      id: `chatter:${chatter.slug}`,
      type: '杂谈' as const,
      title: chatter.title,
      description: chatter.summary || chatter.content,
      href: `/chatter/${chatter.slug}`,
      keywords: [chatter.mood || '', ...chatter.tags, chatter.date].filter(Boolean),
      weight: chatter.featured ? 92 : 70 - index
    })),
    ...data.site.gallery.map((item, index) => ({
      id: `gallery:${item.title}`,
      type: '相册' as const,
      title: item.title,
      description: item.description,
      href: '/photowall',
      keywords: [item.collection || '', item.location || '', item.date || '', ...(item.tags ?? [])].filter(Boolean),
      weight: item.featured ? 98 : 66 - index
    })),
    ...data.site.music.map((track, index) => ({
      id: `music:${track.title}`,
      type: '音乐' as const,
      title: track.title,
      description: `${track.artist} / ${track.mood}`,
      href: '/music',
      keywords: [track.artist, track.mood, track.source || '', track.note || ''].filter(Boolean),
      weight: 58 - index
    })),
    ...data.links.map((link, index) => ({
      id: `friend:${link.title}`,
      type: '友链' as const,
      title: link.title,
      description: link.description,
      href: link.url,
      keywords: [link.url, link.avatar || ''].filter(Boolean),
      weight: 54 - index
    }))
  ];
}

export function searchPortal(entries: PortalSearchEntry[], query: string, limit = 8): PortalSearchResult[] {
  const tokens = tokenize(query);

  if (tokens.length === 0) {
    return entries
      .map((entry) => ({ ...entry, score: entry.weight, matched: [] }))
      .sort(sortResults)
      .slice(0, Math.min(6, limit));
  }

  return entries
    .map((entry) => scoreEntry(entry, tokens))
    .filter((result) => result.score > 0)
    .sort(sortResults)
    .slice(0, limit);
}

export function createPortalChannels(entries: PortalSearchEntry[]): PortalChannel[] {
  return [
    createChannel('posts', '文章索引', 'Library', '/archive', entries, '文章'),
    createChannel('projects', '项目陈列', 'Workshop', '/projects', entries, '项目'),
    createChannel('moments', '动态水流', 'Memory', '/moments', entries, '动态'),
    createChannel('chatter', '云端杂谈', 'Chatter', '/chatter', entries, '杂谈'),
    createChannel('gallery', '视觉衣柜', 'Wardrobe', '/photowall', entries, '相册'),
    createChannel('music', '夜航电台', 'Radio', '/music', entries, '音乐'),
    createChannel('friends', '友链星团', 'Friends', '/friends', entries, '友链')
  ];
}

export function highlightMatchedText(value: string, matched: string[]): Array<{ text: string; hit: boolean }> {
  const needles = matched.map((item) => item.trim()).filter(Boolean).sort((a, b) => b.length - a.length);

  if (needles.length === 0) {
    return [{ text: value, hit: false }];
  }

  const pattern = new RegExp(`(${needles.map(escapeRegExp).join('|')})`, 'ig');
  return value.split(pattern).filter(Boolean).map((text) => ({
    text,
    hit: needles.some((needle) => needle.toLowerCase() === text.toLowerCase())
  }));
}

function createChannel(id: string, title: string, eyebrow: string, href: string, entries: PortalSearchEntry[], type: PortalEntryKind): PortalChannel {
  const channelEntries = entries.filter((entry) => entry.type === type).sort((a, b) => b.weight - a.weight);

  return {
    id,
    title,
    eyebrow,
    href,
    count: channelEntries.length,
    entries: channelEntries.slice(0, 4)
  };
}

function scoreEntry(entry: PortalSearchEntry, tokens: string[]): PortalSearchResult {
  const fields = [
    { value: entry.title, score: 80 },
    { value: entry.description, score: 36 },
    { value: entry.type, score: 24 },
    { value: entry.keywords.join(' '), score: 18 }
  ];
  let score = 0;
  const matched = new Set<string>();

  for (const token of tokens) {
    for (const field of fields) {
      const normalized = normalize(field.value);
      if (normalized.includes(token)) {
        score += field.score + Math.max(0, 12 - normalized.indexOf(token));
        matched.add(token);
      }
    }
  }

  if (matched.size === tokens.length) {
    score += entry.weight;
  }

  return { ...entry, score, matched: [...matched] };
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[\s,/|，。；;、]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function sortResults(a: PortalSearchResult, b: PortalSearchResult): number {
  return b.score - a.score || b.weight - a.weight || a.title.localeCompare(b.title);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
