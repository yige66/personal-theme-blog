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
  category?: string;
  owner?: string;
  addedAt?: string;
  note?: string;
};

export type BlogNote = {
  id: string;
  content: string;
  date: string;
  title?: string;
  mood?: string;
  tags?: string[];
  images?: string[];
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

export type SiteColumn = {
  id: string;
  href: string;
  label: string;
  title: string;
  intro: string;
  visible: boolean;
  navVisible: boolean;
  homeVisible: boolean;
  toolboxVisible: boolean;
  coordinate: string;
  tone: string;
  room: string;
};

export type PageContent = {
  eyebrow: string;
  title: string;
  description: string;
  signal: string;
  statLabels: string[];
  emptyTitle: string;
  emptyDescription: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
  searchPlaceholder: string;
  searchEmptyTitle: string;
  searchEmptyDescription: string;
  commentTitle: string;
  detailLines: string[];
  panelOneTitle: string;
  panelOneDescription: string;
  panelTwoTitle: string;
  panelTwoDescription: string;
  panelThreeTitle: string;
  panelThreeDescription: string;
};

export type FriendLinkApplicationConfig = {
  title: string;
  description: string;
  copyLabel: string;
  copiedLabel: string;
  copyErrorLabel: string;
  commentLabel: string;
};

export type BlogSite = {
  title: string;
  brandSuffix: string;
  subtitle: string;
  owner: string;
  role: string;
  motto: string;
  bio: string;
  status: string;
  location: string;
  email: string;
  github: string;
  projectOrder: string[];
  tags: string[];
  themeColor: string;
  accentColor: string;
  heroImage: string;
  aboutHeroImage: string;
  avatar: string;
  backgroundImages: string[];
  columns: SiteColumn[];
  pages: Record<string, PageContent>;
  level: number;
  experience: number;
  streak: number;
  assistantName: string;
  assistantPrompt: string;
  cloudMusicIds: string[];
  friendLinkApply: FriendLinkApplicationConfig;
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

const fallbackPages: Record<string, PageContent> = {
  home: {
    eyebrow: '主页导航',
    title: '星屿手记',
    description: '文章、项目、动态、音乐、照片墙和友链共同组成这个个人站点。',
    signal: '主舰启程 / 内容星图 / 冒险日志',
    statLabels: ['文章', '动态', '相册'],
    emptyTitle: '等待内容',
    emptyDescription: '在后台补充内容后，首页会自动形成入口。',
    primaryActionLabel: '关于我',
    primaryActionHref: '/about',
    secondaryActionLabel: '文章归档',
    secondaryActionHref: '/archive',
    searchPlaceholder: '搜索文章、项目、动态和栏目',
    searchEmptyTitle: '暂时没有命中',
    searchEmptyDescription: '换一个关键词试试。',
    commentTitle: '',
    detailLines: [],
    panelOneTitle: '照片墙',
    panelOneDescription: '头像、相册和日常素材归档。',
    panelTwoTitle: '近期动态',
    panelTwoDescription: '记录日常片段和轻量状态。',
    panelThreeTitle: '云端杂谈',
    panelThreeDescription: '文章之外的轻记录与复盘。'
  },
  projects: {
    eyebrow: '作品工坊',
    title: '项目星港',
    description: '把练习、系统、文章工程和长期实验整理成可查看、可追踪的作品停靠区。',
    signal: '作品工坊 / 技术试炼 / 冒险日志',
    statLabels: ['项目', '精选', '状态'],
    emptyTitle: '暂无项目',
    emptyDescription: '填写 GitHub 地址并保持仓库公开后，这里会自动生成项目矩阵。',
    primaryActionLabel: '返回首页',
    primaryActionHref: '/',
    secondaryActionLabel: '文章归档',
    secondaryActionHref: '/archive',
    searchPlaceholder: '搜索项目名称、描述或技术栈...',
    searchEmptyTitle: '没有匹配项目',
    searchEmptyDescription: '换一个关键词试试，标题、描述、状态和标签都可以搜索。',
    commentTitle: '',
    detailLines: [
      '系统工程：{role}',
      '内容生态：{status}',
      '长期目标：{motto}'
    ],
    panelOneTitle: '',
    panelOneDescription: '',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  },
  archive: {
    eyebrow: '时光书库',
    title: '归档与探索',
    description: '总计 {postCount} 篇研究记录。',
    signal: '时光书库 / 篇章回放 / 标签索引',
    statLabels: ['文章', '年份', '标签'],
    emptyTitle: '暂无已发布文章',
    emptyDescription: '在后台发布文章后，归档时间线会自动生成。',
    primaryActionLabel: '全部标签',
    primaryActionHref: '/tags',
    secondaryActionLabel: '返回首页',
    secondaryActionHref: '/',
    searchPlaceholder: '搜索文章',
    searchEmptyTitle: '没有匹配的文章',
    searchEmptyDescription: '换一个关键词或标签试试。',
    commentTitle: '',
    detailLines: [],
    panelOneTitle: '',
    panelOneDescription: '',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  },
  photowall: {
    eyebrow: '回忆相册',
    title: '光影照片墙',
    description: '定格时间，封存每一次值得回看的心跳。',
    signal: '回忆相册 / 光影收集 / 心动定格',
    statLabels: ['图集', '照片', '浏览'],
    emptyTitle: '暂无相册素材',
    emptyDescription: '上传图片并加入相册后，照片墙会在这里展开。',
    primaryActionLabel: 'Archive',
    primaryActionHref: '/archive',
    secondaryActionLabel: '动态记录',
    secondaryActionHref: '/moments',
    searchPlaceholder: '搜索相册 / 照片',
    searchEmptyTitle: '没有找到相关的记忆',
    searchEmptyDescription: '换一个关键词试试。',
    commentTitle: '',
    detailLines: [],
    panelOneTitle: '',
    panelOneDescription: '',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  },

  moments: {
    eyebrow: '日常星图',
    title: '生活动态',
    description: '在代码之外捕捉瞬间的温度，用星图串起轻量的日常记录。',
    signal: '日常星图 / 心情弹幕 / 瞬间记录',
    statLabels: ['动态', '主题', '节奏'],
    emptyTitle: '暂无动态',
    emptyDescription: '在后台维护动态后，这里会形成轻量时间线。',
    primaryActionLabel: '阅读文章',
    primaryActionHref: '/archive',
    secondaryActionLabel: '云端杂谈',
    secondaryActionHref: '/chatter',
    searchPlaceholder: '搜索动态',
    searchEmptyTitle: '没有找到这类动态',
    searchEmptyDescription: '换一个心情或标签试试。',
    commentTitle: '',
    detailLines: [],
    panelOneTitle: '',
    panelOneDescription: '',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  },
  chatter: {
    eyebrow: '深夜杂谈',
    title: '云端杂谈',
    description: '代码、学术、日常碎片与复盘想法的轻文章记录。',
    signal: '深夜电波 / 碎碎念札记 / 灵感补给',
    statLabels: ['杂谈', '标签', '形式'],
    emptyTitle: '暂无杂谈',
    emptyDescription: '在后台新增杂谈后，这里会自动形成瀑布流。',
    primaryActionLabel: '生活动态',
    primaryActionHref: '/moments',
    secondaryActionLabel: '文章归档',
    secondaryActionHref: '/archive',
    searchPlaceholder: '搜索杂谈',
    searchEmptyTitle: '没有匹配杂谈',
    searchEmptyDescription: '换一个关键词试试。',
    commentTitle: '',
    detailLines: [],
    panelOneTitle: '',
    panelOneDescription: '',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  },
  music: {
    eyebrow: '夜航电台',
    title: '星屿电台',
    description: '写作、阅读和编码时的背景歌单。',
    signal: '夜航歌单 / 耳机结界 / 码字配乐',
    statLabels: ['曲目', '可播', '用途'],
    emptyTitle: '暂无音乐',
    emptyDescription: '在后台添加曲目后，这里会成为站点电台。',
    primaryActionLabel: '文章归档',
    primaryActionHref: '/archive',
    secondaryActionLabel: '边听边读',
    secondaryActionHref: '/archive',
    searchPlaceholder: '搜索歌单',
    searchEmptyTitle: '没有匹配的歌曲',
    searchEmptyDescription: '换一个歌曲、歌手或场景关键词试试。',
    commentTitle: '星屿电台',
    detailLines: [],
    panelOneTitle: '',
    panelOneDescription: '',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  },
  friends: {
    eyebrow: '友人星图',
    title: '友链星团',
    description: '那些散落在网络宇宙各处的有趣灵魂与站点节点。',
    signal: '次元通讯录 / 友人据点 / 互访信标',
    statLabels: ['友链', '申请', '留言'],
    emptyTitle: '暂无友链',
    emptyDescription: '在后台新增友链后，这里会自动生成朋友站点卡片。',
    primaryActionLabel: '申请格式',
    primaryActionHref: '#gitalk-container',
    secondaryActionLabel: '返回首页',
    secondaryActionHref: '/',
    searchPlaceholder: '搜索友链',
    searchEmptyTitle: '没有匹配友链',
    searchEmptyDescription: '换一个名称或描述关键词试试。',
    commentTitle: '友链',
    detailLines: [],
    panelOneTitle: '建立神经连接',
    panelOneDescription: '欢迎交换友链，请复制下方格式，并在底部留言区申请。',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  },
  tags: {
    eyebrow: '标签星云',
    title: '标签星云',
    description: '用标签把文章、主题和学习线索连起来，快速进入同一类内容轨道。',
    signal: '主题星云 / 关键词轨道 / 阅读传送门',
    statLabels: ['标签', '文章', '排序'],
    emptyTitle: '暂无标签',
    emptyDescription: '发布带标签的文章后，这里会形成标签星云。',
    primaryActionLabel: '回到归档',
    primaryActionHref: '/archive',
    secondaryActionLabel: '项目索引',
    secondaryActionHref: '/projects',
    searchPlaceholder: '搜索标签',
    searchEmptyTitle: '没有匹配标签',
    searchEmptyDescription: '换一个关键词试试。',
    commentTitle: '',
    detailLines: [],
    panelOneTitle: '',
    panelOneDescription: '',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  },
  'tag-detail': {
    eyebrow: '同好索引',
    title: '#{tag}',
    description: '同一标签下的文章集合，被收束到一条可以继续漫游的阅读轨道里。',
    signal: '「{tag}」 / {postCount} 篇同好记录 / 阅读航线',
    statLabels: ['文章', '标签', '阅读'],
    emptyTitle: '暂无文章',
    emptyDescription: '这个标签下暂时没有文章。',
    primaryActionLabel: '全部标签',
    primaryActionHref: '/tags',
    secondaryActionLabel: '时间归档',
    secondaryActionHref: '/archive',
    searchPlaceholder: '',
    searchEmptyTitle: '',
    searchEmptyDescription: '',
    commentTitle: '',
    detailLines: [],
    panelOneTitle: '',
    panelOneDescription: '',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  },
  about: {
    eyebrow: '角色档案',
    title: '关于我',
    description: '欢迎来到我的个人据点',
    signal: '角色档案 / 创作轨迹 / 联络频道',
    statLabels: ['文章', '杂谈', '说说', '相册'],
    emptyTitle: '暂无活动',
    emptyDescription: '新增文章、动态或杂谈后，这里会形成活动时间线。',
    primaryActionLabel: '活动时间线',
    primaryActionHref: '/about?tab=activity',
    secondaryActionLabel: '友链',
    secondaryActionHref: '/friends',
    searchPlaceholder: '',
    searchEmptyTitle: '',
    searchEmptyDescription: '',
    commentTitle: '',
    detailLines: [],
    panelOneTitle: '自我介绍',
    panelOneDescription: '你好，我是 {owner}。',
    panelTwoTitle: '研究与创作方向',
    panelTwoDescription: '围绕工程实践、内容系统和长期写作组织个人站点。',
    panelThreeTitle: '联系信息',
    panelThreeDescription: '欢迎联系交流。'
  }
};

const fallbackSite: BlogSite = {
  title: 'Yuki',
  brandSuffix: 'の Blog',
  subtitle: '记录 Java 后端、Next.js 个人站和一些真实项目练习。',
  owner: 'Yuki',
  role: 'Java / Spring Boot 与 Next.js 学习实践者',
  motto: '先把能跑通的系统做好，再慢慢把体验和细节补上。',
  bio: '围绕 Java、Spring Boot、MySQL、Redis、Next.js、TypeScript 和 AI 接口做项目练习。',
  status: '正在整理公开项目、学习笔记和个人站内容，QQ 邮箱可联系。',
  location: '不公开',
  email: '1772365571@qq.com',
  github: 'https://github.com/yige66/personal-theme-blog',
  projectOrder: [],
  tags: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Next.js', 'TypeScript', 'AI \u5e94\u7528', '\u9879\u76ee\u590d\u76d8', '\u5185\u5bb9\u7cfb\u7edf'],
  themeColor: '#6fb7a8',
  accentColor: '#f0c36a',
  heroImage: '/assets/img/hero-mountain.svg',
  aboutHeroImage: '/assets/img/hero-mountain.svg',
  avatar: '/assets/img/avatar-orbit.svg',
  backgroundImages: ['/assets/img/hero-mountain.svg', '/assets/img/desk-notes.svg', '/assets/img/admin-board.svg'],
  pages: fallbackPages,
  columns: [
    { id: 'home', href: '/', label: '首页', title: '首页', intro: '站点总览入口', visible: true, navVisible: true, homeVisible: false, toolboxVisible: false, coordinate: '00', tone: 'Home', room: 'Lobby' },
    { id: 'projects', href: '/projects', label: '项目', title: '项目陈列', intro: '项目、作品和系统实践入口。', visible: true, navVisible: true, homeVisible: false, toolboxVisible: false, coordinate: '02', tone: 'Work', room: 'Workshop' },
    { id: 'archive', href: '/archive', label: '文章', title: '文章归档', intro: '按年份、分类和标签回看长文记录。', visible: true, navVisible: true, homeVisible: true, toolboxVisible: true, coordinate: '12', tone: 'Posts', room: 'Library' },
    { id: 'photowall', href: '/photowall', label: '照片墙', title: '照片墙', intro: '头图、相册、截图和日常视觉素材。', visible: true, navVisible: true, homeVisible: true, toolboxVisible: true, coordinate: '24', tone: 'Photo', room: 'Wardrobe' },
    { id: 'music', href: '/music', label: '音乐', title: '夜航电台', intro: '背景音乐、歌词和播放列表。', visible: true, navVisible: true, homeVisible: true, toolboxVisible: true, coordinate: '33', tone: 'Radio', room: 'Sleep' },
    { id: 'moments', href: '/moments', label: '动态', title: '生活动态', intro: '轻量说说、心情和日常片段。', visible: true, navVisible: true, homeVisible: false, toolboxVisible: true, coordinate: '41', tone: 'Daily', room: 'Tea' },
    { id: 'chatter', href: '/chatter', label: '杂谈', title: '云端杂谈', intro: '文章之外的轻记录和碎片想法。', visible: true, navVisible: true, homeVisible: true, toolboxVisible: true, coordinate: '45', tone: 'Chatter', room: 'Cloud' },
    { id: 'tags', href: '/tags', label: '标签', title: '标签索引', intro: '从标签云进入主题阅读路径。', visible: true, navVisible: true, homeVisible: false, toolboxVisible: false, coordinate: '57', tone: 'Tags', room: 'Tarot' },
    { id: 'friends', href: '/friends', label: '友链', title: '友链星团', intro: '朋友站点和互访入口。', visible: true, navVisible: true, homeVisible: true, toolboxVisible: true, coordinate: '68', tone: 'Friends', room: 'Friends' },
    { id: 'about', href: '/about', label: '关于', title: '关于我', intro: '个人资料、时间线和联系方式。', visible: true, navVisible: true, homeVisible: false, toolboxVisible: false, coordinate: '81', tone: 'Profile', room: 'Profile' }
  ],
  level: 12,
  experience: 68,
  streak: 27,
  assistantName: '星屿助手',
  assistantPrompt: '根据文章、动态和作者资料，为访客推荐阅读路径。',
  cloudMusicIds: ['1901371647', '1859245776', '1974443814'],
  friendLinkApply: {
    title: '友链申请',
    description: '复制本站信息，并在下方留言区提交你的站点资料。',
    copyLabel: '复制本站信息',
    copiedLabel: '已复制',
    copyErrorLabel: '复制失败，请手动复制',
    commentLabel: '前往留言区申请'
  },
  entry: {
    ariaLabel: 'Site entry',
    preloaderTitle: 'Yuki Blog',
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
      '今天也在把项目记录写清楚',
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
      title: '后台表单',
      description: '内容、图片和栏目配置都可以在后台分区维护。',
      image: '/assets/img/admin-board.svg',
      alt: '后台表单插画'
    }
  ]
};

const fallbackProjects: BlogProject[] = [
  {
    id: 'project-console',
    title: 'Personal Blog Admin',
    description: '一个可维护的个人博客内容系统，用 JSON 数据源串联文章、动态、音乐、相册、友链和后台分区管理。',
    url: '/projects',
    repo: 'https://github.com/yige66/personal-theme-blog',
    cover: '/assets/img/admin-board.svg',
    tags: ['Next.js', 'Deploy', 'JSON'],
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
    tags: data.site.tags.length,
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

export function getPageContent(site: BlogSite, id: string): PageContent {
  return site.pages[id] ?? fallbackPages[id] ?? createFallbackPageContent(id);
}

export function getPageActions(page: PageContent): Array<{ href: string; label: string }> {
  return [
    { href: page.primaryActionHref, label: page.primaryActionLabel },
    { href: page.secondaryActionHref, label: page.secondaryActionLabel }
  ].filter((action) => Boolean(action.href && action.label));
}

export function getPageStatLabel(page: PageContent, index: number, fallback: string): string {
  return page.statLabels[index] || fallback;
}

export function formatPageText(value: string, variables: Record<string, string | number>): string {
  return value.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key: string) => {
    const replacement = variables[key];
    return replacement === undefined ? match : String(replacement);
  });
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
  const { friendLinkApplyFormat: _legacyFriendLinkApplyFormat, ...siteInput } = (input.site ?? {}) as Partial<BlogSite> & { friendLinkApplyFormat?: unknown };
  const site: BlogSite = {
    ...fallbackSite,
    ...siteInput,
    brandSuffix: typeof siteInput.brandSuffix === 'string' ? siteInput.brandSuffix.trim() : fallbackSite.brandSuffix,
    comments: normalizeCommentConfig(siteInput.comments),
    cloudMusicIds: normalizeCloudMusicIds(siteInput.cloudMusicIds),
    projectOrder: normalizeProjectOrder(siteInput.projectOrder),
    tags: normalizeTagLibrary(siteInput.tags, input.posts, input.chatters, fallbackSite.tags),
    friendLinkApply: normalizeFriendLinkApplication(siteInput.friendLinkApply),
    music: normalizeMusicTracks(siteInput.music),
    gallery: normalizeArray(siteInput.gallery, fallbackSite.gallery),
    heroImage: normalizeOptionalAsset(siteInput.heroImage) || fallbackSite.heroImage,
    aboutHeroImage: normalizeOptionalAsset(siteInput.aboutHeroImage) || normalizeOptionalAsset(siteInput.heroImage) || fallbackSite.aboutHeroImage,
    avatar: siteInput.avatar || fallbackSite.avatar,
    backgroundImages: normalizeAssetList(siteInput.backgroundImages, fallbackSite.backgroundImages),
    columns: normalizeColumns(siteInput.columns),
    pages: normalizePages(siteInput.pages),
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
    links: normalizeLinks(input.links),
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

function normalizeProjectOrder(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => {
      if (!item || item.length > 200 || /[\u0000-\u001f\u007f]/.test(item)) {
        return false;
      }
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 100);
}

function normalizeTagLibrary(value: unknown, posts: unknown, chatters: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    return dedupeTagNames(value).slice(0, 100);
  }

  const derivedTags = dedupeTagNames([
    ...collectTagsFromRecords(posts),
    ...collectTagsFromRecords(chatters)
  ]).slice(0, 100);

  return derivedTags.length > 0 ? derivedTags : fallback;
}
function collectTagsFromRecords(records: unknown): unknown[] {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.flatMap((record) => {
    if (!record || typeof record !== 'object' || !('tags' in record)) {
      return [];
    }
    const value = (record as { tags?: unknown }).tags;
    return Array.isArray(value) ? value : [];
  });
}

function dedupeTagNames(values: unknown[]): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const tag = typeof value === 'string' ? value.trim() : '';
    if (!tag || tag.length > 80 || /[\u0000-\u001f\u007f]/.test(tag)) {
      continue;
    }
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, tag);
    }
  }

  return [...seen.values()];
}
function normalizeAssetList(value: unknown, fallback: string[]): string[] {
  const source = Array.isArray(value) ? value : fallback;
  const seen = new Set<string>();
  const assets = source
    .map((item) => typeof item === 'string' ? item.trim() : '')
    .filter((item) => Boolean(item) && (/^https?:\/\/[^\s]+$/i.test(item) || /^\/(?!\/)[a-zA-Z0-9/_:.-]+$/.test(item)))
    .filter((item) => {
      if (seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    });

  return Array.isArray(value) ? assets : fallback;
}

function normalizeLinks(value: unknown): BlogLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const links: BlogLink[] = [];
  value.filter(isRecord).forEach((link, index) => {
    const title = textOrFallback(link.title, `Friend ${index + 1}`);
    const url = normalizeExternalUrl(link.url);
    if (!url) {
      return;
    }

    links.push({
      title,
      url,
      description: textOrFallback(link.description, url),
      avatar: normalizeOptionalAsset(link.avatar),
      themeColor: typeof link.themeColor === 'string' ? link.themeColor.trim() : undefined,
      category: typeof link.category === 'string' ? link.category.trim() || undefined : undefined,
      owner: typeof link.owner === 'string' ? link.owner.trim() || undefined : undefined,
      addedAt: normalizeDateOnly(link.addedAt),
      note: typeof link.note === 'string' ? link.note.trim() || undefined : undefined
    });
  });

  return links;
}


