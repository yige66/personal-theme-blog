import type { AdminSection, FieldConfig, PathFieldConfig } from '@/components/admin/adminTypes';

const postStatusOptions = [
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' }
];

const linkStatusOptions = [
  { label: '已互链', value: 'active' },
  { label: '申请中', value: 'pending' },
  { label: '暂停展示', value: 'paused' }
];

const columnSectionTargets = [
  { id: 'home', label: '首页栏目', frontendLabel: '首页', href: '/', dataPath: 'site.columns[home] / site.pages.home' },
  { id: 'projects', label: '项目栏目', frontendLabel: '项目页', href: '/projects', dataPath: 'site.columns[projects] / site.pages.projects' },
  { id: 'archive', label: '文章栏目', frontendLabel: '归档页', href: '/archive', dataPath: 'site.columns[archive] / site.pages.archive' },
  { id: 'photowall', label: '照片墙栏目', frontendLabel: '照片墙', href: '/photowall', dataPath: 'site.columns[photowall] / site.pages.photowall' },
  { id: 'gallery', label: '画廊栏目', frontendLabel: '画廊页', href: '/gallery', dataPath: 'site.pages.gallery' },
  { id: 'music', label: '音乐栏目', frontendLabel: '音乐页', href: '/music', dataPath: 'site.columns[music] / site.pages.music' },
  { id: 'moments', label: '动态栏目', frontendLabel: '动态页', href: '/moments', dataPath: 'site.columns[moments] / site.pages.moments' },
  { id: 'chatter', label: '杂谈栏目', frontendLabel: '杂谈页', href: '/chatter', dataPath: 'site.columns[chatter] / site.pages.chatter' },
  { id: 'tags', label: '标签栏目', frontendLabel: '标签页', href: '/tags', dataPath: 'site.columns[tags] / site.pages.tags / site.pages[tag-detail]' },
  { id: 'friends', label: '友链栏目', frontendLabel: '友链页', href: '/friends', dataPath: 'site.columns[friends] / site.pages.friends' },
  { id: 'about', label: '关于栏目', frontendLabel: '关于页', href: '/about', dataPath: 'site.columns[about] / site.pages.about / site.aboutHeroImage' }
] as const;

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: 'site-profile',
    label: '站点资料',
    hint: '标题、简介、作者、联系方式',
    frontend: {
      label: '首页与关于页',
      routes: [
        { label: '首页', href: '/' },
        { label: '关于', href: '/about' }
      ],
      dataPath: 'site.title / owner / bio / contact',
      impact: '同步站点品牌、作者资料、SEO 基础信息和个人介绍。'
    }
  },
  {
    id: 'site-visuals',
    label: '图片与视觉',
    hint: '头像、封面图、颜色',
    frontend: {
      label: '全站视觉',
      routes: [
        { label: '首页', href: '/' },
        { label: '关于', href: '/about' }
      ],
      dataPath: 'site.themeColor / heroImage / aboutHeroImage / avatar / cloudMusicIds',
      impact: '同步主题色、头像、首页头图和主要视觉素材。背景轮播在“背景图”分区单独控制。'
    }
  },
  {
    id: 'site-backgrounds',
    label: '背景图',
    hint: '全站背景轮播单独控制',
    frontend: {
      label: '全站背景层',
      routes: [
        { label: '首页', href: '/' },
        { label: '后台', href: '/admin' }
      ],
      dataPath: 'site.backgroundImages',
      impact: '单独控制所有前台页面背后的背景轮播图片，不和头像、封面图混在一起。'
    }
  },
  {
    id: 'site-entry',
    label: '入口文案',
    hint: '启动页、按钮、热点、提示语',
    frontend: {
      label: '首页入口层',
      routes: [
        { label: '首页', href: '/' }
      ],
      dataPath: 'site.entry',
      impact: '同步启动页、入口按钮、热点标记、状态行和欢迎对话。'
    }
  },
  {
    id: 'site-columns',
    label: '栏目导航',
    hint: '栏目总览、排序、批量管理',
    frontend: {
      label: '导航与首页模块',
      routes: [
        { label: '首页', href: '/' },
        { label: '文章', href: '/archive' }
      ],
      dataPath: 'site.columns',
      impact: '同步顶部导航、首页入口、工具箱入口和栏目显隐。'
    }
  },
  ...columnSectionTargets.map((target) => ({
    id: `column-${target.id}` as AdminSection['id'],
    label: target.label,
    hint: `${target.frontendLabel} 独立控制`,
    frontend: {
      label: target.frontendLabel,
      routes: [
        { label: target.frontendLabel, href: target.href }
      ],
      dataPath: target.dataPath,
      impact: `单独控制${target.frontendLabel}的栏目入口、导航显隐、页面头部文案、按钮和空状态。`
    }
  })),
  {
    id: 'posts',
    label: '文章',
    hint: '标题、正文、标签、封面',
    frontend: {
      label: '归档与文章详情',
      routes: [
        { label: '归档', href: '/archive' },
        { label: '标签', href: '/tags' }
      ],
      dataPath: 'posts[]',
      impact: '同步文章列表、文章详情页、标签云、首页精选和阅读路径。'
    }
  },
  {
    id: 'projects',
    label: '项目',
    hint: '展示顺序、GitHub 同步',
    frontend: {
      label: '项目页',
      routes: [
        { label: '项目', href: '/projects' }
      ],
      dataPath: 'site.projectOrder / site.github / GitHub repositories / site.pages.projects',
      impact: '项目卡片从 GitHub 公开仓库自动生成，后台维护 GitHub 地址、项目页文案和前台展示顺序。'
    }
  },
  {
    id: 'notes',
    label: '动态',
    hint: '说说、心情、配图',
    frontend: {
      label: '动态页',
      routes: [
        { label: '动态', href: '/moments' },
        { label: '关于动态', href: '/about?tab=activity' }
      ],
      dataPath: 'notes[]',
      impact: '同步轻量动态流、心情标签、配图和关于页活动时间线。'
    }
  },
  {
    id: 'chatters',
    label: '杂谈',
    hint: '短文、摘要、封面',
    frontend: {
      label: '杂谈页与详情',
      routes: [
        { label: '杂谈', href: '/chatter' },
        { label: '关于动态', href: '/about?tab=activity' }
      ],
      dataPath: 'chatters[]',
      impact: '同步杂谈瀑布流、杂谈详情页、封面和关于页活动时间线。'
    }
  },
  {
    id: 'gallery',
    label: '照片墙',
    hint: '相册、主图、子图',
    frontend: {
      label: '照片墙与画廊',
      routes: [
        { label: '照片墙', href: '/photowall' },
        { label: '画廊', href: '/gallery' }
      ],
      dataPath: 'site.gallery[]',
      impact: '同步相册主图、子图、地点、图集标签和两套视觉展示入口。'
    }
  },
  {
    id: 'music',
    label: '音乐',
    hint: '歌单、封面、歌词',
    frontend: {
      label: '音乐页',
      routes: [
        { label: '音乐', href: '/music' }
      ],
      dataPath: 'site.music[] / site.cloudMusicIds',
      impact: '同步音乐电台、曲目封面、歌词、可播放音频和云音乐补充字段。'
    }
  },
  {
    id: 'links',
    label: '友链',
    hint: '朋友站点、头像、描述',
    frontend: {
      label: '友链页',
      routes: [
        { label: '友链', href: '/friends' }
      ],
      dataPath: 'links[] / site.friendLinkApplyFormat',
      impact: '同步朋友站点卡片、头像、主题色和友链申请展示信息。'
    }
  },
  {
    id: 'ai-settings',
    label: 'DeepSeek 红莉栖',
    hint: 'API 密钥、模型选择',
    frontend: {
      label: '全站助手',
      routes: [
        { label: '首页', href: '/' }
      ],
      dataPath: 'data/ai-config.json / api/admin/ai',
      impact: '同步右下角助手的服务端模型与密钥来源，不写入公开博客数据。'
    }
  },
  {
    id: 'comments-effects',
    label: '评论与特效',
    hint: '评论、弹幕、场景开关',
    frontend: {
      label: '评论页与全站特效',
      routes: [
        { label: '音乐评论', href: '/music' },
        { label: '友链评论', href: '/friends' },
        { label: '动态', href: '/moments' }
      ],
      dataPath: 'site.comments / site.effects',
      impact: '同步评论配置、全站弹幕、场景特效和交互氛围开关。'
    }
  }
];

