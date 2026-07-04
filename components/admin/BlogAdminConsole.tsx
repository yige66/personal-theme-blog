'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { BlogData } from '@/lib/blog';
import { FieldEditor, FieldGrid, PathField } from '@/components/admin/AdminFieldEditors';
import {
  ADMIN_SECTIONS,
  chatterFields,
  columnFields,
  entryRootFields,
  galleryFields,
  linkFields,
  musicFields,
  noteFields,
  postFields,
  projectFields,
  siteProfileFields,
  visualFields
} from '@/components/admin/adminConfig';
import type { AdminSectionId, BlogAdminConsoleProps, FieldConfig, JsonRecord, PathSegment, RecordKind, UploadImage } from '@/components/admin/adminTypes';
import {
  asRecordArray,
  cloneData,
  createDraftStats,
  createEmptyItem,
  createEmptyStats,
  formatJson,
  getAtPath,
  isRecord,
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

export function BlogAdminConsole({ initialData, initialStats }: BlogAdminConsoleProps) {
  const [draft, setDraft] = useState<BlogData | null>(() => initialData ? cloneData(initialData) : null);
  const [serverStats, setServerStats] = useState(initialStats);
  const [activeSection, setActiveSection] = useState<AdminSectionId>('site-profile');
  const [saveState, setSaveState] = useState({ status: 'idle', message: '修改会先保存在当前页面里，点击“保存到博客”后才会生效。' });
  const [adminToken, setAdminToken] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [aiConfig, setAiConfig] = useState<AiAdminConfigView | null>(null);
  const [aiModel, setAiModel] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [clearAiApiKey, setClearAiApiKey] = useState(false);
  const [aiConfigState, setAiConfigState] = useState({ status: 'idle', message: 'AI 配置只保存在服务端后台，不会写入公开博客数据。' });

  const stats = useMemo(
    () => draft ? createDraftStats(draft, serverStats ?? createEmptyStats()) : createEmptyStats(),
    [draft, serverStats]
  );

  const replaceDraft = (next: BlogData) => {
    setDraft(next);
    setSaveState({ status: 'idle', message: '内容已更新，记得点击“保存到博客”。' });
  };

  const setValueAtPath = (path: PathSegment[], value: unknown) => {
    setDraft((current) => current ? setAtPath(current, path, value) : current);
    setSaveState({ status: 'idle', message: '内容已更新，记得点击“保存到博客”。' });
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
      const payload = await response.json() as { error?: string; data?: BlogData; stats?: typeof initialStats };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || '读取后台数据失败。');
      }

      setServerStats(payload.stats ?? null);
      replaceDraft(payload.data);
      setSaveState({ status: 'success', message: '后台数据已加载。' });
    } catch (error) {
      setSaveState({ status: 'error', message: error instanceof Error ? error.message : '读取后台数据失败。' });
    }
  };

  const handleLoadAiConfig = async () => {
    setAiConfigState({ status: 'saving', message: '正在读取 AI 配置。' });
    try {
      const response = await fetch('/api/admin/ai', {
        headers: adminToken ? { 'x-admin-token': adminToken } : {}
      });
      const payload = await response.json() as { error?: string; config?: AiAdminConfigView };

      if (!response.ok || !payload.config) {
        throw new Error(payload.error || '读取 AI 配置失败。');
      }

      replaceAiConfig(payload.config);
      setAiConfigState({ status: 'success', message: 'AI 配置已加载。' });
    } catch (error) {
      setAiConfigState({ status: 'error', message: error instanceof Error ? error.message : '读取 AI 配置失败。' });
    }
  };

  const handleSaveAiConfig = async () => {
    const model = aiModel.trim();
    if (!model) {
      setAiConfigState({ status: 'error', message: '请选择或填写一个模型名称。' });
      return;
    }

    setAiConfigState({ status: 'saving', message: '正在保存 AI 配置。' });
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
      const payload = await response.json() as { error?: string; config?: AiAdminConfigView; savedAt?: string };

      if (!response.ok || !payload.config) {
        throw new Error(payload.error || '保存 AI 配置失败。');
      }

      replaceAiConfig(payload.config);
      setAiConfigState({ status: 'success', message: 'AI 配置已保存，红莉栖下一次回复会使用新模型。' });
    } catch (error) {
      setAiConfigState({ status: 'error', message: error instanceof Error ? error.message : '保存 AI 配置失败。' });
    }
  };

  const handleSave = async () => {
    if (!draft) {
      setSaveState({ status: 'error', message: '请先加载或导入博客数据。' });
      return;
    }

    setSaveState({ status: 'saving', message: '正在保存到博客。' });
    try {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'x-admin-token': adminToken } : {})
        },
        body: JSON.stringify({ data: draft })
      });
      const payload = await response.json() as { error?: string; details?: string[]; savedAt?: string; data?: BlogData };

      if (!response.ok) {
        throw new Error(payload.details?.join('\n') || payload.error || '保存失败。');
      }

      const nextData = payload.data ?? draft;
      setDraft(nextData);
      setLastSavedAt(payload.savedAt ?? new Date().toISOString());
      setSaveState({ status: 'success', message: '已保存到博客，并生成了一份备份。' });
    } catch (error) {
      setSaveState({ status: 'error', message: error instanceof Error ? error.message : '保存失败。' });
    }
  };

  const handleImageUpload: UploadImage = async (file) => {
    setSaveState({ status: 'saving', message: '正在上传图片。' });
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/assets', {
      method: 'POST',
      headers: adminToken ? { 'x-admin-token': adminToken } : {},
      body: formData
    });
    const payload = await response.json() as { path?: string; error?: string };

    if (!response.ok || !payload.path) {
      const message = payload.error || '图片上传失败。';
      setSaveState({ status: 'error', message });
      throw new Error(message);
    }

    setSaveState({ status: 'success', message: `图片已上传：${payload.path}` });
    return payload.path;
  };

  return (
    <section className="admin-os-shell">
      <AdminHero
        adminToken={adminToken}
        draft={draft}
        saveStatus={saveState.status}
        onAdminTokenChange={setAdminToken}
        onExport={handleExport}
        onImport={handleImport}
        onLoadData={handleLoadData}
        onSave={handleSave}
      />

      <div className="admin-os-status" data-status={saveState.status}>
        <span>{saveState.message}</span>
        {lastSavedAt ? <time dateTime={lastSavedAt}>最后保存：{new Date(lastSavedAt).toLocaleString('zh-CN')}</time> : null}
      </div>

      <div className="admin-os-metrics" aria-label="内容概览">
        <Metric label="文章" value={stats.posts} />
        <Metric label="草稿" value={stats.drafts} />
        <Metric label="项目" value={stats.projects} />
        <Metric label="动态" value={stats.notes} />
        <Metric label="杂谈" value={stats.chatters} />
        <Metric label="图片" value={stats.gallery} />
        <Metric label="音乐" value={stats.tracks} />
        <Metric label="友链" value={stats.links} />
      </div>

      {draft ? (
        <div className="admin-os-grid">
          <aside className="admin-sidebar" aria-label="后台模块">
            {ADMIN_SECTIONS.map((section) => (
              <button
                className={activeSection === section.id ? 'is-active' : ''}
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.label}</span>
                <small>{section.hint}</small>
              </button>
            ))}
          </aside>

          <div className="admin-workbench">
            {renderSection({
              activeSection,
              aiApiKey,
              aiConfig,
              aiConfigState,
              aiModel,
              clearAiApiKey,
              draft,
              setAiApiKey,
              setAiModel,
              setClearAiApiKey,
              setValueAtPath,
              uploadImage: handleImageUpload,
              onLoadAiConfig: handleLoadAiConfig,
              onSaveAiConfig: handleSaveAiConfig
            })}
          </div>
        </div>
      ) : (
        <section className="admin-locked-panel">
          <p className="eyebrow">Locked</p>
          <h2>后台数据未加载</h2>
          <p>输入后台密码后读取数据，或导入本地备份开始编辑。</p>
          <div className="admin-panel-actions">
            <button className="button primary" type="button" onClick={handleLoadData}>读取数据</button>
          </div>
        </section>
      )}
    </section>
  );
}