function normalizeDateOnly(value: unknown): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}

function normalizeMusicTracks(value: unknown): MusicTrack[] {
  const source = Array.isArray(value) ? value : fallbackSite.music;

  return source
    .filter(isRecord)
    .map((track, index) => ({
      id: typeof track.id === 'string' && track.id.trim() ? track.id.trim() : undefined,
      title: textOrFallback(track.title, `Track ${index + 1}`),
      artist: textOrFallback(track.artist, 'Local Playlist'),
      mood: textOrFallback(track.mood, 'Focus'),
      url: normalizePlayableUrl(track.url),
      cover: normalizeOptionalAsset(track.cover) || fallbackSite.avatar,
      source: textOrFallback(track.source, track.provider === 'netease' ? 'netease-cloud' : 'local'),
      note: typeof track.note === 'string' ? track.note : undefined,
      provider: typeof track.provider === 'string' && track.provider.trim() ? track.provider.trim() : 'local',
      duration: toInteger(track.duration, 0) || undefined,
      lrc: typeof track.lrc === 'string' ? track.lrc : undefined,
      lyric: typeof track.lyric === 'string' ? track.lyric : undefined,
      lyrics: Array.isArray(track.lyrics) || typeof track.lyrics === 'string' ? track.lyrics as MusicTrack['lyrics'] : undefined
    }));
}