export const siteProfileFields: PathFieldConfig[] = [
  { path: ['site', 'title'], key: 'title', label: '站点标题', help: '显示在导航、浏览器标题和站点首页。' },
  { path: ['site', 'brandSuffix'], key: 'brandSuffix', label: '导航标题后缀', help: '显示在顶部标题后面，例如：の 宝藏之地；不想显示可以留空。', advanced: true },
  { path: ['site', 'subtitle'], key: 'subtitle', label: '站点副标题', kind: 'textarea', rows: 2, help: '用一句自然的话介绍这个博客。' },
  { path: ['site', 'owner'], key: 'owner', label: '作者' },
  { path: ['site', 'role'], key: 'role', label: '身份介绍' },
  { path: ['site', 'motto'], key: 'motto', label: '一句话签名' },
  { path: ['site', 'bio'], key: 'bio', label: '个人简介', kind: 'textarea', rows: 4 },
  { path: ['site', 'status'], key: 'status', label: '当前状态', kind: 'textarea', rows: 3 },
  { path: ['site', 'location'], key: 'location', label: '所在地' },
  { path: ['site', 'email'], key: 'email', label: '邮箱' },
  { path: ['site', 'github'], key: 'github', label: 'GitHub 地址' },
  { path: ['site', 'level'], key: 'level', label: '等级', kind: 'number', advanced: true },
  { path: ['site', 'experience'], key: 'experience', label: '经验值', kind: 'number', advanced: true },
  { path: ['site', 'streak'], key: 'streak', label: '连续更新天数', kind: 'number', advanced: true },
  { path: ['site', 'assistantName'], key: 'assistantName', label: '助手名称', advanced: true },
  { path: ['site', 'assistantPrompt'], key: 'assistantPrompt', label: '助手提示语', kind: 'textarea', rows: 3, advanced: true },
  { path: ['site', 'friendLinkApplyFormat'], key: 'friendLinkApplyFormat', label: '友链申请信息', kind: 'textarea', rows: 5, advanced: true }
];