function AdminHero({
  adminToken,
  draft,
  saveStatus,
  onAdminTokenChange,
  onExport,
  onImport,
  onLoadData,
  onSave
}: {
  adminToken: string;
  draft: BlogData | null;
  saveStatus: string;
  onAdminTokenChange: (value: string) => void;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onLoadData: () => void;
  onSave: () => void;
}) {
  return (
    <header className="admin-os-hero">
      <div>
        <p className="eyebrow">Blog Operation System</p>
        <h1>博客后台操作系统</h1>
        <p>{draft?.site.title ?? '个人博客'} 的内容都可以在这里维护：先选择内容，再填写修改，最后保存生效。</p>
        <div className="admin-quick-steps" aria-label="使用步骤">
          <span><strong>1</strong>选择内容</span>
          <span><strong>2</strong>填写修改</span>
          <span><strong>3</strong>保存生效</span>
        </div>
      </div>
      <div className="admin-os-actions" aria-label="后台操作">
        <label className="admin-token-field">
          <span>后台密码</span>
          <input
            value={adminToken}
            type="password"
            autoComplete="off"
            placeholder="ADMIN_WRITE_TOKEN"
            onChange={(event) => onAdminTokenChange(event.target.value)}
          />
        </label>
        <button className="button ghost" type="button" onClick={onLoadData}>读取数据</button>
        <button className="button ghost" type="button" disabled={!draft} onClick={onExport}>导出备份</button>
        <label className="button ghost admin-file-button">
          导入备份
          <input type="file" accept="application/json" onChange={onImport} />
        </label>
        <button className="button primary" type="button" disabled={saveStatus === 'saving' || !draft} onClick={onSave}>
          {saveStatus === 'saving' ? '正在保存' : '保存到博客'}
        </button>
      </div>
    </header>
  );
}