function normalizeCommentConfig(value: unknown): CommentConfig {
  const source = isRecord(value) ? value as Partial<CommentConfig> : {};
  const envRepo = readRuntimeEnv('NEXT_PUBLIC_GITALK_REPO', 'GITALK_REPO', 'GITHUB_COMMENTS_REPO');
  const envOwner = readRuntimeEnv('NEXT_PUBLIC_GITALK_OWNER', 'GITALK_OWNER', 'GITHUB_COMMENTS_OWNER');
  const envAdmin = readRuntimeEnv('NEXT_PUBLIC_GITALK_ADMIN', 'GITALK_ADMIN', 'GITHUB_COMMENTS_ADMIN');
  const envClientId = readRuntimeEnv('NEXT_PUBLIC_GITALK_CLIENT_ID', 'GITALK_CLIENT_ID', 'GITHUB_CLIENT_ID');
  const envProxy = readRuntimeEnv('GITALK_PROXY_PATH', 'GITHUB_COMMENTS_PROXY');
  const base = {
    ...fallbackSite.comments,
    ...source
  };
  const parsedRepo = parseGitHubRepo(envRepo || base.repo);
  const repo = normalizeGitHubName(parsedRepo.repo || base.repo) || fallbackSite.comments.repo;
  const owner = normalizeGitHubName(envOwner || parsedRepo.owner || base.owner) || fallbackSite.comments.owner || '';
  const clientId = envClientId || (typeof base.clientId === 'string' ? base.clientId.trim() : '');
  const admin = normalizeGitHubAdminList(base.admin, owner, envAdmin);
  const provider = textOrFallback(base.provider, fallbackSite.comments.provider).toLowerCase();
  const enabledByConfig = base.enabled !== false;
  const gitalkConfigured = provider.includes('gitalk') && Boolean(repo && owner);

  return {
    ...base,
    enabled: enabledByConfig && gitalkConfigured,
    provider,
    repo,
    owner,
    admin,
    clientId,
    proxy: normalizeLocalPath(envProxy || base.proxy, '/api/github'),
    mapping: normalizeCommentMapping(base.mapping),
    label: normalizeGitHubLabel(base.label),
    theme: normalizeCommentTheme(base.theme)
  };
}