export const visualFields: PathFieldConfig[] = [
  { path: ['site', 'themeColor'], key: 'themeColor', label: '主题色', advanced: true },
  { path: ['site', 'accentColor'], key: 'accentColor', label: '强调色', advanced: true },
  { path: ['site', 'heroImage'], key: 'heroImage', label: '首页封面图', kind: 'image', cropAspect: 16 / 9, help: '选择一张最能代表博客气质的图片，上传时会按首页封面比例裁剪。' },
  { path: ['site', 'aboutHeroImage'], key: 'aboutHeroImage', label: '关于页头图', kind: 'image', cropAspect: 16 / 9, help: '只影响关于页顶部大图；留空时会自动使用首页封面图。' },
  { path: ['site', 'avatar'], key: 'avatar', label: '头像', kind: 'image', cropAspect: 1, help: '显示在个人资料、友链申请和一些卡片里，上传时会按正方形裁剪。' },
  { path: ['site', 'cloudMusicIds'], key: 'cloudMusicIds', label: '网易云音乐编号', kind: 'list', advanced: true }
];

export const backgroundFields: PathFieldConfig[] = [
  { path: ['site', 'backgroundImages'], key: 'backgroundImages', label: '全站背景图', kind: 'image-list', cropAspect: 16 / 9, help: '单独控制前台背景轮播图。可以上传多张，前台会自动去重并按背景比例裁剪。' }
];