function renderSection({ activeSection, aiApiKey, aiConfig, aiConfigState, aiModel, clearAiApiKey, draft, setAiApiKey, setAiModel, setClearAiApiKey, setValueAtPath, uploadImage, onLoadAiConfig, onSaveAiConfig }: {
  activeSection: AdminSectionId;
  aiApiKey: string;
  aiConfig: AiAdminConfigView | null;
  aiConfigState: { status: string; message: string };
  aiModel: string;
  clearAiApiKey: boolean;
  draft: BlogData;
  setAiApiKey: (value: string) => void;
  setAiModel: (value: string) => void;
  setClearAiApiKey: (value: boolean) => void;
  setValueAtPath: (path: PathSegment[], value: unknown) => void;
  uploadImage: UploadImage;
  onLoadAiConfig: () => void;
  onSaveAiConfig: () => void;
}) {
  switch (activeSection) {
    case 'site-profile':
      return <PathPanel title="站点资料" description="维护首页、SEO、个人资料和站点状态。" data={draft} fields={siteProfileFields} onChange={setValueAtPath} uploadImage={uploadImage} />;
    case 'site-visuals':
      return (
        <PathPanel title="图片与视觉" description="维护主题色、头像、首页封面图和全站背景图。" data={draft} fields={visualFields} onChange={setValueAtPath} uploadImage={uploadImage}>
          <AssetPreview data={draft} />
        </PathPanel>
      );
    case 'site-entry':
      return (
        <PathPanel title="入口文案" description="维护启动页文字、热点标记、状态行和引导按钮。" data={draft} fields={entryRootFields} onChange={setValueAtPath} uploadImage={uploadImage}>
          <NestedEntryEditor data={draft} onChange={setValueAtPath} uploadImage={uploadImage} />
        </PathPanel>
      );
    case 'site-columns':
      return <RecordListEditor title="栏目导航" description="决定哪些页面显示在导航、首页和工具箱里。" data={draft} path={['site', 'columns']} fields={columnFields} recordKind="column" onChange={setValueAtPath} uploadImage={uploadImage} />;
    case 'posts':
      return <RecordListEditor title="文章" description="像写普通文档一样维护标题、摘要、正文、标签、封面和发布时间。" data={draft} path={['posts']} fields={postFields} recordKind="post" onChange={setValueAtPath} uploadImage={uploadImage} />;
    case 'projects':
      return <RecordListEditor title="项目" description="维护项目卡片、状态、仓库链接、截图和精选开关。" data={draft} path={['projects']} fields={projectFields} recordKind="project" onChange={setValueAtPath} uploadImage={uploadImage} />;
    case 'notes':
      return <RecordListEditor title="动态" description="维护说说、心情、日期、标签和本地配图。" data={draft} path={['notes']} fields={noteFields} recordKind="note" onChange={setValueAtPath} uploadImage={uploadImage} />;
    case 'chatters':
      return <RecordListEditor title="杂谈" description="维护轻文章、访问路径、摘要、正文和封面图。" data={draft} path={['chatters']} fields={chatterFields} recordKind="chatter" onChange={setValueAtPath} uploadImage={uploadImage} />;
    case 'gallery':
      return <RecordListEditor title="照片墙" description="维护图集、主图、子图片、说明、地点和精选状态。" data={draft} path={['site', 'gallery']} fields={galleryFields} recordKind="gallery" onChange={setValueAtPath} uploadImage={uploadImage} />;
    case 'music':
      return <RecordListEditor title="音乐" description="维护本地歌单、封面、歌词、网易云补充字段和播放来源。" data={draft} path={['site', 'music']} fields={musicFields} recordKind="music" onChange={setValueAtPath} uploadImage={uploadImage} />;
    case 'links':
      return <RecordListEditor title="友链" description="维护朋友站点、头像、主题色和简介。" data={draft} path={['links']} fields={linkFields} recordKind="link" onChange={setValueAtPath} uploadImage={uploadImage} />;
    case 'ai-settings':
      return (
        <AiSettingsPanel
          apiKey={aiApiKey}
          config={aiConfig}
          clearApiKey={clearAiApiKey}
          model={aiModel}
          saveState={aiConfigState}
          onApiKeyChange={setAiApiKey}
          onClearApiKeyChange={setClearAiApiKey}
          onLoad={onLoadAiConfig}
          onModelChange={setAiModel}
          onSave={onSaveAiConfig}
        />
      );
    case 'comments-effects':
      return <CommentsEffectsPanel data={draft} onChange={setValueAtPath} uploadImage={uploadImage} />;
  }
}

