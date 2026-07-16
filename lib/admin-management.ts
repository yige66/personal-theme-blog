import type { BlogData, BlogStats } from '@/lib/blog';
import type { AdminManagementModule, AdminManagementOverview, AdminRiskLevel } from '@/components/admin/adminTypes';

type ModuleInput = {
  id: string;
  label: string;
  group: string;
  route: string;
  pageId: string;
  dataPath: string;
  count: number | string;
  checklist: string[];
  risk?: AdminRiskLevel;
  riskText?: string;
};

const moduleBlueprints: Array<Omit<ModuleInput, 'count'>> = [
  {
    id: 'global',
    label: '全站资料',
    group: '基础管理',
    route: '/',
    pageId: 'home',
    dataPath: 'site',
    checklist: ['站点标题、头像、联系方式完整', '首页封面和关于页头图分开维护', '背景图独立管理']
  },
  {
    id: 'home',
    label: '首页',
    group: '栏目管理',
    route: '/',
    pageId: 'home',
    dataPath: 'site.pages.home / site.columns.home',
    checklist: ['首页标题和说明清楚', '入口按钮指向公开页面', '统计标签可读']
  },
  {
    id: 'projects',
    label: '项目',
    group: '栏目管理',
    route: '/projects',
    pageId: 'projects',
    dataPath: 'projects[] / site.pages.projects',
    checklist: ['项目名称、截图、访问地址完整', '状态说明准确', '精选项目不超过首页承载量']
  },
  {
    id: 'archive',
    label: '文章',
    group: '内容管理',
    route: '/archive',
    pageId: 'archive',
    dataPath: 'posts[] / site.pages.archive',
    checklist: ['标题、摘要、正文、封面齐全', '草稿和已发布状态正确', '标签分类可检索']
  },
  {
    id: 'photowall',
    label: '照片墙',
    group: '素材管理',
    route: '/photowall',
    pageId: 'photowall',
    dataPath: 'site.gallery[] / site.pages.photowall',
    checklist: ['主图和子图可访问', '图片说明完整', '精选相册用于首页展示']
  },

  {
    id: 'music',
    label: '音乐',
    group: '互动管理',
    route: '/music',
    pageId: 'music',
    dataPath: 'site.music[] / site.cloudMusicIds',
    checklist: ['曲名、歌手、封面完整', '外链或云音乐编号安全', '评论区开关明确']
  },
  {
    id: 'moments',
    label: '动态',
    group: '内容管理',
    route: '/moments',
    pageId: 'moments',
    dataPath: 'notes[] / site.pages.moments',
    checklist: ['动态日期和心情标签完整', '配图路径可访问', '关于页时间线同步']
  },
  {
    id: 'chatter',
    label: '杂谈',
    group: '内容管理',
    route: '/chatter',
    pageId: 'chatter',
    dataPath: 'chatters[] / site.pages.chatter',
    checklist: ['短文 slug 唯一', '封面和摘要完整', '活动记录同步到关于页']
  },
  {
    id: 'tags',
    label: '标签',
    group: '内容管理',
    route: '/tags',
    pageId: 'tags',
    dataPath: 'posts[].tags / site.pages.tags',
    checklist: ['标签来自文章', '标签详情页可返回归档', '空标签有提示']
  },
  {
    id: 'friends',
    label: '友链',
    group: '互动管理',
    route: '/friends',
    pageId: 'friends',
    dataPath: 'links[] / site.title / site.github / site.subtitle / site.avatar',
    checklist: ['友链地址为 https/http', '头像和简介完整', '本站申请资料完整']
  },
  {
    id: 'about',
    label: '关于',
    group: '基础管理',
    route: '/about',
    pageId: 'about',
    dataPath: 'site.pages.about / site.aboutHeroImage / site profile',
    checklist: ['头图独立设置', '联系信息准确', '活动时间线有来源']
  },
  {
    id: 'security',
    label: '安全设置',
    group: '系统管理',
    route: '/admin',
    pageId: 'home',
    dataPath: 'site.comments / site.effects / private Blob admin/ai-config.json',
    checklist: ['后台密码不写入公开数据', '评论 OAuth secret 只在环境变量', 'AI 密钥只保存在服务端']
  }
];