const removedPublicPageIds = new Set(['console', 'gallery']);

function normalizeColumns(value: unknown): SiteColumn[] {
  const input = Array.isArray(value) ? value : [];
  const byId = new Map(
    input
      .filter((item): item is Partial<SiteColumn> => typeof item === 'object' && item !== null)
      .map((item) => [typeof item.id === 'string' ? item.id.trim() : '', item] as const)
      .filter(([id]) => Boolean(id) && !removedPublicPageIds.has(id))
  );

  const columns = fallbackSite.columns.map((fallback) => normalizeColumn(byId.get(fallback.id), fallback));
  const customColumns = input
    .filter((item): item is Partial<SiteColumn> => typeof item === 'object' && item !== null)
    .filter((item) => typeof item.id === 'string' && !removedPublicPageIds.has(item.id) && !fallbackSite.columns.some((fallback) => fallback.id === item.id))
    .slice(0, 6)
    .map((item) => normalizeColumn(item, null));

  return [...columns, ...customColumns];
}

function normalizeColumn(value: Partial<SiteColumn> | undefined, fallback: SiteColumn | null): SiteColumn {
  const id = validColumnId(value?.id) || fallback?.id || 'custom';
  return {
    id,
    href: fallback?.href || safeHref(value?.href) || '#',
    label: textOrFallback(value?.label, fallback?.label || id),
    title: textOrFallback(value?.title, fallback?.title || value?.label || id),
    intro: textOrFallback(value?.intro, fallback?.intro || ''),
    visible: value?.visible ?? fallback?.visible ?? true,
    navVisible: value?.navVisible ?? fallback?.navVisible ?? true,
    homeVisible: value?.homeVisible ?? fallback?.homeVisible ?? false,
    toolboxVisible: value?.toolboxVisible ?? fallback?.toolboxVisible ?? false,
    coordinate: textOrFallback(value?.coordinate, fallback?.coordinate || ''),
    tone: textOrFallback(value?.tone, fallback?.tone || ''),
    room: textOrFallback(value?.room, fallback?.room || '')
  };
}