function PathPanel({ title, description, data, fields, onChange, uploadImage, children }: {
  title: string;
  description: string;
  data: BlogData;
  fields: Array<FieldConfig & { path: PathSegment[] }>;
  onChange: (path: PathSegment[], value: unknown) => void;
  uploadImage: UploadImage;
  children?: React.ReactNode;
}) {
  return (
    <AdminPanel title={title} description={description}>
      <FieldGrid>
        {fields.map((field) => (
          <PathField data={data} field={field} key={field.path.join('.')} path={field.path} onChange={onChange} uploadImage={uploadImage} />
        ))}
      </FieldGrid>
      {children}
    </AdminPanel>
  );
}

function CommentsEffectsPanel({ data, onChange, uploadImage }: { data: BlogData; onChange: (path: PathSegment[], value: unknown) => void; uploadImage: UploadImage }) {
  const fields: Array<FieldConfig & { path: PathSegment[] }> = [
    { path: ['site', 'comments', 'enabled'], key: 'enabled', label: '启用评论', kind: 'boolean' },
    { path: ['site', 'comments', 'provider'], key: 'provider', label: '评论提供方' },
    { path: ['site', 'comments', 'repo'], key: 'repo', label: '评论仓库' },
    { path: ['site', 'comments', 'owner'], key: 'owner', label: '仓库 owner' },
    { path: ['site', 'comments', 'admin'], key: 'admin', label: '评论管理员', kind: 'list' },
    { path: ['site', 'comments', 'clientId'], key: 'clientId', label: 'GitHub Client ID' },
    { path: ['site', 'comments', 'proxy'], key: 'proxy', label: '代理接口' },
    { path: ['site', 'comments', 'mapping'], key: 'mapping', label: '映射方式' },
    { path: ['site', 'comments', 'label'], key: 'label', label: 'Issue 标签' },
    { path: ['site', 'comments', 'theme'], key: 'theme', label: '评论主题' },
    { path: ['site', 'effects', 'enabled'], key: 'enabled', label: '启用特效', kind: 'boolean' },
    { path: ['site', 'effects', 'fireflies'], key: 'fireflies', label: '萤光', kind: 'boolean' },
    { path: ['site', 'effects', 'petals'], key: 'petals', label: '花瓣', kind: 'boolean' },
    { path: ['site', 'effects', 'grass'], key: 'grass', label: '草地', kind: 'boolean' },
    { path: ['site', 'effects', 'cursorTrail'], key: 'cursorTrail', label: '光标轨迹', kind: 'boolean' },
    { path: ['site', 'effects', 'floatingCompanion'], key: 'floatingCompanion', label: '浮动助手', kind: 'boolean' },
    { path: ['site', 'effects', 'intensity'], key: 'intensity', label: '特效强度', kind: 'number' },
    { path: ['site', 'effects', 'danmaku'], key: 'danmaku', label: '弹幕文本', kind: 'list' }
  ];

  return <PathPanel title="评论与特效" description="维护评论提供方、弹幕、场景开关和强度。" data={data} fields={fields} onChange={onChange} uploadImage={uploadImage} />;
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
    { label: 'GPT-4.1 mini（轻量推荐）', value: 'gpt-4.1-mini' },
    { label: 'GPT-4.1（更强理解）', value: 'gpt-4.1' }
  ];
  const optionValues = new Set(options.map((option) => option.value));
  const selectedPreset = optionValues.has(model) ? model : 'custom';
  const keySourceLabel = config?.apiKeySource === 'backend'
    ? '后台密钥'
    : config?.apiKeySource === 'env'
      ? '环境变量密钥'
      : '未配置';

  return (
    <AdminPanel title="AI 红莉栖配置" description="配置右下角牧濑红莉栖助手使用的 AI API 密钥和模型。密钥只保存在服务端后台。">
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
          <small className="admin-field-help">字段说明：可以选择预设，也可以在下方填写其他兼容 Responses API 的模型名。</small>
        </label>

        <label className="admin-field">
          <span>实际调用模型</span>
          <input value={model} placeholder="gpt-4.1-mini" onChange={(event) => onModelChange(event.target.value)} />
          <small className="admin-field-help">字段说明：保存后，红莉栖下一次问答会使用这个模型。</small>
        </label>

        <label className="admin-field admin-field-wide">
          <span>AI API 密钥</span>
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            placeholder={config?.hasApiKey ? '留空则保留当前密钥' : '粘贴 OpenAI API Key'}
            onChange={(event) => onApiKeyChange(event.target.value)}
          />
          <small className="admin-field-help">字段说明：不会返回到前端；保存后写入 data/ai-config.json，本仓库已忽略该文件。</small>
        </label>

        <label className="admin-field admin-field-toggle">
          <span>清空后台密钥</span>
          <input checked={clearApiKey} type="checkbox" onChange={(event) => onClearApiKeyChange(event.target.checked)} />
          <small className="admin-field-help">字段说明：只清空后台保存的密钥；如果服务器环境变量仍存在，会继续作为兜底。</small>
        </label>
      </FieldGrid>

      <div className="admin-panel-actions">
        <button className="button ghost" type="button" onClick={onLoad}>读取 AI 配置</button>
        <button className="button primary" type="button" disabled={saveState.status === 'saving'} onClick={onSave}>
          {saveState.status === 'saving' ? '正在保存' : '保存 AI 配置'}
        </button>
      </div>
    </AdminPanel>
  );
}

function AdminPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="admin-panel">
      <header>
        <div>
          <p className="eyebrow">Admin Module</p>
          <h2>{title}</h2>
          <span>{description}</span>
        </div>
      </header>
      {children}
    </section>
  );
}

function RecordListEditor({ title, description, data, path, fields, recordKind, onChange, uploadImage }: {
  title: string;
  description: string;
  data: BlogData;
  path: PathSegment[];
  fields: FieldConfig[];
  recordKind: RecordKind;
  onChange: (path: PathSegment[], value: unknown) => void;
  uploadImage: UploadImage;
}) {
  const records = asRecordArray(getAtPath(data, path));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const safeIndex = records.length === 0 ? -1 : Math.min(selectedIndex, records.length - 1);
  const selected = safeIndex >= 0 ? records[safeIndex] : null;
  const replaceRecords = (nextRecords: JsonRecord[]) => onChange(path, nextRecords);
  const primaryFields = fields.filter((field) => !field.advanced);
  const advancedFields = fields.filter((field) => field.advanced);

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
    if (safeIndex < 0 || !window.confirm('删除当前条目？保存前仍可通过刷新页面放弃本地草稿。')) {
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
    <AdminPanel title={title} description={description}>
      <div className="admin-record-list">
        <div className="admin-record-index">
          <div className="admin-record-index-head">
            <strong>{records.length}</strong>
            <button className="button primary" type="button" onClick={addRecord}>新增</button>
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
              <div className="admin-record-toolbar">
                <button className="button ghost" type="button" onClick={() => moveRecord(-1)}>上移</button>
                <button className="button ghost" type="button" onClick={() => moveRecord(1)}>下移</button>
                <button className="button ghost" type="button" onClick={duplicateRecord}>复制</button>
                <button className="button danger" type="button" onClick={removeRecord}>删除</button>
              </div>
              <FieldGrid>
                {primaryFields.map((field) => (
                  <FieldEditor field={field} key={field.key} value={selected[field.key]} onChange={(value) => onChange([...path, safeIndex, field.key], value)} uploadImage={uploadImage} />
                ))}
              </FieldGrid>
              {advancedFields.length > 0 ? (
                <details className="admin-advanced-settings" open={showAdvanced} onToggle={(event) => setShowAdvanced(event.currentTarget.open)}>
                  <summary>更多设置</summary>
                  <p>这些是系统识别、页面地址或少用选项；不确定时保持原样。</p>
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
              <p>当前模块没有条目。</p>
              <button className="button primary" type="button" onClick={addRecord}>新增第一条</button>
            </div>
          )}
        </div>
      </div>
    </AdminPanel>
  );
}

