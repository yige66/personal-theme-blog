import type { BlogData, BlogPost, BlogStats } from './blog';
import type { RoomObstacle } from './room-engine';

export type ExperienceRouteId =
  | 'home'
  | 'projects'
  | 'archive'
  | 'photowall'
  | 'music'
  | 'moments'
  | 'chatter'
  | 'tags'
  | 'friends'
  | 'timeline'
  | 'about'
  | 'console';

export type ExperienceRoute = {
  id: ExperienceRouteId;
  href: string;
  label: string;
  tone: string;
  coordinate: string;
  room: string;
};

export type SpaceModule = {
  id: string;
  href: string;
  label: string;
  title: string;
  coordinate: string;
  value: string;
  detail: string;
};

export type RoomStationId = 'tea' | 'crystal' | 'desk' | 'wardrobe' | 'bed';

export type RoomStation = {
  id: RoomStationId;
  en: string;
  cn: string;
  title: string;
  href: string;
  tone: string;
  position: { x: string; y: string };
  station: { x: string; y: string };
  routePoint: { x: number; y: number };
  tour: string;
};

export type RoomModule = RoomStation & {
  meta: string;
  detail: string;
};

export type DashboardBadge = {
  label: string;
  value: string;
  tone: 'pink' | 'cyan' | 'gold' | 'violet';
};

export const experienceRoutes: ExperienceRoute[] = [
  { id: 'home', href: '/', label: '首页', tone: 'Home', coordinate: '00', room: 'Lobby' },
  { id: 'projects', href: '/projects', label: '项目', tone: 'Work', coordinate: '02', room: 'Workshop' },
  { id: 'archive', href: '/archive', label: '归档', tone: 'Posts', coordinate: '12', room: 'Library' },
  { id: 'photowall', href: '/photowall', label: '照片墙', tone: 'Photo', coordinate: '24', room: 'Wardrobe' },
  { id: 'music', href: '/music', label: '音乐', tone: 'Radio', coordinate: '33', room: 'Sleep' },
  { id: 'moments', href: '/moments', label: '说说', tone: 'Daily', coordinate: '41', room: 'Tea' },
  { id: 'chatter', href: '/chatter', label: '杂谈', tone: 'Chatter', coordinate: '45', room: 'Cloud' },
  { id: 'tags', href: '/tags', label: '标签', tone: 'Tags', coordinate: '57', room: 'Tarot' },
  { id: 'friends', href: '/friends', label: '友链', tone: 'Friends', coordinate: '68', room: 'Starmap' },
  { id: 'timeline', href: '/timeline', label: '时间线', tone: 'Timeline', coordinate: '73', room: 'Archive' },
  { id: 'about', href: '/about', label: '关于', tone: 'Profile', coordinate: '81', room: 'Profile' },
  { id: 'console', href: '/console', label: '后台', tone: 'CMS', coordinate: '99', room: 'Console' }
];

const spaceModuleBlueprints = [
  { id: 'profile', href: '/about', label: 'Profile', title: '个人档案', coordinate: 'A-01' },
  { id: 'library', href: '/archive', label: 'Library', title: '文章书架', coordinate: 'B-12' },
  { id: 'memory', href: '/moments', label: 'Memory', title: '记忆星图', coordinate: 'C-07' },
  { id: 'radio', href: '/music', label: 'Radio', title: '夜航电台', coordinate: 'D-24' }
] as const;

export const roomWalkPolygon = '11,83 21,61 34,48 52,43 73,36 88,50 86,76 66,88 35,91';

export const roomObstacles: RoomObstacle[] = [
  { id: 'wardrobe-body', label: 'Wardrobe', x: 25, y: 28, w: 17, h: 18 },
  { id: 'desk-body', label: 'Desk', x: 72, y: 34, w: 15, h: 14 },
  { id: 'bed-body', label: 'Sleep', x: 9, y: 40, w: 19, h: 12 },
  { id: 'tarot-table', label: 'Tarot', x: 50, y: 56, w: 13, h: 9 },
  { id: 'window-wall', label: 'Window', x: 70, y: 18, w: 14, h: 20 }
];