function normalizePages(value: unknown): Record<string, PageContent> {
  const source = isRecord(value) ? value : {};
  const pageIds = new Set([
    ...Object.keys(fallbackPages),
    ...fallbackSite.columns.map((column) => column.id),
    ...Object.keys(source)
  ]);
  const pages: Record<string, PageContent> = {};

  for (const id of pageIds) {
    if (removedPublicPageIds.has(id)) {
      continue;
    }

    if (!validColumnId(id) && id !== 'tag-detail') {
      continue;
    }
    const fallback = fallbackPages[id] ?? createFallbackPageContent(id);
    const pageInput = isRecord(source[id]) ? source[id] : {};
    pages[id] = normalizePageContent(pageInput, fallback);
  }

  return pages;
}

function normalizePageContent(value: Record<string, unknown>, fallback: PageContent): PageContent {
  return {
    eyebrow: textOrFallback(value.eyebrow, fallback.eyebrow),
    title: textOrFallback(value.title, fallback.title),
    description: textOrFallback(value.description, fallback.description),
    signal: textOrFallback(value.signal, fallback.signal),
    statLabels: normalizeTextList(value.statLabels, fallback.statLabels, 6),
    emptyTitle: textOrFallback(value.emptyTitle, fallback.emptyTitle),
    emptyDescription: textOrFallback(value.emptyDescription, fallback.emptyDescription),
    primaryActionLabel: textOrFallback(value.primaryActionLabel, fallback.primaryActionLabel),
    primaryActionHref: safeHref(value.primaryActionHref) || fallback.primaryActionHref,
    secondaryActionLabel: textOrFallback(value.secondaryActionLabel, fallback.secondaryActionLabel),
    secondaryActionHref: safeHref(value.secondaryActionHref) || fallback.secondaryActionHref,
    searchPlaceholder: textOrFallback(value.searchPlaceholder, fallback.searchPlaceholder),
    searchEmptyTitle: textOrFallback(value.searchEmptyTitle, fallback.searchEmptyTitle),
    searchEmptyDescription: textOrFallback(value.searchEmptyDescription, fallback.searchEmptyDescription),
    commentTitle: textOrFallback(value.commentTitle, fallback.commentTitle),
    detailLines: normalizeTextList(value.detailLines, fallback.detailLines, 8),
    panelOneTitle: textOrFallback(value.panelOneTitle, fallback.panelOneTitle),
    panelOneDescription: textOrFallback(value.panelOneDescription, fallback.panelOneDescription),
    panelTwoTitle: textOrFallback(value.panelTwoTitle, fallback.panelTwoTitle),
    panelTwoDescription: textOrFallback(value.panelTwoDescription, fallback.panelTwoDescription),
    panelThreeTitle: textOrFallback(value.panelThreeTitle, fallback.panelThreeTitle),
    panelThreeDescription: textOrFallback(value.panelThreeDescription, fallback.panelThreeDescription)
  };
}