function recordSubtitle(record: JsonRecord, kind: RecordKind, index: number): string {
  if (kind === 'post' || kind === 'chatter') {
    const status = record.status === 'draft' ? '草稿' : '已发布';
    return `${status} · ${stringValue(record.category || record.date || `第 ${index + 1} 条`)}`;
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

function NestedEntryEditor({ data, onChange, uploadImage }: { data: BlogData; onChange: (path: PathSegment[], value: unknown) => void; uploadImage: UploadImage }) {
  const panelFields: FieldConfig[] = [
    { key: 'eyebrow', label: '眉标' },
    { key: 'eyebrowHighlight', label: '高亮眉标' },
    { key: 'title', label: '标题' },
    { key: 'description', label: '描述', kind: 'textarea', rows: 3 }
  ];
  const hotspotFields: FieldConfig[] = [
    { key: 'label', label: '名称' },
    { key: 'hint', label: '提示' },
    { key: 'target', label: '目标' }
  ];
  const hotspotIds = ['archive', 'music', 'friends', 'desk', 'theme'];

  return (
    <div className="admin-nested-panels">
      {(['original', 'beyond'] as const).map((panel) => (
        <div className="admin-nested-panel" key={panel}>
          <h3>{panel === 'original' ? '初始入口' : 'Beyond 入口'}</h3>
          <FieldGrid>
            {panelFields.map((field) => (
              <PathField data={data} field={field} key={field.key} path={['site', 'entry', panel, field.key]} onChange={onChange} uploadImage={uploadImage} />
            ))}
          </FieldGrid>
        </div>
      ))}
      <div className="admin-nested-panel">
        <h3>入口对话</h3>
        <FieldGrid>
          <PathField data={data} field={{ key: 'eyebrow', label: '眉标' }} path={['site', 'entry', 'dialogue', 'eyebrow']} onChange={onChange} uploadImage={uploadImage} />
          <PathField data={data} field={{ key: 'title', label: '标题' }} path={['site', 'entry', 'dialogue', 'title']} onChange={onChange} uploadImage={uploadImage} />
          <PathField data={data} field={{ key: 'description', label: '描述', kind: 'textarea', rows: 3 }} path={['site', 'entry', 'dialogue', 'description']} onChange={onChange} uploadImage={uploadImage} />
        </FieldGrid>
      </div>
      {hotspotIds.map((hotspot) => (
        <div className="admin-nested-panel" key={hotspot}>
          <h3>{hotspot}</h3>
          <FieldGrid>
            {hotspotFields.map((field) => (
              <PathField data={data} field={field} key={field.key} path={['site', 'entry', 'hotspots', hotspot, field.key]} onChange={onChange} uploadImage={uploadImage} />
            ))}
          </FieldGrid>
        </div>
      ))}
    </div>
  );
}

function AssetPreview({ data }: { data: BlogData }) {
  const uniqueAssets = collectBackgroundImagePaths(data);

  return (
    <div className="admin-asset-preview" aria-label="背景图预览">
      {uniqueAssets.length > 0 ? (
        uniqueAssets.map((asset) => (
          <figure key={asset}>
            <img src={asset} alt="" loading="lazy" />
            <figcaption>{asset}</figcaption>
          </figure>
        ))
      ) : <p className="admin-help-text">还没有背景图，上传或手动添加后会在这里预览。</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function collectBackgroundImagePaths(data: BlogData): string[] {
  const images = (Array.isArray(data.site.backgroundImages) ? data.site.backgroundImages : [])
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(images)];
}