export const roomStations: RoomStation[] = [
  {
    id: 'tea',
    en: 'Tea',
    cn: '茶歇',
    title: '写作茶歇',
    href: '/moments',
    tone: 'soft-talk',
    position: { x: '26%', y: '69%' },
    station: { x: '39%', y: '76%' },
    routePoint: { x: 39, y: 76 },
    tour: '这里是 Tea 茶歇，把短动态、当天情绪和未完成的念头放进一杯正在冒热气的饮品里。'
  },
  {
    id: 'crystal',
    en: 'Tarot',
    cn: '占卜',
    title: '标签占卜',
    href: '/tags',
    tone: 'reading-route',
    position: { x: '62%', y: '58%' },
    station: { x: '57%', y: '70%' },
    routePoint: { x: 57, y: 70 },
    tour: '这里是 Tarot 标签桌，从标签云抽一张阅读路线，让访客不必只按时间翻找文章。'
  },
  {
    id: 'desk',
    en: 'Story',
    cn: '故事',
    title: '故事书桌',
    href: '/archive',
    tone: 'archive-desk',
    position: { x: '78%', y: '36%' },
    station: { x: '70%', y: '54%' },
    routePoint: { x: 70, y: 54 },
    tour: '这里是 Story 书桌，长文、项目复盘和学习笔记在这里以故事线进入归档。'
  },
  {
    id: 'wardrobe',
    en: 'Wardrobe',
    cn: '衣柜',
    title: '主题衣柜',
    href: '/photowall',
    tone: 'visual-skin',
    position: { x: '36%', y: '30%' },
    station: { x: '35%', y: '52%' },
    routePoint: { x: 35, y: 52 },
    tour: '这里是 Wardrobe 主题衣柜，头像、头图、项目截图和相册素材共同决定站点当天的外观。'
  },
  {
    id: 'bed',
    en: 'Sleep',
    cn: '安睡',
    title: '夜间电台',
    href: '/music',
    tone: 'night-loop',
    position: { x: '18%', y: '42%' },
    station: { x: '24%', y: '62%' },
    routePoint: { x: 24, y: 62 },
    tour: '这里是 Sleep 夜间电台，阅读和写作的背景音乐在这里降低亮度，留一盏安静的小灯。'
  }
];

export const roomTourSteps = roomStations.map((station, index) => ({
  id: station.id,
  order: index + 1,
  title: station.title,
  point: station.routePoint,
  text: station.tour
}));

export function createSpaceModules(data: BlogData, stats: BlogStats): SpaceModule[] {
  const activeTrack = data.site.music[0];
  const latestNote = data.notes[0];

  return [
    {
      ...spaceModuleBlueprints[0],
      value: `Lv.${data.site.level}`,
      detail: data.site.status || data.site.motto
    },
    {
      ...spaceModuleBlueprints[1],
      value: `${stats.posts} 篇`,
      detail: `${stats.words} 字内容正在归档`
    },
    {
      ...spaceModuleBlueprints[2],
      value: `${stats.notes} 条`,
      detail: latestNote?.title || '日常片段会在这里闪烁'
    },
    {
      ...spaceModuleBlueprints[3],
      value: `${stats.tracks} 首`,
      detail: activeTrack ? `${activeTrack.title} / ${activeTrack.artist}` : '等待后台补充歌单'
    }
  ];
}

export function createSpaceSignals(data: BlogData, stats: BlogStats): string[] {
  const activeTrack = data.site.music[0];
  const featuredPhoto = data.site.gallery.find((item) => item.featured) ?? data.site.gallery[0];

  return [
    data.site.location,
    featuredPhoto?.title || '照片墙待更新',
    `${stats.gallery} 个相册入口`,
    `${stats.links} 位友链伙伴`,
    activeTrack?.mood || 'Soft Loop'
  ].filter(Boolean);
}

export function createRoomModules(data: BlogData, stats: BlogStats, featuredPost?: BlogPost): RoomModule[] {
  const activeTrack = data.site.music[0];
  const latestNote = data.notes[0];

  return roomStations.map((station) => {
    if (station.id === 'tea') {
      return { ...station, meta: latestNote?.mood || 'Daily', detail: latestNote?.content || data.site.status };
    }

    if (station.id === 'crystal') {
      return { ...station, meta: `${stats.tags} tags`, detail: '像抽牌一样从标签云里选今天的阅读路线。' };
    }

    if (station.id === 'desk') {
      return {
        ...station,
        href: featuredPost ? `/posts/${featuredPost.slug}` : station.href,
        meta: `${stats.posts} posts`,
        detail: featuredPost?.summary || '把长文、复盘和项目记录都收进故事书桌。'
      };
    }

    if (station.id === 'wardrobe') {
      return { ...station, meta: `${stats.gallery} visuals`, detail: '头图、头像、项目截图和相册素材都在这里换装。' };
    }

    return { ...station, meta: activeTrack?.mood || 'Radio', detail: activeTrack?.note || '把夜间阅读和写作的 BGM 留在侧边。' };
  });
}

export function createDashboardBadges(data: BlogData, stats: BlogStats): DashboardBadge[] {
  return [
    { label: 'Posts', value: `${stats.posts}`, tone: 'pink' },
    { label: 'Words', value: `${stats.words}`, tone: 'cyan' },
    { label: 'Projects', value: `${stats.projects}`, tone: 'gold' },
    { label: 'Radio', value: `${data.site.music.length}`, tone: 'violet' }
  ];
}
