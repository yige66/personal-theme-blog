export type RssFeedItem = {
  title: string;
  summary: string;
  url: string;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
};

export type RssFeedOptions = {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  items: RssFeedItem[];
};

export function createRssFeed({ title, description, siteUrl, feedUrl, items }: RssFeedOptions): string {
  const publishedItems = items
    .filter((item) => item.status === 'published')
    .toSorted((first, second) => toTimestamp(second.createdAt) - toTimestamp(first.createdAt));
  const lastBuildDate = formatRssDate(latestDate(publishedItems.map((item) => item.updatedAt)));
  const channelUpdate = lastBuildDate ? `\n    <lastBuildDate>${lastBuildDate}</lastBuildDate>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
    <language>zh-CN</language>
    <ttl>300</ttl>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${channelUpdate}
${publishedItems.map(renderRssItem).join('\n')}
  </channel>
</rss>
`;
}

function renderRssItem(item: RssFeedItem): string {
  const publishedDate = formatRssDate(item.createdAt);
  const updatedDate = formatRssDate(item.updatedAt);
  const dates = [
    publishedDate ? `    <pubDate>${publishedDate}</pubDate>` : '',
    updatedDate ? `    <atom:updated>${updatedDate}</atom:updated>` : ''
  ].filter(Boolean);

  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <description>${escapeXml(item.summary)}</description>
${dates.join('\n')}
    </item>`;
}

function latestDate(values: string[]): Date | null {
  return values.reduce<Date | null>((latest, value) => {
    const candidate = toDate(value);
    if (!candidate) {
      return latest;
    }

    if (!latest || candidate > latest) {
      return candidate;
    }

    return latest;
  }, null);
}

function formatRssDate(value: string | Date | null): string {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : toDate(value);
  return date ? date.toUTCString() : '';
}

function toDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function toTimestamp(value: string): number {
  return toDate(value)?.getTime() ?? Number.NEGATIVE_INFINITY;
}

function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