function createFallbackPageContent(id: string): PageContent {
  const title = id.replace(/-/g, ' ');
  return {
    eyebrow: id,
    title,
    description: '',
    signal: '',
    statLabels: [],
    emptyTitle: '暂无内容',
    emptyDescription: '在后台补充内容后，这里会自动更新。',
    primaryActionLabel: '',
    primaryActionHref: '',
    secondaryActionLabel: '',
    secondaryActionHref: '',
    searchPlaceholder: '',
    searchEmptyTitle: '',
    searchEmptyDescription: '',
    commentTitle: '',
    detailLines: [],
    panelOneTitle: '',
    panelOneDescription: '',
    panelTwoTitle: '',
    panelTwoDescription: '',
    panelThreeTitle: '',
    panelThreeDescription: ''
  };
}

function validColumnId(value: unknown): string {
  const id = typeof value === 'string' ? value.trim() : '';
  return /^[a-z][a-z0-9-]{1,39}$/.test(id) ? id : '';
}

function safeHref(value: unknown): string {
  const href = typeof value === 'string' ? value.trim() : '';
  return isSafeHrefValue(href) ? href : '';
}

function normalizeExternalUrl(value: unknown): string {
  const url = typeof value === 'string' ? value.trim() : '';
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : '';
}

function normalizePlayableUrl(value: unknown): string {
  const url = typeof value === 'string' ? value.trim() : '';
  return /^https?:\/\/[^\s]+$/i.test(url) || /^\/(?!\/)[a-zA-Z0-9/_:.-]+$/.test(url) ? url : '';
}

