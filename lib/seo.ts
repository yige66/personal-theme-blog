import type { Metadata } from 'next';
import type { BlogData, BlogPost, BlogSite } from '@/lib/blog';

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export type PublicRoute = {
  path: string;
  title: string;
  description: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

export const PUBLIC_ROUTES: PublicRoute[] = [
  {
    path: '/',
    title: '首页',
    description: '个人博客门户，聚合文章、项目、动态、音乐、照片墙和本地 CMS 入口。',
    changeFrequency: 'daily',
    priority: 1
  },
  {
    path: '/archive',
    title: '文章归档',
    description: '按时间线回看文章、项目记录和学习笔记。',
    changeFrequency: 'weekly',
    priority: 0.9
  },
  {
    path: '/projects',
    title: '项目与作品',
    description: '展示练习项目、系统实验和长期作品矩阵。',
    changeFrequency: 'weekly',
    priority: 0.85
  },
  {
    path: '/tags',
    title: '标签云',
    description: '通过标签探索文章主题和知识路径。',
    changeFrequency: 'weekly',
    priority: 0.76
  },
  {
    path: '/gallery',
    title: '灵境照片墙',
    description: '展示站点视觉素材、照片和生活片段。',
    changeFrequency: 'weekly',
    priority: 0.72
  },
  {
    path: '/moments',
    title: '近期动态',
    description: '记录站点维护、学习进度和日常状态。',
    changeFrequency: 'daily',
    priority: 0.7
  },
  {
    path: '/music',
    title: '音乐歌单',
    description: '维护阅读和写作时的背景音乐列表。',
    changeFrequency: 'monthly',
    priority: 0.62
  },
  {
    path: '/links',
    title: '友链',
    description: '整理站内外入口和友链推荐。',
    changeFrequency: 'monthly',
    priority: 0.58
  },
  {
    path: '/about',
    title: '关于',
    description: '了解作者、站点状态和联系方式。',
    changeFrequency: 'monthly',
    priority: 0.68
  },
  {
    path: '/console',
    title: '控制台入口',
    description: '进入本地优先的博客内容管理工作台。',
    changeFrequency: 'monthly',
    priority: 0.42
  }
];

export const staticPageMetadata = Object.fromEntries(
  PUBLIC_ROUTES.filter((route) => route.path !== '/').map((route) => [route.path.slice(1), createStaticMetadata(route)])
) as Record<string, Metadata>;

export function getSiteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
}

export function absoluteUrl(path: string, base = getSiteUrl()): string {
  return new URL(path.startsWith('/') ? path : `/${path}`, base).toString();
}

export function createSiteMetadata(site: BlogSite): Metadata {
  return {
    metadataBase: getSiteUrl(),
    applicationName: site.title,
    title: {
      default: site.title,
      template: `%s | ${site.title}`
    },
    description: site.subtitle,
    authors: [{ name: site.owner, url: site.github }],
    creator: site.owner,
    publisher: site.owner,
    keywords: [site.title, site.owner, '个人博客', '技术博客', '项目作品', '生活记录'],
    alternates: {
      canonical: '/'
    },
    manifest: '/manifest.webmanifest',
    openGraph: {
      title: site.title,
      description: site.subtitle,
      url: '/',
      siteName: site.title,
      type: 'website',
      locale: 'zh_CN',
      images: [{ url: site.heroImage, alt: site.title }]
    },
    twitter: {
      card: 'summary_large_image',
      title: site.title,
      description: site.subtitle,
      images: [site.heroImage]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}

export function createPostMetadata(site: BlogSite, post: BlogPost): Metadata {
  const path = `/posts/${post.slug}`;

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: path
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      url: path,
      siteName: site.title,
      type: 'article',
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [site.owner],
      tags: post.tags,
      images: [{ url: post.cover, alt: post.title }]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [post.cover]
    }
  };
}

export function createTagMetadata(tag: string, postCount: number): Metadata {
  const title = `#${tag}`;
  const description = `浏览 ${postCount} 篇与 ${tag} 相关的文章。`;
  const path = `/tags/${encodeURIComponent(tag)}`;

  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description,
      url: path,
      type: 'website'
    }
  };
}

export function createWebsiteJsonLd(data: BlogData) {
  const base = getSiteUrl();
  const publishedPosts = data.posts.filter((post) => post.status === 'published').slice(0, 10);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: data.site.title,
      url: base.origin,
      description: data.site.subtitle,
      inLanguage: 'zh-CN',
      publisher: {
        '@type': 'Person',
        name: data.site.owner,
        url: data.site.github
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: data.site.owner,
      url: base.origin,
      sameAs: [data.site.github].filter(Boolean),
      jobTitle: data.site.role,
      description: data.site.bio,
      image: absoluteUrl(data.site.avatar, base)
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: data.site.title,
      url: base.origin,
      blogPost: publishedPosts.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: absoluteUrl(`/posts/${post.slug}`, base),
        datePublished: post.createdAt,
        dateModified: post.updatedAt
      }))
    }
  ];
}

export function createArticleJsonLd(site: BlogSite, post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    image: [absoluteUrl(post.cover)],
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: site.owner,
      url: site.github
    },
    publisher: {
      '@type': 'Person',
      name: site.owner
    },
    mainEntityOfPage: absoluteUrl(`/posts/${post.slug}`),
    keywords: post.tags.join(', ')
  };
}

export function toJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function mostRecentDate(values: string[]): Date | undefined {
  const latest = values
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  return latest ? new Date(latest) : undefined;
}

function createStaticMetadata(route: PublicRoute): Metadata {
  return {
    title: route.title,
    description: route.description,
    alternates: {
      canonical: route.path
    },
    openGraph: {
      title: route.title,
      description: route.description,
      url: route.path,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: route.title,
      description: route.description
    }
  };
}
