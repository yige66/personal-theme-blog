import type { AdminSection, FieldConfig, PathFieldConfig } from '@/components/admin/adminTypes';

const postStatusOptions = [
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' }
];

export const ADMIN_SECTIONS: AdminSection[] = [
  { id: 'site-profile', label: '站点资料', hint: '标题、简介、作者、联系方式' },
  { id: 'site-visuals', label: '图片与视觉', hint: '头像、封面图、背景图、颜色' },
  { id: 'site-entry', label: '入口文案', hint: '启动页、按钮、热点、提示语' },
  { id: 'site-columns', label: '栏目导航', hint: '路由、ID、显示开关' },
  { id: 'posts', label: '文章', hint: '标题、正文、标签、封面' },
  { id: 'projects', label: '项目', hint: '项目卡片、仓库、截图' },
  { id: 'notes', label: '动态', hint: '说说、心情、配图' },
  { id: 'chatters', label: '杂谈', hint: '短文、摘要、封面' },
  { id: 'gallery', label: '照片墙', hint: '相册、主图、子图' },
  { id: 'music', label: '音乐', hint: '歌单、封面、歌词' },
  { id: 'links', label: '友链', hint: '朋友站点、头像、描述' },
  { id: 'comments-effects', label: '评论与特效', hint: '评论、弹幕、场景开关' }
];

export const siteProfileFields: PathFieldConfig[] = [
  { path: ['site', 'title'], key: 'title', label: '站点标题', help: '显示在导航、浏览器标题和站点首页。' },
  { path: ['site', 'brandSuffix'], key: 'brandSuffix', label: '导航标题后缀', help: '显示在顶部标题后面，例如：の 宝藏之地；不想显示可以留空。' },
  { path: ['site', 'subtitle'], key: 'subtitle', label: '站点副标题', kind: 'textarea', rows: 2, help: '用一句自然的话介绍这个博客。' },
  { path: ['site', 'owner'], key: 'owner', label: '作者' },
  { path: ['site', 'role'], key: 'role', label: '身份介绍' },
  { path: ['site', 'motto'], key: 'motto', label: '一句话签名' },
  { path: ['site', 'bio'], key: 'bio', label: '个人简介', kind: 'textarea', rows: 4 },
  { path: ['site', 'status'], key: 'status', label: '当前状态', kind: 'textarea', rows: 3 },
  { path: ['site', 'location'], key: 'location', label: '所在地' },
  { path: ['site', 'email'], key: 'email', label: '邮箱' },
  { path: ['site', 'github'], key: 'github', label: 'GitHub 地址' },
  { path: ['site', 'level'], key: 'level', label: '等级', kind: 'number' },
  { path: ['site', 'experience'], key: 'experience', label: '经验值', kind: 'number' },
  { path: ['site', 'streak'], key: 'streak', label: '连续更新天数', kind: 'number' },
  { path: ['site', 'assistantName'], key: 'assistantName', label: '助手名称' },
  { path: ['site', 'assistantPrompt'], key: 'assistantPrompt', label: '助手提示语', kind: 'textarea', rows: 3 },
  { path: ['site', 'friendLinkApplyFormat'], key: 'friendLinkApplyFormat', label: '友链申请信息', kind: 'textarea', rows: 5 }
];

export const visualFields: PathFieldConfig[] = [
  { path: ['site', 'themeColor'], key: 'themeColor', label: '主题色' },
  { path: ['site', 'accentColor'], key: 'accentColor', label: '强调色' },
  { path: ['site', 'heroImage'], key: 'heroImage', label: '首页封面图', kind: 'image', cropAspect: 16 / 9, help: '选择一张最能代表博客气质的图片，上传时会按首页封面比例裁剪。' },
  { path: ['site', 'avatar'], key: 'avatar', label: '头像', kind: 'image', cropAspect: 1, help: '显示在个人资料、友链申请和一些卡片里，上传时会按正方形裁剪。' },
  { path: ['site', 'backgroundImages'], key: 'backgroundImages', label: '背景图', kind: 'image-list', cropAspect: 16 / 9, help: '可以放多张，前台会轮换或按场景使用，上传时会按宽屏背景比例裁剪。' },
  { path: ['site', 'cloudMusicIds'], key: 'cloudMusicIds', label: '网易云音乐编号', kind: 'list', advanced: true }
];