function normalizeOptionalAsset(value: unknown): string | undefined {
  const asset = normalizePlayableUrl(value);
  return asset || undefined;
}

function normalizeLocalPath(value: unknown, fallback: string): string {
  const pathValue = typeof value === 'string' ? value.trim() : '';
  return /^\/(?!\/)[a-zA-Z0-9/_:.-]+$/.test(pathValue) ? pathValue : fallback;
}

function readRuntimeEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed && !isPlaceholderEnvValue(trimmed)) {
      return trimmed;
    }
  }
  return '';
}

function isPlaceholderEnvValue(value: string): boolean {
  return /^your[-_]/i.test(value) || /^change-this/i.test(value);
}

function parseGitHubRepo(value: unknown): { owner: string; repo: string } {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return { owner: '', repo: '' };
  }

  const withoutProtocol = raw.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
  const parts = withoutProtocol.split('/').filter(Boolean);
  const [owner = '', repo = ''] = parts.length > 1 ? parts : ['', withoutProtocol];
  return {
    owner: normalizeGitHubName(owner),
    repo: normalizeGitHubName(repo || withoutProtocol)
  };
}

function normalizeGitHubName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim() : '';
  return /^[\w.-]{1,100}$/.test(name) ? name : '';
}

function normalizeGitHubLabel(value: unknown): string {
  const label = typeof value === 'string' ? value.trim() : '';
  return /^[\w .:-]{1,50}$/.test(label) ? label : 'comment';
}

