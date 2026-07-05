'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import type { BlogData } from '@/lib/blog';
import { FieldEditor, FieldGrid, PathField } from '@/components/admin/AdminFieldEditors';
import {
  backgroundFields,
  chatterFields,
  createColumnFields,
  createPageContentFields,
  entryRootFields,
  galleryFields,
  linkFields,
  musicFields,
  noteFields,
  postFields,
  siteProfileFields,
  visualFields
} from '@/components/admin/adminConfig';
import type {
  AdminManagementModule,
  AdminManagementOverview,
  BlogAdminConsoleProps,
  FieldConfig,
  JsonRecord,
  PathFieldConfig,
  PathSegment,
  RecordKind,
  UploadImage
} from '@/components/admin/adminTypes';
import {
  asRecordArray,
  cloneData,
  createDraftStats,
  createEmptyItem,
  createEmptyStats,
  formatJson,
  getAtPath,
  parseJsonDraft,
  recordTitle,
  setAtPath,
  stringValue,
  withFreshIdentity
} from '@/components/admin/adminUtils';

type AiModelOption = {
  label: string;
  value: string;
};

type AiAdminConfigView = {
  apiKeySource: 'backend' | 'env' | 'none';
  hasApiKey: boolean;
  model: string;
  modelOptions: AiModelOption[];
  updatedAt: string | null;
};

type AdminToolId =
  | 'overview'
  | 'profile'
  | 'visual'
  | 'background'
  | 'entry'
  | 'security'
  | 'ai'
  | 'page'
  | 'column'
  | 'records'
  | 'support';

type AdminTool = {
  id: AdminToolId;
  label: string;
  hint: string;
};

type AdminWorkspace = {
  id: string;
  label: string;
  group: string;
  route: string;
  pageId: string;
  dataPath: string;
  purpose: string;
  support: string[];
  content?: {
    title: string;
    description: string;
    path: PathSegment[];
    fields: FieldConfig[];
    recordKind: RecordKind;
  };
};

const globalWorkspace: AdminWorkspace = {
  id: 'global',
  label: '全站资料',
  group: '基础管理',
  route: '/',
  pageId: 'home',
  dataPath: 'site',
  purpose: '维护所有前台页面共同使用的站点资料、头像、头图、背景图、启动页、评论和 AI 助手。',
  support: ['站点资料', '视觉素材', '背景图区块', '启动页', '评论设置', 'DeepSeek 设置']
};

const columnWorkspaces: AdminWorkspace[] = [
  {
    id: 'home',
    label: '首页',
    group: '栏目管理',
    route: '/',
    pageId: 'home',
    dataPath: 'site.pages.home / site.columns.home',
    purpose: '控制首页标题、入口按钮、统计标签和首页展示区块。',
    support: ['页面展示', '栏目入口', '全站资料']
  },
  {
    id: 'projects',
    label: '项目',
    group: '栏目管理',
    route: '/projects',
    pageId: 'projects',
    dataPath: 'site.projectOrder / site.github / GitHub repositories / site.pages.projects',
    purpose: '控制前台项目展示顺序，并从 GitHub 公开仓库自动生成项目卡片。',
    support: ['展示顺序', 'GitHub 同步', '项目页文案']
  },
  {
    id: 'archive',
    label: '文章',
    group: '内容管理',
    route: '/archive',
    pageId: 'archive',
    dataPath: 'posts[] / site.pages.archive',
    purpose: '维护文章、草稿、标签和归档页展示。',
    support: ['文章列表', '草稿状态', '标签来源'],
    content: {
      title: '文章列表',
      description: '维护文章标题、摘要、正文、标签、封面和发布状态。',
      path: ['posts'],
      fields: postFields,
      recordKind: 'post'
    }
  },
  {
    id: 'photowall',
    label: '照片墙',
    group: '素材管理',
    route: '/photowall',
    pageId: 'photowall',
    dataPath: 'site.gallery[] / site.pages.photowall',
    purpose: '维护照片墙头部文案、相册入口和照片素材。',
    support: ['相册素材', '精选图片', '图片说明'],
    content: {
      title: '相册素材',
      description: '维护相册主图、子图、说明、地点、图集和精选状态。',
      path: ['site', 'gallery'],
      fields: galleryFields,
      recordKind: 'gallery'
    }
  },
  {
    id: 'gallery',
    label: '画廊',
    group: '素材管理',
    route: '/gallery',
    pageId: 'gallery',
    dataPath: 'site.gallery[] / site.pages.gallery',
    purpose: '画廊与照片墙共用同一套图片素材。',
    support: ['照片墙共用', '图集搜索', '图片说明'],
    content: {
      title: '画廊素材',
      description: '这里维护的图片会同步影响画廊和照片墙。',
      path: ['site', 'gallery'],
      fields: galleryFields,
      recordKind: 'gallery'
    }
  },
  {
    id: 'music',
    label: '音乐',
    group: '互动管理',
    route: '/music',
    pageId: 'music',
    dataPath: 'site.music[] / site.cloudMusicIds',
    purpose: '维护音乐页、电台曲目、歌词、封面和评论区标题。',
    support: ['曲目列表', '云音乐编号', '评论设置'],
    content: {
      title: '音乐曲目',
      description: '维护歌名、歌手、音频地址、封面、歌词、场景和备注。',
      path: ['site', 'music'],
      fields: musicFields,
      recordKind: 'music'
    }
  },
  {
    id: 'moments',
    label: '动态',
    group: '内容管理',
    route: '/moments',
    pageId: 'moments',
    dataPath: 'notes[] / site.pages.moments',
    purpose: '维护说说内容、心情标签、配图和动态评论区。',
    support: ['动态内容', '心情标签', '关于页时间线'],
    content: {
      title: '动态内容',
      description: '像写说说一样维护标题、正文、日期、心情、标签和配图。',
      path: ['notes'],
      fields: noteFields,
      recordKind: 'note'
    }
  },
  {
    id: 'chatter',
    label: '杂谈',
    group: '内容管理',
    route: '/chatter',
    pageId: 'chatter',
    dataPath: 'chatters[] / site.pages.chatter',
    purpose: '维护轻文章瀑布流和杂谈详情页内容。',
    support: ['杂谈列表', '封面图', '关于页时间线'],
    content: {
      title: '杂谈文章',
      description: '维护轻文章标题、摘要、正文、日期、标签、心情和封面。',
      path: ['chatters'],
      fields: chatterFields,
      recordKind: 'chatter'
    }
  },
  {
    id: 'tags',
    label: '标签',
    group: '内容管理',
    route: '/tags',
    pageId: 'tags',
    dataPath: 'posts[].tags / site.pages.tags / site.pages[tag-detail]',
    purpose: '维护标签词库、标签页展示文案和标签详情页文案。',
    support: ['标签词库', '标签页', '标签详情页'],
    content: {
      title: '文章标签来源',
      description: '要新增标签，请在文章内容里给文章添加标签。',
      path: ['posts'],
      fields: postFields,
      recordKind: 'post'
    }
  },
  {
    id: 'friends',
    label: '友链',
    group: '互动管理',
    route: '/friends',
    pageId: 'friends',
    dataPath: 'links[] / site.friendLinkApplyFormat',
    purpose: '维护朋友站点卡片、申请格式和评论标题。',
    support: ['友链卡片', '申请格式', '朋友头像'],
    content: {
      title: '友链卡片',
      description: '维护朋友站点名称、链接、简介、头像和主题色。',
      path: ['links'],
      fields: linkFields,
      recordKind: 'link'
    }
  },
  {
    id: 'about',
    label: '关于',
    group: '基础管理',
    route: '/about',
    pageId: 'about',
    dataPath: 'site.pages.about / site.aboutHeroImage',
    purpose: '维护关于页标题、独立头图、个人介绍、联系信息和活动时间线入口。',
    support: ['个人资料', '关于页头图', '活动时间线']
  }
];

const globalTools: AdminTool[] = [
  { id: 'overview', label: '总览', hint: '查看后台分区、待处理项和保存状态。' },
  { id: 'profile', label: '站点资料', hint: '站名、作者、简介、联系方式。' },
  { id: 'visual', label: '头像头图', hint: '头像、首页封面、关于页头图和主题色。' },
  { id: 'background', label: '背景图', hint: '全站背景轮播单独管理。' },
  { id: 'entry', label: '启动页', hint: '进入网站前看到的欢迎层。' },
  { id: 'security', label: '安全设置', hint: '评论、特效和敏感配置检查。' },
  { id: 'ai', label: 'DeepSeek 设置', hint: '右下角助手模型和密钥。' }
];