export const entryRootFields: PathFieldConfig[] = [
  { path: ['site', 'entry', 'ariaLabel'], key: 'ariaLabel', label: '入口名称', advanced: true },
  { path: ['site', 'entry', 'preloaderTitle'], key: 'preloaderTitle', label: '加载标题' },
  { path: ['site', 'entry', 'preloaderSubtitle'], key: 'preloaderSubtitle', label: '加载副标题' },
  { path: ['site', 'entry', 'signaturePrefix'], key: 'signaturePrefix', label: '署名前缀', advanced: true },
  { path: ['site', 'entry', 'signatureName'], key: 'signatureName', label: '署名名称', advanced: true },
  { path: ['site', 'entry', 'signatureSuffix'], key: 'signatureSuffix', label: '署名后缀', advanced: true },
  { path: ['site', 'entry', 'enterButton'], key: 'enterButton', label: '进入按钮' },
  { path: ['site', 'entry', 'switchToBeyondButton'], key: 'switchToBeyondButton', label: '切换按钮', advanced: true },
  { path: ['site', 'entry', 'switchToInternalButton'], key: 'switchToInternalButton', label: '返回按钮', advanced: true },
  { path: ['site', 'entry', 'skipButton'], key: 'skipButton', label: '跳过按钮' },
  { path: ['site', 'entry', 'consoleTitle'], key: 'consoleTitle', label: '日志标题', advanced: true },
  { path: ['site', 'entry', 'statusLines'], key: 'statusLines', label: '状态行', kind: 'list', advanced: true },
  { path: ['site', 'entry', 'bootLines'], key: 'bootLines', label: '启动日志', kind: 'list', advanced: true }
];

export const postFields: FieldConfig[] = [
  { key: 'title', label: '标题', help: '读者会先看到这里，尽量清楚直接。' },
  { key: 'summary', label: '摘要', kind: 'textarea', rows: 3, help: '用两三句话说明这篇文章讲什么。' },
  { key: 'content', label: '正文', kind: 'prose', rows: 14, help: '直接写正文，不需要 Markdown 或代码格式。' },
  { key: 'tags', label: '标签', kind: 'list', help: '一行一个标签，例如：学习方法。' },
  { key: 'category', label: '分类', advanced: true },
  { key: 'cover', label: '封面图', kind: 'image', cropAspect: 16 / 9, help: '可以上传本地图片，保存后会自动用于文章卡片，上传时会按封面比例裁剪。' },
  { key: 'status', label: '状态', kind: 'select', options: postStatusOptions },
  { key: 'createdAt', label: '发布时间', kind: 'datetime' },
  { key: 'featured', label: '精选', kind: 'boolean', advanced: true },
  { key: 'updatedAt', label: '更新时间', kind: 'datetime', advanced: true },
  { key: 'id', label: '内部编号', advanced: true },
  { key: 'slug', label: '页面地址', advanced: true, help: '这个设置一般不用改，系统已自动生成。' }
];

export const projectFields: FieldConfig[] = [
  { key: 'title', label: '项目名称', help: '项目卡片上最醒目的名称。' },
  { key: 'description', label: '项目说明', kind: 'textarea', rows: 4, help: '用普通话说明项目做了什么、解决什么问题。' },
  { key: 'url', label: '访问地址' },
  { key: 'repo', label: '仓库地址' },
  { key: 'cover', label: '项目截图', kind: 'image', cropAspect: 16 / 9 },
  { key: 'tags', label: '标签', kind: 'list' },
  { key: 'status', label: '状态' },
  { key: 'featured', label: '精选', kind: 'boolean', advanced: true },
  { key: 'startedAt', label: '开始日期', kind: 'date', advanced: true },
  { key: 'id', label: '内部编号', advanced: true }
];

export const noteFields: FieldConfig[] = [
  { key: 'title', label: '标题' },
  { key: 'content', label: '内容', kind: 'prose', rows: 6, help: '像发一条动态一样直接写。' },
  { key: 'date', label: '日期', kind: 'date' },
  { key: 'mood', label: '心情' },
  { key: 'tags', label: '标签', kind: 'list' },
  { key: 'images', label: '配图', kind: 'image-list', cropAspect: 4 / 3, help: '可以上传一张或多张本地图片，上传时会按配图比例裁剪。' },
  { key: 'id', label: '内部编号', advanced: true }
];