function normalizeGitHubAdminList(value: unknown, fallback: string, envValue = ''): string[] {
  const source = envValue
    ? envValue.split(/[,\s]+/)
    : Array.isArray(value)
      ? value
      : [fallback];
  const admins = source
    .map((item) => normalizeGitHubName(item))
    .filter(Boolean);

  const normalized = [...new Set(admins)].slice(0, 20);
  return normalized.length > 0 ? normalized : [fallback].map((item) => normalizeGitHubName(item)).filter(Boolean);
}

function normalizeCommentMapping(value: unknown): string {
  const mapping = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ['pathname', 'url', 'title', 'og:title'].includes(mapping) ? mapping : 'pathname';
}

function normalizeCommentTheme(value: unknown): string {
  const theme = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ['auto', 'light', 'dark'].includes(theme) ? theme : 'auto';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function normalizeFriendLinkApplication(value: unknown): FriendLinkApplicationConfig {
  const source = isRecord(value) ? value : {};
  const fallback = fallbackSite.friendLinkApply;
  return {
    title: textOrFallback(source.title, fallback.title),
    description: textOrFallback(source.description, fallback.description),
    copyLabel: textOrFallback(source.copyLabel, fallback.copyLabel),
    copiedLabel: textOrFallback(source.copiedLabel, fallback.copiedLabel),
    copyErrorLabel: textOrFallback(source.copyErrorLabel, fallback.copyErrorLabel),
    commentLabel: textOrFallback(source.commentLabel, fallback.commentLabel)
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
  const envIds = readRuntimeEnv('NEXT_PUBLIC_CLOUD_MUSIC_IDS', 'CLOUD_MUSIC_IDS');
  const source = envIds ? envIds.split(',') : Array.isArray(value) ? value : fallbackSite.cloudMusicIds;
  return source
    .map((item) => String(item).trim())
    .filter((item) => /^\d{1,20}$/.test(item))
    .slice(0, 20);
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
  return isSafeHrefValue(href) ? href : '';
}

function isSafeHrefValue(value: string): boolean {
  return /^https?:\/\/[^\s\\]+$/i.test(value) || isLocalHref(value) || isHashHref(value);
}

function isLocalHref(value: string): boolean {
  const href = value.trim();
  if (!href.startsWith('/') || href.startsWith('//') || /[\s\\]/.test(href)) {
    return false;
  }

  try {
    const url = new URL(href, 'https://local.invalid');
    return url.origin === 'https://local.invalid' && url.pathname.startsWith('/');
  } catch {
    return false;
  }
}

function isHashHref(value: string): boolean {
  return /^#[A-Za-z0-9%._~!$&'()*+,;=:@/?-]*$/.test(value);
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