const columnTools: AdminTool[] = [
  { id: 'page', label: '页面展示', hint: '标题、说明、按钮、统计和空状态。' },
  { id: 'column', label: '栏目入口', hint: '导航、首页入口、工具箱显隐。' },
  { id: 'records', label: '内容列表', hint: '这个栏目展示的实际内容。' },
  { id: 'support', label: '辅助设置', hint: '评论、资料、头图和相关来源。' }
];

const tagTools: AdminTool[] = columnTools.map((tool) => tool.id === 'records'
  ? { ...tool, label: '标签词库', hint: '改名、删除、分配文章标签。' }
  : tool
);

function getWorkspaceTools(workspace: AdminWorkspace): AdminTool[] {
  if (workspace.id === 'global') {
    return globalTools;
  }

  return workspace.id === 'tags' ? tagTools : columnTools;
}

function createFallbackOverview(data: BlogData | null): AdminManagementOverview {
  return {
    generatedAt: new Date().toISOString(),
    summaries: [
      { id: 'sections', label: '管理分区', value: columnWorkspaces.length + 1, hint: '每个栏目单独维护' },
      { id: 'columns', label: '公开栏目', value: data?.site.columns.length ?? 0, hint: '来自前台导航配置' },
      { id: 'warnings', label: '待处理', value: 0, hint: '读取后台数据后刷新' }
    ],
    modules: [],
    warnings: []
  };
}