export const chatterFields: FieldConfig[] = [
  { key: 'title', label: '标题' },
  { key: 'summary', label: '摘要', kind: 'textarea', rows: 3 },
  { key: 'content', label: '正文', kind: 'prose', rows: 11 },
  { key: 'date', label: '日期', kind: 'date' },
  { key: 'tags', label: '标签', kind: 'list' },
  { key: 'mood', label: '心情' },
  { key: 'cover', label: '封面图', kind: 'image', cropAspect: 16 / 9 },
  { key: 'featured', label: '精选', kind: 'boolean', advanced: true },
  { key: 'id', label: '内部编号', advanced: true },
  { key: 'slug', label: '页面地址', advanced: true, help: '这个设置一般不用改，系统已自动生成。' }
];

export const galleryFields: FieldConfig[] = [
  { key: 'title', label: '标题' },
  { key: 'description', label: '说明', kind: 'textarea', rows: 4 },
  { key: 'image', label: '主图', kind: 'image', cropAspect: 4 / 3 },
  { key: 'alt', label: '图片说明' },
  { key: 'collection', label: '图集' },
  { key: 'location', label: '地点' },
  { key: 'date', label: '日期', kind: 'date' },
  { key: 'featured', label: '精选', kind: 'boolean', advanced: true },
  { key: 'tags', label: '标签', kind: 'list' },
  { key: 'items', label: '子图', kind: 'image-items', cropAspect: 4 / 3 }
];

export const musicFields: FieldConfig[] = [
  { key: 'title', label: '歌名' },
  { key: 'artist', label: '歌手' },
  { key: 'mood', label: '场景' },
  { key: 'url', label: '音频地址', kind: 'audio', placeholder: '/assets/audio/your-song.mp3', help: '填写你指定音乐的 https 直链，或上传本地音频后自动回填。' },
  { key: 'cover', label: '封面图', kind: 'image', cropAspect: 1 },
  { key: 'note', label: '备注', kind: 'textarea', rows: 3 },
  { key: 'source', label: '来源', advanced: true },
  { key: 'provider', label: '提供方', advanced: true },
  { key: 'duration', label: '时长秒数', kind: 'number', advanced: true },
  { key: 'lrc', label: 'LRC 歌词', kind: 'textarea', rows: 6, advanced: true },
  { key: 'lyric', label: '纯文本歌词', kind: 'textarea', rows: 5, advanced: true },
  { key: 'lyrics', label: '歌词时间轴', kind: 'list', advanced: true },
  { key: 'id', label: '内部编号', advanced: true }
];

export const linkFields: FieldConfig[] = [
  { key: 'title', label: '名称' },
  { key: 'url', label: '链接' },
  { key: 'category', label: '分类', placeholder: '个人站 / 技术博客 / 项目入口' },
  { key: 'owner', label: '站长或署名', placeholder: '对方公开署名，可留空' },
  { key: 'status', label: '状态', kind: 'select', options: linkStatusOptions },
  { key: 'description', label: '简介', kind: 'textarea', rows: 3 },
  { key: 'avatar', label: '头像', kind: 'image', cropAspect: 1 },
  { key: 'reciprocal', label: '对方已回链', kind: 'boolean' },
  { key: 'addedAt', label: '收录日期', kind: 'date', advanced: true },
  { key: 'note', label: '维护备注', kind: 'textarea', rows: 3, advanced: true },
  { key: 'themeColor', label: '主题色', advanced: true }
];