export function buildAdminManagementOverview(data: BlogData, stats: BlogStats): AdminManagementOverview {
  const modules = moduleBlueprints.map((blueprint) => createModule(blueprint, data, stats));
  const warnings = collectWarnings(data, stats);

  return {
    generatedAt: new Date().toISOString(),
    summaries: [
      { id: 'posts', label: '文章', value: stats.posts, hint: `${stats.drafts} 篇草稿待确认` },
      { id: 'modules', label: '管理分区', value: modules.length, hint: '每个栏目单独维护' },
      { id: 'assets', label: '素材', value: data.site.gallery.length + data.site.backgroundImages.length, hint: '背景图独立分区' },
      { id: 'warnings', label: '待处理', value: warnings.length, hint: warnings.length > 0 ? '请按提示补齐' : '当前数据完整' }
    ],
    modules,
    warnings
  };
}

function createModule(input: Omit<ModuleInput, 'count'>, data: BlogData, stats: BlogStats): AdminManagementModule {
  const count = countModule(input.id, data, stats);
  const risk = evaluateModuleRisk(input.id, data, stats);

  return {
    ...input,
    count,
    riskLevel: risk.level,
    riskText: risk.text
  };
}

function countModule(id: string, data: BlogData, stats: BlogStats): number | string {
  switch (id) {
    case 'global':
      return data.site.columns.length;
    case 'projects':
      return data.projects.length;
    case 'archive':
    case 'tags':
      return data.posts.length;
    case 'photowall':
    case 'gallery':
      return data.site.gallery.length;
    case 'music':
      return data.site.music.length;
    case 'moments':
      return data.notes.length;
    case 'chatter':
      return data.chatters.length;
    case 'friends':
      return data.links.length;
    case 'about':
      return stats.posts + stats.notes + stats.chatters;
    case 'security':
      return data.site.comments?.enabled ? '已启用评论' : '评论关闭';
    default:
      return '总览';
  }
}

function evaluateModuleRisk(id: string, data: BlogData, stats: BlogStats): { level: AdminRiskLevel; text: string } {
  if (id === 'archive' && stats.drafts > 0) {
    return { level: '注意', text: `${stats.drafts} 篇草稿未发布` };
  }

  if (id === 'photowall' && data.site.backgroundImages.length === 0) {
    return { level: '需处理', text: '还没有背景图' };
  }

  if (id === 'friends' && data.links.length === 0) {
    return { level: '注意', text: '友链列表为空' };
  }

  if (id === 'security' && hasUnsafeSecret(data.site.comments)) {
    return { level: '需处理', text: '评论配置疑似包含 secret' };
  }

  return { level: '正常', text: '数据正常' };
}

function collectWarnings(data: BlogData, stats: BlogStats): string[] {
  const warnings: string[] = [];

  if (!data.site.aboutHeroImage || data.site.aboutHeroImage === data.site.heroImage) {
    warnings.push('关于页头图建议独立设置，避免与首页封面混用。');
  }

  if (data.site.backgroundImages.length === 0) {
    warnings.push('背景图区块还没有图片。');
  }

  if (stats.drafts > 0) {
    warnings.push(`${stats.drafts} 篇文章仍是草稿状态。`);
  }

  if (hasUnsafeSecret(data.site.comments)) {
    warnings.push('评论配置不能保存 OAuth secret，请改用环境变量。');
  }

  return warnings;
}

function hasUnsafeSecret(value: unknown): boolean {
  return typeof value === 'object' && value !== null && ('clientSecret' in value || 'secret' in value);
}