export function BlogAdminConsole({ initialData, initialStats, initialOverview }: BlogAdminConsoleProps) {
  const [draft, setDraft] = useState<BlogData | null>(() => initialData ? cloneData(initialData) : null);
  const [serverStats, setServerStats] = useState(initialStats);
  const [overview, setOverview] = useState<AdminManagementOverview | null>(initialOverview ?? null);
  const [activeWorkspace, setActiveWorkspace] = useState('global');
  const [activeTool, setActiveTool] = useState<AdminToolId>('overview');
  const [saveState, setSaveState] = useState({ status: 'idle', message: '修改会先留在当前页面草稿中，点击保存后才会写入数据文件。' });
  const [adminToken, setAdminToken] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [aiConfig, setAiConfig] = useState<AiAdminConfigView | null>(null);
  const [aiModel, setAiModel] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [clearAiApiKey, setClearAiApiKey] = useState(false);
  const [aiConfigState, setAiConfigState] = useState({ status: 'idle', message: 'DeepSeek 配置只保存在服务端后台，不写入公开博客数据。' });

  const stats = useMemo(
    () => draft ? createDraftStats(draft, serverStats ?? createEmptyStats()) : createEmptyStats(),
    [draft, serverStats]
  );
  const workspaces = useMemo(() => [globalWorkspace, ...columnWorkspaces], []);
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspace) ?? globalWorkspace;
  const tools = getWorkspaceTools(selectedWorkspace);
  const selectedTool = tools.find((tool) => tool.id === activeTool) ?? tools[0];
  const activeOverview = overview ?? createFallbackOverview(draft);
  const activeModule = activeOverview.modules.find((module) => module.id === selectedWorkspace.id);

  const replaceDraft = (next: BlogData, nextOverview?: AdminManagementOverview | null) => {
    setDraft(next);
    if (nextOverview) {
      setOverview(nextOverview);
    }
    setSaveState({ status: 'idle', message: '内容已更新，请确认无误后保存。' });
  };

  const setValueAtPath = (path: PathSegment[], value: unknown) => {
    setDraft((current) => current ? setAtPath(current, path, value) : current);
    setSaveState({ status: 'idle', message: '内容已更新，请确认无误后保存。' });
  };

  const selectWorkspace = (workspace: AdminWorkspace) => {
    setActiveWorkspace(workspace.id);
    setActiveTool(getWorkspaceTools(workspace)[0].id);
  };

  const replaceAiConfig = (nextConfig: AiAdminConfigView) => {
    setAiConfig(nextConfig);
    setAiModel(nextConfig.model);
    setAiApiKey('');
    setClearAiApiKey(false);
  };

  const handleExport = () => {
    if (!draft) {
      setSaveState({ status: 'error', message: '没有可以导出的博客数据。' });
      return;
    }

    const blob = new Blob([formatJson(draft)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personal-blog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const parsed = parseJsonDraft(await file.text());
    if (!parsed.ok) {
      setSaveState({ status: 'error', message: parsed.error });
      return;
    }

    replaceDraft(parsed.data);
  };

  const handleLoadData = async () => {
    setSaveState({ status: 'saving', message: '正在读取后台数据。' });
    try {
      const response = await fetch('/api/admin/blog', {
        headers: adminToken ? { 'x-admin-token': adminToken } : {}
      });
      const payload = await response.json() as { error?: string; data?: BlogData; stats?: typeof initialStats; management?: AdminManagementOverview };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || '读取后台数据失败。');
      }

      setServerStats(payload.stats ?? null);
      replaceDraft(payload.data, payload.management ?? null);
      setSaveState({ status: 'success', message: '后台数据已重新读取。' });
    } catch (error) {
      setSaveState({ status: 'error', message: error instanceof Error ? error.message : '读取后台数据失败。' });
    }
  };

  const handleSave = async () => {
    if (!draft) {
      setSaveState({ status: 'error', message: '请先读取或导入博客数据。' });
      return;
    }

    setSaveState({ status: 'saving', message: '正在校验并保存。' });
    try {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'x-admin-token': adminToken } : {})
        },
        body: JSON.stringify({ data: draft })
      });
      const payload = await response.json() as { error?: string; details?: string[]; savedAt?: string; data?: BlogData; stats?: typeof initialStats; management?: AdminManagementOverview };

      if (!response.ok) {
        throw new Error(payload.details?.join('\n') || payload.error || '保存失败。');
      }

      const nextData = payload.data ?? draft;
      setDraft(nextData);
      setServerStats(payload.stats ?? serverStats);
      setOverview(payload.management ?? overview);
      setLastSavedAt(payload.savedAt ?? new Date().toISOString());
      setSaveState({ status: 'success', message: '已保存，并生成数据备份。' });
    } catch (error) {
      setSaveState({ status: 'error', message: error instanceof Error ? error.message : '保存失败。' });
    }
  };

  const handleImageUpload: UploadImage = async (file, kind = 'image') => {
    const assetLabel = kind === 'audio' ? '音乐' : '图片';
    setSaveState({ status: 'saving', message: `正在上传${assetLabel}。` });
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/admin/assets?kind=${kind}`, {
      method: 'POST',
      headers: adminToken ? { 'x-admin-token': adminToken } : {},
      body: formData
    });
    const payload = await response.json() as { path?: string; error?: string };

    if (!response.ok || !payload.path) {
      const message = payload.error || `${assetLabel}上传失败。`;
      setSaveState({ status: 'error', message });
      throw new Error(message);
    }

    setSaveState({ status: 'success', message: `${assetLabel}已上传：${payload.path}` });
    return payload.path;
  };

  const handleLoadAiConfig = async () => {
    setAiConfigState({ status: 'saving', message: '正在读取 DeepSeek 配置。' });
    try {
      const response = await fetch('/api/admin/ai', {
        headers: adminToken ? { 'x-admin-token': adminToken } : {}
      });
      const payload = await response.json() as { error?: string; config?: AiAdminConfigView };

      if (!response.ok || !payload.config) {
        throw new Error(payload.error || '读取 DeepSeek 配置失败。');
      }

      replaceAiConfig(payload.config);
      setAiConfigState({ status: 'success', message: 'DeepSeek 配置已读取。' });
    } catch (error) {
      setAiConfigState({ status: 'error', message: error instanceof Error ? error.message : '读取 DeepSeek 配置失败。' });
    }
  };

  const handleSaveAiConfig = async () => {
    const model = aiModel.trim();
    if (!model) {
      setAiConfigState({ status: 'error', message: '请选择或填写一个模型名称。' });
      return;
    }

    setAiConfigState({ status: 'saving', message: '正在保存 DeepSeek 配置。' });
    try {
      const response = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'x-admin-token': adminToken } : {})
        },
        body: JSON.stringify({
          apiKey: aiApiKey,
          clearApiKey: clearAiApiKey,
          model
        })
      });
      const payload = await response.json() as { error?: string; config?: AiAdminConfigView };

      if (!response.ok || !payload.config) {
        throw new Error(payload.error || '保存 DeepSeek 配置失败。');
      }

      replaceAiConfig(payload.config);
      setAiConfigState({ status: 'success', message: 'DeepSeek 配置已保存。' });
    } catch (error) {
      setAiConfigState({ status: 'error', message: error instanceof Error ? error.message : '保存 DeepSeek 配置失败。' });
    }
  };

  return (
    <section className="fraud-admin-shell">
      <AdminHeader
        adminToken={adminToken}
        draft={draft}
        lastSavedAt={lastSavedAt}
        saveStatus={saveState.status}
        onAdminTokenChange={setAdminToken}
        onExport={handleExport}
        onImport={handleImport}
        onLoadData={handleLoadData}
        onSave={handleSave}
      />

      <div className="fraud-admin-layout">
        <AdminSidebar
          activeWorkspace={activeWorkspace}
          modules={activeOverview.modules}
          workspaces={workspaces}
          onSelect={selectWorkspace}
        />

        <main className="fraud-admin-main">
          <AdminStatusRail overview={activeOverview} saveState={saveState} stats={stats} />

          {draft ? (
            <section className="fraud-admin-workbench">
              <WorkspaceHeader module={activeModule} workspace={selectedWorkspace} />
              <ToolTabs activeTool={selectedTool.id} tools={tools} onSelect={setActiveTool} />
              <AdminToolPanel
                activeModule={activeModule}
                aiApiKey={aiApiKey}
                aiConfig={aiConfig}
                aiConfigState={aiConfigState}
                aiModel={aiModel}
                clearAiApiKey={clearAiApiKey}
                data={draft}
                overview={activeOverview}
                tool={selectedTool.id}
                uploadImage={handleImageUpload}
                workspace={selectedWorkspace}
                onAiApiKeyChange={setAiApiKey}
                onAiModelChange={setAiModel}
                onChange={setValueAtPath}
                onClearAiApiKeyChange={setClearAiApiKey}
                onLoadAiConfig={handleLoadAiConfig}
                onSaveAiConfig={handleSaveAiConfig}
                onWorkspaceJump={(id) => {
                  const next = workspaces.find((workspace) => workspace.id === id);
                  if (next) {
                    selectWorkspace(next);
                  }
                }}
              />
            </section>
          ) : (
            <section className="fraud-admin-empty">
              <p className="admin-kicker">无数据</p>
              <h2>先读取或导入博客数据</h2>
              <p>后台会把数据放进本地草稿，确认无误后再写入数据文件。</p>
              <button className="button primary" type="button" onClick={handleLoadData}>读取后台数据</button>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}

function AdminHeader({
  adminToken,
  draft,
  lastSavedAt,
  saveStatus,
  onAdminTokenChange,
  onExport,
  onImport,
  onLoadData,
  onSave
}: {
  adminToken: string;
  draft: BlogData | null;
  lastSavedAt: string | null;
  saveStatus: string;
  onAdminTokenChange: (value: string) => void;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onLoadData: () => void;
  onSave: () => void;
}) {
  return (
    <header className="fraud-admin-header">
      <div>
        <p className="admin-kicker">仅限本人使用</p>
        <h1>站点管理台</h1>
        <p>按栏目分区、按子功能填表。先检查提示，再保存数据。</p>
      </div>

      <div className="fraud-admin-actions">
        <label className="admin-token-field">
          <span>后台密码</span>
          <input
            value={adminToken}
            type="password"
            autoComplete="current-password"
            placeholder="填写 ADMIN_WRITE_TOKEN"
            onChange={(event) => onAdminTokenChange(event.target.value)}
          />
        </label>
        <div className="admin-action-row">
          <button className="button ghost" type="button" onClick={onLoadData}>重新读取</button>
          <button className="button ghost" type="button" disabled={!draft} onClick={onExport}>导出备份</button>
          <label className="button ghost">
            导入备份
            <input accept="application/json" hidden type="file" onChange={onImport} />
          </label>
          <button className="button primary" type="button" disabled={!draft || saveStatus === 'saving'} onClick={onSave}>
            {saveStatus === 'saving' ? '保存中' : '保存数据'}
          </button>
        </div>
        <small>{lastSavedAt ? `上次保存：${new Date(lastSavedAt).toLocaleString('zh-CN')}` : '未执行保存'}</small>
      </div>
    </header>
  );
}

function AdminSidebar({ activeWorkspace, modules, workspaces, onSelect }: {
  activeWorkspace: string;
  modules: AdminManagementModule[];
  workspaces: AdminWorkspace[];
  onSelect: (workspace: AdminWorkspace) => void;
}) {
  const groups = [...new Set(workspaces.map((workspace) => workspace.group))];

  return (
    <aside className="fraud-admin-sidebar" aria-label="后台管理栏目">
      <div className="fraud-admin-sidebar-title">
        <strong>后台菜单</strong>
        <span>一栏一管</span>
      </div>
      {groups.map((group) => (
        <section key={group}>
          <p>{group}</p>
          {workspaces.filter((workspace) => workspace.group === group).map((workspace) => {
            const module = modules.find((item) => item.id === workspace.id);
            return (
              <button
                className={workspace.id === activeWorkspace ? 'is-active' : ''}
                key={workspace.id}
                type="button"
                onClick={() => onSelect(workspace)}
              >
                <span>{workspace.label}</span>
                <small data-risk={module?.riskLevel ?? '正常'}>{module?.riskText ?? workspace.dataPath}</small>
              </button>
            );
          })}
        </section>
      ))}
    </aside>
  );
}

function AdminStatusRail({ overview, saveState, stats }: {
  overview: AdminManagementOverview;
  saveState: { status: string; message: string };
  stats: ReturnType<typeof createEmptyStats>;
}) {
  return (
    <section className="fraud-admin-status">
      <div className="admin-save-status" data-status={saveState.status}>
        <strong>操作提示</strong>
        <span>{saveState.message}</span>
      </div>
      <div className="fraud-admin-summary">
        {overview.summaries.map((item) => (
          <article key={item.id}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.hint}</small>
          </article>
        ))}
        <article>
          <span>字数</span>
          <strong>{stats.words}</strong>
          <small>已发布文章正文长度</small>
        </article>
      </div>
      {overview.warnings.length > 0 ? (
        <div className="fraud-admin-warnings">
          <strong>待处理提示</strong>
          {overview.warnings.map((warning) => <span key={warning}>{warning}</span>)}
        </div>
      ) : null}
    </section>
  );
}

function WorkspaceHeader({ module, workspace }: { module?: AdminManagementModule; workspace: AdminWorkspace }) {
  return (
    <header className="fraud-workspace-head">
      <div>
        <p className="admin-kicker">{workspace.group}</p>
        <h2>{workspace.label}</h2>
        <p>{workspace.purpose}</p>
      </div>
      <div className="fraud-workspace-meta">
        <span data-risk={module?.riskLevel ?? '正常'}>{module?.riskLevel ?? '正常'}</span>
        <strong>{module?.count ?? '-'}</strong>
        <small>{workspace.dataPath}</small>
        <a href={workspace.route} target="_blank" rel="noreferrer">查看前台</a>
      </div>
    </header>
  );
}

function ToolTabs({ activeTool, tools, onSelect }: { activeTool: AdminToolId; tools: AdminTool[]; onSelect: (tool: AdminToolId) => void }) {
  return (
    <div className="fraud-tool-tabs" role="tablist" aria-label="子功能">
      {tools.map((tool) => (
        <button className={tool.id === activeTool ? 'is-active' : ''} key={tool.id} type="button" onClick={() => onSelect(tool.id)}>
          <span>{tool.label}</span>
          <small>{tool.hint}</small>
        </button>
      ))}
    </div>
  );
}

function AdminToolPanel({
  activeModule,
  aiApiKey,
  aiConfig,
  aiConfigState,
  aiModel,
  clearAiApiKey,
  data,
  overview,
  tool,
  uploadImage,
  workspace,
  onAiApiKeyChange,
  onAiModelChange,
  onChange,
  onClearAiApiKeyChange,
  onLoadAiConfig,
  onSaveAiConfig,
  onWorkspaceJump
}: {
  activeModule?: AdminManagementModule;
  aiApiKey: string;
  aiConfig: AiAdminConfigView | null;
  aiConfigState: { status: string; message: string };
  aiModel: string;
  clearAiApiKey: boolean;
  data: BlogData;
  overview: AdminManagementOverview;
  tool: AdminToolId;
  uploadImage: UploadImage;
  workspace: AdminWorkspace;
  onAiApiKeyChange: (value: string) => void;
  onAiModelChange: (value: string) => void;
  onChange: (path: PathSegment[], value: unknown) => void;
  onClearAiApiKeyChange: (value: boolean) => void;
  onLoadAiConfig: () => void;
  onSaveAiConfig: () => void;
  onWorkspaceJump: (id: string) => void;
}) {
  if (workspace.id === 'global') {
    if (tool === 'overview') {
      return <OverviewPanel overview={overview} onWorkspaceJump={onWorkspaceJump} />;
    }
    if (tool === 'profile') {
      return <PathFieldPanel data={data} description="这些信息会出现在首页、关于页、SEO 和部分个人卡片中。" fields={siteProfileFields} title="站点资料" uploadImage={uploadImage} onChange={onChange} />;
    }
    if (tool === 'visual') {
      return <PathFieldPanel data={data} description="头像、首页封面、关于页头图和颜色在这里维护。关于页头图可以和首页封面不同。" fields={visualFields} title="头像与头图" uploadImage={uploadImage} onChange={onChange} />;
    }
    if (tool === 'background') {
      return (
        <PathFieldPanel data={data} description="背景图是独立分区，不和封面、头像、关于页头图混在一起。" fields={backgroundFields} title="背景图区块" uploadImage={uploadImage} onChange={onChange}>
          <AssetPreview data={data} />
        </PathFieldPanel>
      );
    }
    if (tool === 'entry') {
      return <EntryScreenPanel data={data} uploadImage={uploadImage} onChange={onChange} />;
    }
    if (tool === 'security') {
      return <CommentsEffectsPanel data={data} uploadImage={uploadImage} onChange={onChange} />;
    }
    return (
      <AiSettingsPanel
        apiKey={aiApiKey}
        clearApiKey={clearAiApiKey}
        config={aiConfig}
        model={aiModel}
        saveState={aiConfigState}
        onApiKeyChange={onAiApiKeyChange}
        onClearApiKeyChange={onClearAiApiKeyChange}
        onLoad={onLoadAiConfig}
        onModelChange={onAiModelChange}
        onSave={onSaveAiConfig}
      />
    );
  }

  if (tool === 'page') {
    if (workspace.id === 'tags') {
      return <TagPageContentPanel data={data} uploadImage={uploadImage} onChange={onChange} />;
    }

    return <PathFieldPanel data={data} description="这里控制栏目页头部文字、按钮、统计标签、空状态和说明区块。" fields={createPageContentFields(workspace.pageId)} title="页面展示" uploadImage={uploadImage} onChange={onChange} />;
  }

  if (tool === 'column') {
    const columnIndex = data.site.columns.findIndex((column) => column.id === workspace.id);
    if (columnIndex < 0) {
      return <SimpleNotice title="没有找到栏目入口" description="当前栏目没有出现在 site.columns 中，可以先回到全站资料检查栏目配置。" />;
    }
    return <PathFieldPanel data={data} description="这里决定栏目是否出现在顶部导航、首页入口和工具箱里。" fields={createColumnFields(columnIndex)} title="栏目入口" uploadImage={uploadImage} onChange={onChange} />;
  }

  if (tool === 'records') {
    if (workspace.id === 'tags') {
      return <TagLibraryPanel data={data} onChange={onChange} />;
    }

    if (workspace.id === 'projects') {
      return <ProjectGitHubSourcePanel data={data} onChange={onChange} onWorkspaceJump={onWorkspaceJump} />;
    }

    if (!workspace.content) {
      return (
        <PanelFrame title="内容来源" description="这个栏目不维护独立列表，它读取全站资料或其他栏目内容。">
          <div className="fraud-guide-grid">
            <GuideButton title="维护全站资料" description="作者、头像、联系方式等在全站资料中维护。" onClick={() => onWorkspaceJump('global')} />
            <GuideButton title="维护文章" description="活动时间线、标签和首页文章入口来自文章与动态内容。" onClick={() => onWorkspaceJump('archive')} />
          </div>
        </PanelFrame>
      );
    }

    return (
      <RecordListEditor
        data={data}
        description={workspace.content.description}
        fields={workspace.content.fields}
        path={workspace.content.path}
        recordKind={workspace.content.recordKind}
        title={workspace.content.title}
        uploadImage={uploadImage}
        onChange={onChange}
      />
    );
  }

  return <SupportPanel data={data} module={activeModule} uploadImage={uploadImage} workspace={workspace} onChange={onChange} onWorkspaceJump={onWorkspaceJump} />;
}

function OverviewPanel({ overview, onWorkspaceJump }: { overview: AdminManagementOverview; onWorkspaceJump: (id: string) => void }) {
  return (
    <PanelFrame title="后台总览" description="按栏目检查内容是否完整。红色和黄色提示优先处理。">
      <div className="fraud-module-table">
        {overview.modules.map((module) => (
          <button key={module.id} type="button" onClick={() => onWorkspaceJump(module.id === 'security' ? 'global' : module.id)}>
            <span>{module.group}</span>
            <strong>{module.label}</strong>
            <em data-risk={module.riskLevel}>{module.riskLevel}</em>
            <small>{module.riskText}</small>
          </button>
        ))}
      </div>
    </PanelFrame>
  );
}

function SupportPanel({ data, module, uploadImage, workspace, onChange, onWorkspaceJump }: {
  data: BlogData;
  module?: AdminManagementModule;
  uploadImage: UploadImage;
  workspace: AdminWorkspace;
  onChange: (path: PathSegment[], value: unknown) => void;
  onWorkspaceJump: (id: string) => void;
}) {
  const showComments = ['music', 'moments', 'friends'].includes(workspace.id);
  const showProfile = workspace.id === 'about' || workspace.id === 'friends';
  const showVisual = workspace.id === 'home' || workspace.id === 'about';

  return (
    <PanelFrame title="辅助设置" description="这些内容不是正文列表，但会影响这个栏目在前台是否完整。">
      <div className="fraud-checklist">
        {(module?.checklist ?? workspace.support).map((item) => <span key={item}>{item}</span>)}
      </div>

      <div className="fraud-guide-grid">
        <GuideButton title="预览前台页面" description={`打开 ${workspace.label} 页面，确认刚才修改后的效果。`} href={workspace.route} />
        {workspace.support.map((item) => <div className="admin-simple-note" key={item}><strong>{item}</strong><span>与当前栏目相关。</span></div>)}
      </div>

      {showComments ? (
        <section className="admin-soft-section">
          <h4>评论设置</h4>
          <p>这个栏目有评论入口，评论开关、仓库、主题和代理在这里统一配置。</p>
          <CommentsEffectsPanel data={data} uploadImage={uploadImage} onChange={onChange} compact />
        </section>
      ) : null}

      {showProfile ? (
        <section className="admin-soft-section">
          <h4>相关资料</h4>
          <p>友链申请、关于页和联系方式会读取全站资料。</p>
          <button className="button ghost" type="button" onClick={() => onWorkspaceJump('global')}>去全站资料</button>
        </section>
      ) : null}

      {showVisual ? (
        <section className="admin-soft-section">
          <h4>视觉素材</h4>
          <p>头像、首页封面、关于页头图和背景图会影响这个栏目第一眼的视觉效果。</p>
          <FieldGrid>
            {[...visualFields.filter((field) => !field.advanced), ...backgroundFields].map((field) => (
              <PathField data={data} field={field} key={field.path.join('.')} path={field.path} onChange={onChange} uploadImage={uploadImage} />
            ))}
          </FieldGrid>
        </section>
      ) : null}
    </PanelFrame>
  );
}

function TagPageContentPanel({ data, uploadImage, onChange }: {
  data: BlogData;
  uploadImage: UploadImage;
  onChange: (path: PathSegment[], value: unknown) => void;
}) {
  return (
    <PanelFrame title="标签页面展示" description="这里同时维护标签索引页和单个标签详情页的头部文字、按钮、统计标签与空状态。">
      <section className="admin-soft-section">
        <h4>标签索引页</h4>
        <p>控制 /tags 标签星云页面的标题、说明、按钮和统计文字。</p>
        <PathFieldSections
          data={data}
          fields={createPageContentFields('tags')}
          uploadImage={uploadImage}
          onChange={onChange}
        />
      </section>

      <section className="admin-soft-section">
        <h4>标签详情页</h4>
        <p>控制 /tags/某个标签 详情页的标题模板、说明、按钮和统计文字。可使用 {`{tag}`} 与 {`{postCount}`} 变量。</p>
        <PathFieldSections
          advancedLabel="标签详情页更多设置"
          data={data}
          fields={createPageContentFields('tag-detail')}
          uploadImage={uploadImage}
          onChange={onChange}
        />
      </section>
    </PanelFrame>
  );
}

function TagLibraryPanel({ data, onChange }: {
  data: BlogData;
  onChange: (path: PathSegment[], value: unknown) => void;
}) {
  const posts = data.posts;
  const tagUsages = collectTagUsages(posts);
  const [selectedTagName, setSelectedTagName] = useState('');
  const [renameDraft, setRenameDraft] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [selectedPostIndexes, setSelectedPostIndexes] = useState<number[]>([]);
  const selectedTag = tagUsages.find((tag) => tag.name === selectedTagName) ?? tagUsages[0] ?? null;
  const renameValue = renameDraft ?? selectedTag?.name ?? '';
  const selectedPostSet = new Set(selectedPostIndexes);

  const selectTag = (name: string) => {
    setSelectedTagName(name);
    setRenameDraft(name);
  };

  const renameSelectedTag = () => {
    if (!selectedTag) {
      return;
    }

    const nextName = renameValue.trim();
    if (!nextName || nextName === selectedTag.name) {
      return;
    }

    onChange(['posts'], renameTagAcrossPosts(posts, selectedTag.name, nextName));
    setSelectedTagName(nextName);
    setRenameDraft(nextName);
  };

  const removeSelectedTag = () => {
    if (!selectedTag || !window.confirm(`从所有文章移除「${selectedTag.name}」标签？保存前仍可刷新页面放弃本地草稿。`)) {
      return;
    }

    onChange(['posts'], removeTagFromPosts(posts, selectedTag.name));
    setSelectedTagName('');
    setRenameDraft(null);
  };

  const togglePostSelection = (index: number) => {
    setSelectedPostIndexes((current) => current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index].sort((a, b) => a - b)
    );
  };

  const assignTagToPosts = () => {
    const cleanTag = newTag.trim();
    if (!cleanTag || selectedPostIndexes.length === 0) {
      return;
    }

    onChange(['posts'], addTagToPostIndexes(posts, cleanTag, selectedPostIndexes));
    setSelectedTagName(cleanTag);
    setRenameDraft(cleanTag);
    setNewTag('');
    setSelectedPostIndexes([]);
  };

  return (
    <PanelFrame title="标签词库" description="这里管理文章标签本身：改名会同步到所有文章，删除会从所有文章移除，也可以把标签批量分配给选中的文章。">
      <div className="admin-publish-guide">
        <strong>标签不是文章正文</strong>
        <span>前台标签页仍从文章标签生成，但这里的操作只改标签字段，不会打开文章发布表单。</span>
      </div>

      <div className="admin-record-list">
        <div className="admin-record-index">
          <div className="admin-record-index-head">
            <div>
              <strong>{tagUsages.length}</strong>
              <span>个标签</span>
            </div>
          </div>
          <div className="admin-record-buttons">
            {tagUsages.map((tag) => (
              <button className={tag.name === selectedTag?.name ? 'is-active' : ''} key={tag.name} type="button" onClick={() => selectTag(tag.name)}>
                <span>#{tag.name}</span>
                <small>{tag.count} 篇文章 / 已发布 {tag.publishedCount}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-record-editor">
          {selectedTag ? (
            <>
              <div className="admin-record-edit-head">
                <div>
                  <span>当前标签</span>
                  <strong>#{selectedTag.name}</strong>
                  <small>{selectedTag.count} 篇文章使用，{selectedTag.draftCount} 篇草稿关联。</small>
                </div>
                <div className="admin-record-toolbar">
                  <button className="button primary" type="button" onClick={renameSelectedTag}>应用改名</button>
                  <button className="button danger" type="button" onClick={removeSelectedTag}>移除标签</button>
                </div>
              </div>

              <FieldSectionLabel count={2} title="标签维护" />
              <FieldGrid>
                <label className="admin-field">
                  <span>标签名称</span>
                  <input value={renameValue} onChange={(event) => setRenameDraft(event.target.value)} />
                  <small className="admin-field-help">字段说明：改名会同步替换所有文章里的这个标签。</small>
                </label>
                <label className="admin-field">
                  <span>使用范围</span>
                  <input readOnly value={`${selectedTag.count} 篇文章`} />
                  <small className="admin-field-help">字段说明：标签云只展示已发布文章中的标签。</small>
                </label>
              </FieldGrid>

              <div className="fraud-checklist">
                {selectedTag.postTitles.map((title, index) => <span key={`${selectedTag.name}-${index}`}>{title}</span>)}
              </div>
            </>
          ) : (
            <div className="admin-empty-state">
              <p>当前还没有文章标签。先在下方选择文章并分配一个标签。</p>
            </div>
          )}

          <section className="admin-soft-section">
            <h4>给文章分配标签</h4>
            <p>新增标签必须至少分配给一篇文章；未关联文章的标签不会出现在前台标签页。</p>
            <FieldGrid>
              <label className="admin-field">
                <span>标签名称</span>
                <input value={newTag} placeholder="例如：Next.js" onChange={(event) => setNewTag(event.target.value)} />
              </label>
            </FieldGrid>
            <div className="admin-row-actions">
              <button className="button ghost" type="button" onClick={() => setSelectedPostIndexes(posts.map((_post, index) => index))}>全选文章</button>
              <button className="button ghost" type="button" onClick={() => setSelectedPostIndexes([])}>清空选择</button>
              <button className="button primary" type="button" disabled={!newTag.trim() || selectedPostIndexes.length === 0} onClick={assignTagToPosts}>分配标签</button>
            </div>
            <FieldGrid>
              {posts.map((post, index) => (
                <label className="admin-field admin-field-toggle" key={post.id || post.slug || index}>
                  <span>{post.title}</span>
                  <input checked={selectedPostSet.has(index)} type="checkbox" onChange={() => togglePostSelection(index)} />
                  <small className="admin-field-help">当前标签：{normalizeTagList(post.tags).join('、') || '暂无'}</small>
                </label>
              ))}
            </FieldGrid>
          </section>
        </div>
      </div>
    </PanelFrame>
  );
}

type TagUsage = {
  name: string;
  count: number;
  draftCount: number;
  publishedCount: number;
  postTitles: string[];
};

function collectTagUsages(posts: BlogData['posts']): TagUsage[] {
  const tags = new Map<string, TagUsage>();

  posts.forEach((post, index) => {
    for (const tag of normalizeTagList(post.tags)) {
      const key = tag.toLowerCase();
      const current = tags.get(key);
      const postTitle = post.title || `第 ${index + 1} 篇文章`;
      const isPublished = post.status === 'published';

      tags.set(key, current ? {
        ...current,
        count: current.count + 1,
        draftCount: current.draftCount + (isPublished ? 0 : 1),
        publishedCount: current.publishedCount + (isPublished ? 1 : 0),
        postTitles: [...current.postTitles, postTitle]
      } : {
        name: tag,
        count: 1,
        draftCount: isPublished ? 0 : 1,
        publishedCount: isPublished ? 1 : 0,
        postTitles: [postTitle]
      });
    }
  });

  return [...tags.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

function renameTagAcrossPosts(posts: BlogData['posts'], sourceTag: string, targetTag: string): BlogData['posts'] {
  const sourceKey = sourceTag.trim().toLowerCase();
  const cleanTarget = targetTag.trim();
  if (!sourceKey || !cleanTarget) {
    return posts;
  }

  return posts.map((post) => {
    const currentTags = normalizeTagList(post.tags);
    const nextTags = dedupeTags(currentTags.map((tag) => tag.toLowerCase() === sourceKey ? cleanTarget : tag));
    return tagsAreEqual(currentTags, nextTags) ? post : { ...post, tags: nextTags };
  });
}

function removeTagFromPosts(posts: BlogData['posts'], tagName: string): BlogData['posts'] {
  const tagKey = tagName.trim().toLowerCase();
  if (!tagKey) {
    return posts;
  }

  return posts.map((post) => {
    const currentTags = normalizeTagList(post.tags);
    const nextTags = currentTags.filter((tag) => tag.toLowerCase() !== tagKey);
    return tagsAreEqual(currentTags, nextTags) ? post : { ...post, tags: nextTags };
  });
}

function addTagToPostIndexes(posts: BlogData['posts'], tagName: string, postIndexes: number[]): BlogData['posts'] {
  const cleanTag = tagName.trim();
  const indexSet = new Set(postIndexes);
  if (!cleanTag || indexSet.size === 0) {
    return posts;
  }

  return posts.map((post, index) => {
    if (!indexSet.has(index)) {
      return post;
    }

    const currentTags = normalizeTagList(post.tags);
    const nextTags = dedupeTags([...currentTags, cleanTag]);
    return tagsAreEqual(currentTags, nextTags) ? post : { ...post, tags: nextTags };
  });
}

function normalizeTagList(value: unknown): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n,，]/)
      : [];

  return dedupeTags(rawItems.map((item) => stringValue(item).trim()).filter(Boolean));
}

function dedupeTags(tags: string[]): string[] {
  const result = new Map<string, string>();
  for (const tag of tags) {
    const cleanTag = tag.trim();
    if (cleanTag && !result.has(cleanTag.toLowerCase())) {
      result.set(cleanTag.toLowerCase(), cleanTag);
    }
  }

  return [...result.values()];
}

function tagsAreEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function PathFieldPanel({ children, data, description, fields, title, uploadImage, onChange }: {
  children?: ReactNode;
  data: BlogData;
  description: string;
  fields: PathFieldConfig[];
  title: string;
  uploadImage: UploadImage;
  onChange: (path: PathSegment[], value: unknown) => void;
}) {
  return (
    <PanelFrame title={title} description={description}>
      <PathFieldSections
        data={data}
        fields={fields}
        uploadImage={uploadImage}
        onChange={onChange}
      />
      {children}
    </PanelFrame>
  );
}

function PathFieldSections({ advancedDescription = '这些字段不常改，只有需要微调页面细节、链接、系统识别或特殊配置时再展开。', advancedLabel = '更多设置', data, fields, uploadImage, onChange }: {
  advancedDescription?: string;
  advancedLabel?: string;
  data: BlogData;
  fields: PathFieldConfig[];
  uploadImage: UploadImage;
  onChange: (path: PathSegment[], value: unknown) => void;
}) {
  const primaryFields = fields.filter((field) => !field.advanced);
  const advancedFields = fields.filter((field) => field.advanced);

  return (
    <>
      {primaryFields.length > 0 ? (
        <>
          <FieldSectionLabel count={primaryFields.length} title="常用字段" />
          <FieldGrid>
            {primaryFields.map((field) => (
              <PathField data={data} field={field} key={field.path.join('.')} path={field.path} onChange={onChange} uploadImage={uploadImage} />
            ))}
          </FieldGrid>
        </>
      ) : null}

      {advancedFields.length > 0 ? (
        <details className="admin-advanced-settings">
          <summary>{advancedLabel}<span>{advancedFields.length} 项</span></summary>
          <p>{advancedDescription}</p>
          <FieldGrid>
            {advancedFields.map((field) => (
              <PathField data={data} field={field} key={field.path.join('.')} path={field.path} onChange={onChange} uploadImage={uploadImage} />
            ))}
          </FieldGrid>
        </details>
      ) : null}
    </>
  );
}

function FieldSectionLabel({ count, title }: { count: number; title: string }) {
  return (
    <div className="admin-field-section-label">
      <strong>{title}</strong>
      <span>{count} 项</span>
    </div>
  );
}

function PanelFrame({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <section className="fraud-admin-panel">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}

function SimpleNotice({ description, title }: { description: string; title: string }) {
  return (
    <PanelFrame title={title} description={description}>
      <p className="admin-help-text">请先检查栏目配置，再继续维护。</p>
    </PanelFrame>
  );
}

function ProjectGitHubSourcePanel({ data, onChange, onWorkspaceJump }: { data: BlogData; onChange: (path: PathSegment[], value: unknown) => void; onWorkspaceJump: (id: string) => void }) {
  const githubHref = /^https?:\/\//i.test(data.site.github) ? data.site.github : undefined;
  const projectOrder = Array.isArray(data.site.projectOrder) ? data.site.projectOrder : [];
  const projectOrderText = projectOrder.join('\n');

  return (
    <PanelFrame title="前台项目排序" description="项目仍然由 GitHub 自动同步，这里只控制前台项目卡片的展示顺序。">
      <FieldGrid>
        <label className="admin-field admin-field-wide">
          <span>前台展示顺序</span>
          <textarea
            rows={8}
            value={projectOrderText}
            placeholder={'personal-theme-blog\nhttps://github.com/yige66/your-repo'}
            onChange={(event) => onChange(['site', 'projectOrder'], parseProjectOrderText(event.target.value))}
          />
          <small className="admin-field-help">每行一个 GitHub 仓库名、owner/repo 或完整仓库链接。排在前面的项目优先显示，没写进来的公开仓库会自动排在后面。</small>
        </label>
      </FieldGrid>
      <p className="admin-help-text">当前已置顶 {projectOrder.length} 个项目；新增仓库不需要在这里新增，只在需要固定展示顺序时填写。</p>
      <div className="admin-publish-guide">
        <strong>不用手写项目</strong>
        <span>前台项目页会读取 GitHub 公开仓库，卡片点击后直接打开对应 GitHub 页面。后台只需要维护 GitHub 地址和项目页头部文案。</span>
      </div>
      <div className="admin-publish-guide">
        <strong>项目更新后自动同步</strong>
        <span>在 GitHub 仓库 Webhook 里填写 Payload URL：你的域名 + /api/github/projects，Content type 选 application/json，Secret 使用环境变量 GITHUB_PROJECTS_WEBHOOK_SECRET。已有仓库更新会立即刷新；新增仓库会被 Vercel Cron 每日巡检同步到项目页。</span>
      </div>
      <div className="fraud-guide-grid">
        <GuideButton title="修改 GitHub 地址" description="进入全站资料，把 GitHub 地址填成账号主页，例如 https://github.com/yige66。" onClick={() => onWorkspaceJump('global')} />
        <GuideButton title="调整项目页文案" description="修改项目页标题、说明、按钮、空状态和搜索提示，不影响 GitHub 仓库内容。" onClick={() => onWorkspaceJump('projects')} />
        <GuideButton title="自动同步接口" description="/api/github/projects，给 GitHub Webhook 或 GitHub Actions 调用。" />
        <GuideButton title="查看当前 GitHub" description={data.site.github || '还没有填写 GitHub 地址'} href={githubHref} />
      </div>
    </PanelFrame>
  );
}

function parseProjectOrderText(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || line.length > 200 || /[\u0000-\u001f\u007f]/.test(line)) {
        return false;
      }
      const key = line.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 100);
}

function GuideButton({ description, href, title, onClick }: { description: string; href?: string; title: string; onClick?: () => void }) {
  if (href) {
    return (
      <a className="admin-guide-card" href={href} target="_blank" rel="noreferrer">
        <strong>{title}</strong>
        <span>{description}</span>
      </a>
    );
  }

  if (!onClick) {
    return (
      <div className="admin-guide-card">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    );
  }

  return (
    <button className="admin-guide-card" type="button" onClick={onClick}>
      <strong>{title}</strong>
      <span>{description}</span>
    </button>
  );
}

function EntryScreenPanel({ data, uploadImage, onChange }: { data: BlogData; uploadImage: UploadImage; onChange: (path: PathSegment[], value: unknown) => void }) {
  const panelFields: FieldConfig[] = [
    { key: 'eyebrow', label: '小标题' },
    { key: 'eyebrowHighlight', label: '高亮文字' },
    { key: 'title', label: '主标题' },
    { key: 'description', label: '说明', kind: 'textarea', rows: 3 }
  ];
  const hotspotFields: FieldConfig[] = [
    { key: 'label', label: '名称' },
    { key: 'hint', label: '提示' },
    { key: 'target', label: '目标标识' }
  ];
  const hotspotKeys = ['archive', 'music', 'friends', 'desk', 'theme'] as const;

  return (
    <PanelFrame title="启动页" description="这是访客进入网站前看到的欢迎层，按普通文案维护即可。">
      <PathFieldSections
        advancedDescription="入口名称、署名、切换按钮和启动日志属于细节文案，只有需要调整启动页完整体验时再改。"
        data={data}
        fields={entryRootFields}
        uploadImage={uploadImage}
        onChange={onChange}
      />

      <div className="admin-entry-panels">
        {(['original', 'beyond'] as const).map((mode) => (
          <section className="admin-soft-section" key={mode}>
            <h4>{mode === 'original' ? '普通入口文案' : '切换模式文案'}</h4>
            <FieldGrid>
              {panelFields.map((field) => (
                <FieldEditor
                  field={field}
                  key={field.key}
                  value={getAtPath(data, ['site', 'entry', mode, field.key])}
                  onChange={(value) => onChange(['site', 'entry', mode, field.key], value)}
                  uploadImage={uploadImage}
                />
              ))}
            </FieldGrid>
          </section>
        ))}
      </div>

      <section className="admin-soft-section">
        <h4>启动页热点</h4>
        <p>热点是启动页里可以点击的几个入口提示。</p>
        <div className="admin-entry-hotspots">
          {hotspotKeys.map((key) => (
            <div className="admin-mini-editor" key={key}>
              <h5>{key}</h5>
              {hotspotFields.map((field) => (
                <FieldEditor
                  field={field}
                  key={field.key}
                  value={getAtPath(data, ['site', 'entry', 'hotspots', key, field.key])}
                  onChange={(value) => onChange(['site', 'entry', 'hotspots', key, field.key], value)}
                  uploadImage={uploadImage}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </PanelFrame>
  );
}

function CommentsEffectsPanel({ compact = false, data, uploadImage, onChange }: {
  compact?: boolean;
  data: BlogData;
  uploadImage: UploadImage;
  onChange: (path: PathSegment[], value: unknown) => void;
}) {
  const fields: PathFieldConfig[] = [
    { path: ['site', 'comments', 'enabled'], key: 'enabled', label: '启用评论', kind: 'boolean' },
    { path: ['site', 'comments', 'provider'], key: 'provider', label: '评论提供方' },
    { path: ['site', 'comments', 'repo'], key: 'repo', label: '评论仓库', advanced: true },
    { path: ['site', 'comments', 'owner'], key: 'owner', label: '仓库 owner', advanced: true },
    { path: ['site', 'comments', 'admin'], key: 'admin', label: '评论管理员', kind: 'list', advanced: true },
    { path: ['site', 'comments', 'clientId'], key: 'clientId', label: 'GitHub Client ID', advanced: true },
    { path: ['site', 'comments', 'proxy'], key: 'proxy', label: '代理接口', advanced: true },
    { path: ['site', 'comments', 'mapping'], key: 'mapping', label: '映射方式', advanced: true },
    { path: ['site', 'comments', 'label'], key: 'label', label: 'Issue 标签', advanced: true },
    { path: ['site', 'comments', 'theme'], key: 'theme', label: '评论主题', advanced: true },
    { path: ['site', 'effects', 'enabled'], key: 'enabled', label: '启用特效', kind: 'boolean' },
    { path: ['site', 'effects', 'fireflies'], key: 'fireflies', label: '萤光', kind: 'boolean' },
    { path: ['site', 'effects', 'petals'], key: 'petals', label: '花瓣', kind: 'boolean' },
    { path: ['site', 'effects', 'grass'], key: 'grass', label: '草地', kind: 'boolean' },
    { path: ['site', 'effects', 'cursorTrail'], key: 'cursorTrail', label: '光标轨迹', kind: 'boolean' },
    { path: ['site', 'effects', 'floatingCompanion'], key: 'floatingCompanion', label: '浮动助手', kind: 'boolean' },
    { path: ['site', 'effects', 'intensity'], key: 'intensity', label: '特效强度', kind: 'number' },
    { path: ['site', 'effects', 'danmaku'], key: 'danmaku', label: '弹幕文本', kind: 'list', advanced: true }
  ];

  const content = (
    <PathFieldSections
      advancedDescription="评论仓库、OAuth Client ID、代理接口、映射方式和弹幕文本属于技术配置；正常发内容时不用打开。"
      data={data}
      fields={fields}
      uploadImage={uploadImage}
      onChange={onChange}
    />
  );

  if (compact) {
    return content;
  }

  return (
    <PanelFrame title="安全与互动设置" description="评论配置会影响音乐、友链、动态、文章和杂谈详情。特效配置影响全站氛围。">
      <div className="fraud-risk-note">
        <strong>安全提示</strong>
        <span>OAuth secret 和 AI API Key 不允许写进公开博客数据，只能放在环境变量或服务端配置。</span>
      </div>
      {content}
    </PanelFrame>
  );
}

function AiSettingsPanel({
  apiKey,
  clearApiKey,
  config,
  model,
  saveState,
  onApiKeyChange,
  onClearApiKeyChange,
  onLoad,
  onModelChange,
  onSave
}: {
  apiKey: string;
  clearApiKey: boolean;
  config: AiAdminConfigView | null;
  model: string;
  saveState: { status: string; message: string };
  onApiKeyChange: (value: string) => void;
  onClearApiKeyChange: (value: boolean) => void;
  onLoad: () => void;
  onModelChange: (value: string) => void;
  onSave: () => void;
}) {
  const options = config?.modelOptions ?? [
    { label: 'DeepSeek V4 Flash（轻量推荐）', value: 'deepseek-v4-flash' },
    { label: 'DeepSeek V4 Pro（更强理解）', value: 'deepseek-v4-pro' }
  ];
  const optionValues = new Set(options.map((option) => option.value));
  const selectedPreset = optionValues.has(model) ? model : 'custom';
  const keySourceLabel = config?.apiKeySource === 'backend'
    ? '后台密钥'
    : config?.apiKeySource === 'env'
      ? '环境变量密钥'
      : '未配置';

  return (
    <PanelFrame title="DeepSeek 设置" description="这里配置右下角助手使用的 DeepSeek 模型和密钥。密钥只保存在服务端后台。">
      <div className="admin-ai-status" data-status={saveState.status}>
        <span>{saveState.message}</span>
        <small>
          当前状态：{config?.hasApiKey ? `已配置（${keySourceLabel}）` : '未配置密钥'}
          {config?.updatedAt ? ` / 更新时间：${new Date(config.updatedAt).toLocaleString('zh-CN')}` : ''}
        </small>
      </div>

      <FieldGrid>
        <label className="admin-field">
          <span>模型预设</span>
          <select value={selectedPreset} onChange={(event) => {
            if (event.target.value !== 'custom') {
              onModelChange(event.target.value);
            }
          }}>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            <option value="custom">自定义模型</option>
          </select>
          <small className="admin-field-help">可以选择预设，也可以在下方填写兼容 DeepSeek Chat Completions 的模型名。</small>
        </label>

        <label className="admin-field">
          <span>实际调用模型</span>
          <input value={model} placeholder="deepseek-v4-flash" onChange={(event) => onModelChange(event.target.value)} />
          <small className="admin-field-help">保存后，助手下一次问答会使用这个模型。</small>
        </label>

        <label className="admin-field admin-field-wide">
          <span>DeepSeek API Key</span>
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            placeholder={config?.hasApiKey ? '留空则保留当前密钥' : '粘贴 DeepSeek API Key'}
            onChange={(event) => onApiKeyChange(event.target.value)}
          />
          <small className="admin-field-help">不会返回到前端；保存后写入服务端配置文件。</small>
        </label>

        <label className="admin-field admin-field-toggle">
          <span>清空后台密钥</span>
          <input checked={clearApiKey} type="checkbox" onChange={(event) => onClearApiKeyChange(event.target.checked)} />
          <small className="admin-field-help">只清空后台保存的密钥；环境变量仍会作为兜底。</small>
        </label>
      </FieldGrid>

      <div className="admin-panel-actions">
        <button className="button ghost" type="button" onClick={onLoad}>读取 AI 配置</button>
        <button className="button primary" type="button" disabled={saveState.status === 'saving'} onClick={onSave}>
          {saveState.status === 'saving' ? '正在保存' : '保存 AI 配置'}
        </button>
      </div>
    </PanelFrame>
  );
}

function RecordListEditor({ data, description, fields, path, recordKind, title, uploadImage, onChange }: {
  data: BlogData;
  description: string;
  fields: FieldConfig[];
  path: PathSegment[];
  recordKind: RecordKind;
  title: string;
  uploadImage: UploadImage;
  onChange: (path: PathSegment[], value: unknown) => void;
}) {
  const records = asRecordArray(getAtPath(data, path));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const safeIndex = records.length === 0 ? -1 : Math.min(selectedIndex, records.length - 1);
  const selected = safeIndex >= 0 ? records[safeIndex] : null;
  const primaryFields = fields.filter((field) => !field.advanced);
  const advancedFields = fields.filter((field) => field.advanced);
  const copy = recordKindCopy(recordKind);
  const replaceRecords = (nextRecords: JsonRecord[]) => onChange(path, nextRecords);

  const addRecord = () => {
    const nextRecords = [...records, createEmptyItem(recordKind)];
    replaceRecords(nextRecords);
    setSelectedIndex(nextRecords.length - 1);
  };

  const duplicateRecord = () => {
    if (!selected) {
      return;
    }
    const nextRecords = [...records.slice(0, safeIndex + 1), withFreshIdentity(selected, recordKind), ...records.slice(safeIndex + 1)];
    replaceRecords(nextRecords);
    setSelectedIndex(safeIndex + 1);
  };

  const removeRecord = () => {
    if (safeIndex < 0 || !window.confirm('删除当前条目？保存前仍可刷新页面放弃本地草稿。')) {
      return;
    }
    replaceRecords(records.filter((_record, index) => index !== safeIndex));
    setSelectedIndex(Math.max(0, safeIndex - 1));
  };

  const moveRecord = (direction: -1 | 1) => {
    const targetIndex = safeIndex + direction;
    if (safeIndex < 0 || targetIndex < 0 || targetIndex >= records.length) {
      return;
    }
    const nextRecords = [...records];
    const current = nextRecords[safeIndex];
    nextRecords[safeIndex] = nextRecords[targetIndex];
    nextRecords[targetIndex] = current;
    replaceRecords(nextRecords);
    setSelectedIndex(targetIndex);
  };

  return (
    <PanelFrame title={title} description={description}>
      <div className="admin-publish-guide">
        <strong>{copy.guideTitle}</strong>
        <span>{copy.guideText}</span>
      </div>
      <div className="admin-record-list">
        <div className="admin-record-index">
          <div className="admin-record-index-head">
            <div>
              <strong>{records.length}</strong>
              <span>{copy.countLabel}</span>
            </div>
            <button className="button primary" type="button" onClick={addRecord}>{copy.addLabel}</button>
          </div>
          <div className="admin-record-buttons">
            {records.map((record, index) => (
              <button className={index === safeIndex ? 'is-active' : ''} key={`${record.id ?? record.slug ?? record.title ?? index}-${index}`} type="button" onClick={() => setSelectedIndex(index)}>
                <span>{recordTitle(record, recordKind)}</span>
                <small>{recordSubtitle(record, recordKind, index)}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-record-editor">
          {selected ? (
            <>
              <div className="admin-record-edit-head">
                <div>
                  <span>{copy.formLabel}</span>
                  <strong>{recordTitle(selected, recordKind)}</strong>
                  <small>{copy.formHelp}</small>
                </div>
                <div className="admin-record-toolbar">
                  <button className="button ghost" type="button" onClick={() => moveRecord(-1)}>上移</button>
                  <button className="button ghost" type="button" onClick={() => moveRecord(1)}>下移</button>
                  <button className="button ghost" type="button" onClick={duplicateRecord}>复制</button>
                  <button className="button danger" type="button" onClick={removeRecord}>删除</button>
                </div>
              </div>
              <FieldSectionLabel count={primaryFields.length} title="常用字段" />
              <FieldGrid>
                {primaryFields.map((field) => (
                  <FieldEditor field={field} key={field.key} value={selected[field.key]} onChange={(value) => onChange([...path, safeIndex, field.key], value)} uploadImage={uploadImage} />
                ))}
              </FieldGrid>
              {advancedFields.length > 0 ? (
                <details className="admin-advanced-settings" open={showAdvanced} onToggle={(event) => setShowAdvanced(event.currentTarget.open)}>
                  <summary>更多设置<span>{advancedFields.length} 项</span></summary>
                  <p>{copy.advancedHelp}</p>
                  <FieldGrid>
                    {advancedFields.map((field) => (
                      <FieldEditor field={field} key={field.key} value={selected[field.key]} onChange={(value) => onChange([...path, safeIndex, field.key], value)} uploadImage={uploadImage} />
                    ))}
                  </FieldGrid>
                </details>
              ) : null}
            </>
          ) : (
            <div className="admin-empty-state">
              <p>当前栏目还没有内容。</p>
              <button className="button primary" type="button" onClick={addRecord}>{copy.emptyAction}</button>
            </div>
          )}
        </div>
      </div>
    </PanelFrame>
  );
}

function recordKindCopy(kind: RecordKind) {
  const map: Record<RecordKind, { addLabel: string; advancedHelp: string; countLabel: string; emptyAction: string; formHelp: string; formLabel: string; guideText: string; guideTitle: string }> = {
    post: {
      addLabel: '写新文章',
      advancedHelp: '分类、精选、更新时间、内部编号和页面地址一般由系统维护；只有需要修正页面链接或展示策略时再改。',
      countLabel: '篇文章',
      emptyAction: '写第一篇文章',
      formHelp: '按顺序填写标题、摘要、正文、标签、封面和发布时间；状态选择“已发布”后保存即可出现在前台。',
      formLabel: '文章发布表单',
      guideText: '发布文章只需要四步：写标题和摘要，填写正文，补封面和标签，把状态设为已发布后点击右上角保存数据。',
      guideTitle: '简单发布'
    },
    project: {
      addLabel: '新增项目',
      advancedHelp: '精选、开始日期和内部编号属于展示排序或系统识别字段，不确定时保持原样。',
      countLabel: '个项目',
      emptyAction: '新增第一个项目',
      formHelp: '填写项目名称、说明、访问地址、仓库地址、截图和标签后保存。',
      formLabel: '项目卡片表单',
      guideText: '项目发布围绕一张卡片：名称、说明、截图、链接填清楚，前台项目页就能正确展示。',
      guideTitle: '项目上架'
    },
    note: {
      addLabel: '发新动态',
      advancedHelp: '内部编号只给系统识别使用，正常发布动态不用改。',
      countLabel: '条动态',
      emptyAction: '发第一条动态',
      formHelp: '像发说说一样写标题、内容、日期、心情和配图。',
      formLabel: '动态发布表单',
      guideText: '动态发布很轻：写内容，选日期，补心情和配图，保存后会同步到动态页。',
      guideTitle: '动态发布'
    },
    chatter: {
      addLabel: '写新杂谈',
      advancedHelp: '精选、内部编号和页面地址属于系统字段，不确定时保持原样。',
      countLabel: '篇杂谈',
      emptyAction: '写第一篇杂谈',
      formHelp: '填写标题、摘要、正文、日期、标签、心情和封面。',
      formLabel: '杂谈发布表单',
      guideText: '杂谈比文章轻一些：写短文、配摘要和封面，保存后会进入杂谈列表。',
      guideTitle: '杂谈发布'
    },
    gallery: {
      addLabel: '新增相册',
      advancedHelp: '精选会影响首页或重点展示，不确定时先保持关闭。',
      countLabel: '组相册',
      emptyAction: '新增第一组相册',
      formHelp: '填写标题、说明、主图、地点和子图，保存后同步照片墙和画廊。',
      formLabel: '相册表单',
      guideText: '相册维护先放主图，再补说明和子图；不需要理解图片路径，直接上传即可。',
      guideTitle: '相册整理'
    },
    music: {
      addLabel: '新增歌曲',
      advancedHelp: '来源、提供方、时长和歌词时间轴属于播放器细节，普通维护只填歌名、歌手、音频地址和封面即可。',
      countLabel: '首歌曲',
      emptyAction: '新增第一首歌',
      formHelp: '填写歌名、歌手、场景、音频地址、封面和备注。',
      formLabel: '歌曲表单',
      guideText: '音乐维护只需要能播放和能识别：歌名、歌手、音频地址、封面优先。',
      guideTitle: '音乐上架'
    },
    link: {
      addLabel: '新增友链',
      advancedHelp: '收录日期、维护备注和主题色用于长期维护；不确定时保持默认即可。',
      countLabel: '个友链',
      emptyAction: '新增第一个友链',
      formHelp: '填写名称、链接、分类、站长署名、简介、头像和互链状态。',
      formLabel: '友链表单',
      guideText: '添加别人友链时先填公开名称和站点地址，再补分类、头像、互链状态和备注；保存后前台会进入可搜索友链列表。',
      guideTitle: '友链收录'
    },
    column: {
      addLabel: '新增栏目',
      advancedHelp: '内部编号、路径、坐标和氛围字段属于页面结构字段，正常管理不用改。',
      countLabel: '个栏目',
      emptyAction: '新增第一个栏目',
      formHelp: '填写导航名、页面标题、简介和显隐开关。',
      formLabel: '栏目表单',
      guideText: '栏目配置主要控制前台入口是否出现，低频结构字段已经收起。',
      guideTitle: '栏目管理'
    }
  };

  return map[kind];
}

function recordSubtitle(record: JsonRecord, kind: RecordKind, index: number): string {
  if (kind === 'post' || kind === 'chatter') {
    const status = record.status === 'draft' ? '草稿' : '已发布';
    return `${status} / ${stringValue(record.category || record.date || `第 ${index + 1} 条`)}`;
  }

  if (kind === 'project') {
    return stringValue(record.status || record.startedAt || `第 ${index + 1} 条`);
  }

  if (kind === 'gallery') {
    return stringValue(record.collection || record.location || `第 ${index + 1} 张`);
  }

  if (kind === 'link') {
    return stringValue(record.description || record.url || `第 ${index + 1} 条`);
  }

  return stringValue(record.mood || record.date || record.title || `第 ${index + 1} 条`);
}

function AssetPreview({ data }: { data: BlogData }) {
  const uniqueAssets = [...new Set(data.site.backgroundImages.filter(Boolean))];

  if (uniqueAssets.length === 0) {
    return null;
  }

  return (
    <div className="admin-asset-preview" aria-label="背景图预览">
      {uniqueAssets.slice(0, 12).map((asset) => (
        <figure key={asset}>
          <img alt="" src={asset} />
          <figcaption>{asset}</figcaption>
        </figure>
      ))}
    </div>
  );
}