export const entryRootFields: PathFieldConfig[] = [
  { path: ['site', 'entry', 'ariaLabel'], key: 'ariaLabel', label: '入口名称' },
  { path: ['site', 'entry', 'preloaderTitle'], key: 'preloaderTitle', label: '加载标题' },
  { path: ['site', 'entry', 'preloaderSubtitle'], key: 'preloaderSubtitle', label: '加载副标题' },
  { path: ['site', 'entry', 'signaturePrefix'], key: 'signaturePrefix', label: '署名前缀' },
  { path: ['site', 'entry', 'signatureName'], key: 'signatureName', label: '署名名称' },
  { path: ['site', 'entry', 'signatureSuffix'], key: 'signatureSuffix', label: '署名后缀' },
  { path: ['site', 'entry', 'enterButton'], key: 'enterButton', label: '进入按钮' },
  { path: ['site', 'entry', 'switchToBeyondButton'], key: 'switchToBeyondButton', label: '切换按钮' },
  { path: ['site', 'entry', 'switchToInternalButton'], key: 'switchToInternalButton', label: '返回按钮' },
  { path: ['site', 'entry', 'skipButton'], key: 'skipButton', label: '跳过按钮' },
  { path: ['site', 'entry', 'consoleTitle'], key: 'consoleTitle', label: '日志标题' },
  { path: ['site', 'entry', 'statusLines'], key: 'statusLines', label: '状态行', kind: 'list' },
  { path: ['site', 'entry', 'bootLines'], key: 'bootLines', label: '启动日志', kind: 'list' }
];

export const postFields: FieldConfig[] = [
  { key: 'title', label: '标题', help: '读者会先看到这里，尽量清楚直接。' },
  { key: 'summary', label: '摘要', kind: 'textarea', rows: 3, help: '用两三句话说明这篇文章讲什么。' },
  { key: 'content', label: '正文', kind: 'prose', rows: 14, help: '直接写正文，不需要 Markdown 或代码格式。' },
  { key: 'tags', label: '标签', kind: 'list', help: '一行一个标签，例如：学习方法。' },
  { key: 'category', label: '分类' },
  { key: 'cover', label: '封面图', kind: 'image', cropAspect: 16 / 9, help: '可以上传本地图片，保存后会自动用于文章卡片，上传时会按封面比例裁剪。' },
  { key: 'status', label: '状态', kind: 'select', options: postStatusOptions },
  { key: 'featured', label: '精选', kind: 'boolean' },
  { key: 'createdAt', label: '发布时间', kind: 'datetime' },
  { key: 'updatedAt', label: '更新时间', kind: 'datetime' },
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
  { key: 'featured', label: '精选', kind: 'boolean' },
  { key: 'startedAt', label: '开始日期', kind: 'date' },
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
  { key: 'featured', label: '精选', kind: 'boolean' },
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
  { key: 'featured', label: '精选', kind: 'boolean' },
  { key: 'tags', label: '标签', kind: 'list' },
  { key: 'items', label: '子图', kind: 'image-items', cropAspect: 4 / 3 }
];

export const musicFields: FieldConfig[] = [
  { key: 'title', label: '歌名' },
  { key: 'artist', label: '歌手' },
  { key: 'mood', label: '场景' },
  { key: 'url', label: '音频地址' },
  { key: 'cover', label: '封面图', kind: 'image', cropAspect: 1 },
  { key: 'source', label: '来源' },
  { key: 'provider', label: '提供方' },
  { key: 'duration', label: '时长秒数', kind: 'number' },
  { key: 'note', label: '备注', kind: 'textarea', rows: 3 },
  { key: 'lrc', label: 'LRC 歌词', kind: 'textarea', rows: 6 },
  { key: 'lyric', label: '纯文本歌词', kind: 'textarea', rows: 5 },
  { key: 'lyrics', label: '歌词时间轴', kind: 'list', advanced: true },
  { key: 'id', label: '内部编号', advanced: true }
];

export const linkFields: FieldConfig[] = [
  { key: 'title', label: '名称' },
  { key: 'url', label: '链接' },
  { key: 'description', label: '简介', kind: 'textarea', rows: 3 },
  { key: 'avatar', label: '头像', kind: 'image', cropAspect: 1 },
  { key: 'themeColor', label: '主题色' }
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
  { key: 'tone', label: '氛围' },
  { key: 'room', label: '房间' }
];