export const columnFields: FieldConfig[] = [
  { key: 'label', label: '导航名' },
  { key: 'title', label: '页面标题' },
  { key: 'intro', label: '简介', kind: 'textarea', rows: 3 },
  { key: 'visible', label: '启用', kind: 'boolean' },
  { key: 'navVisible', label: '导航显示', kind: 'boolean' },
  { key: 'homeVisible', label: '首页显示', kind: 'boolean' },
  { key: 'toolboxVisible', label: '工具箱显示', kind: 'boolean' },
  { key: 'id', label: '内部编号', advanced: true },
  { key: 'href', label: '页面路径', advanced: true },
  { key: 'coordinate', label: '坐标', advanced: true },
  { key: 'tone', label: '氛围', advanced: true },
  { key: 'room', label: '房间', advanced: true }
];

export function createColumnFields(index: number): PathFieldConfig[] {
  return columnFields.map((field) => ({
    ...field,
    path: ['site', 'columns', index, field.key]
  }));
}

export function createPageContentFields(pageId: string): PathFieldConfig[] {
  return [
    { path: ['site', 'pages', pageId, 'eyebrow'], key: 'eyebrow', label: '栏目眉标' },
    { path: ['site', 'pages', pageId, 'title'], key: 'title', label: '页面标题' },
    { path: ['site', 'pages', pageId, 'description'], key: 'description', label: '页面说明', kind: 'textarea', rows: 3, help: '支持 {postCount}、{tag}、{owner} 等页面变量。' },
    { path: ['site', 'pages', pageId, 'signal'], key: 'signal', label: '信号文案', advanced: true },
    { path: ['site', 'pages', pageId, 'statLabels'], key: 'statLabels', label: '统计标签', kind: 'list', help: '按顺序控制栏目头部的统计项名称。', advanced: true },
    { path: ['site', 'pages', pageId, 'primaryActionLabel'], key: 'primaryActionLabel', label: '主按钮文字' },
    { path: ['site', 'pages', pageId, 'primaryActionHref'], key: 'primaryActionHref', label: '主按钮链接' },
    { path: ['site', 'pages', pageId, 'secondaryActionLabel'], key: 'secondaryActionLabel', label: '副按钮文字' },
    { path: ['site', 'pages', pageId, 'secondaryActionHref'], key: 'secondaryActionHref', label: '副按钮链接' },
    { path: ['site', 'pages', pageId, 'emptyTitle'], key: 'emptyTitle', label: '空状态标题', advanced: true },
    { path: ['site', 'pages', pageId, 'emptyDescription'], key: 'emptyDescription', label: '空状态说明', kind: 'textarea', rows: 2, advanced: true },
    { path: ['site', 'pages', pageId, 'searchPlaceholder'], key: 'searchPlaceholder', label: '搜索占位文案', advanced: true },
    { path: ['site', 'pages', pageId, 'searchEmptyTitle'], key: 'searchEmptyTitle', label: '搜索无结果标题', advanced: true },
    { path: ['site', 'pages', pageId, 'searchEmptyDescription'], key: 'searchEmptyDescription', label: '搜索无结果说明', kind: 'textarea', rows: 2, advanced: true },
    { path: ['site', 'pages', pageId, 'commentTitle'], key: 'commentTitle', label: '评论标题', advanced: true },
    { path: ['site', 'pages', pageId, 'detailLines'], key: 'detailLines', label: '说明步骤', kind: 'list', advanced: true },
    { path: ['site', 'pages', pageId, 'panelOneTitle'], key: 'panelOneTitle', label: '区块一标题', advanced: true },
    { path: ['site', 'pages', pageId, 'panelOneDescription'], key: 'panelOneDescription', label: '区块一说明', kind: 'textarea', rows: 2, advanced: true },
    { path: ['site', 'pages', pageId, 'panelTwoTitle'], key: 'panelTwoTitle', label: '区块二标题', advanced: true },
    { path: ['site', 'pages', pageId, 'panelTwoDescription'], key: 'panelTwoDescription', label: '区块二说明', kind: 'textarea', rows: 2, advanced: true },
    { path: ['site', 'pages', pageId, 'panelThreeTitle'], key: 'panelThreeTitle', label: '区块三标题', advanced: true },
    { path: ['site', 'pages', pageId, 'panelThreeDescription'], key: 'panelThreeDescription', label: '区块三说明', kind: 'textarea', rows: 2, advanced: true }
  ];
}
