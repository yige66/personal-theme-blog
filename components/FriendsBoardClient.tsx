'use client';

import Image from 'next/image';
import { useMemo, useState, type CSSProperties } from 'react';
import type { BlogLink, BlogSite } from '@/lib/blog';

type FriendApplyForm = {
  avatar: string;
  contact: string;
  description: string;
  reciprocalUrl: string;
  title: string;
  url: string;
};

const emptyApplyForm: FriendApplyForm = {
  avatar: '',
  contact: '',
  description: '',
  reciprocalUrl: '',
  title: '',
  url: ''
};

const statusLabels: Record<NonNullable<BlogLink['status']>, string> = {
  active: '已互链',
  pending: '申请中',
  paused: '暂停'
};

export function FriendsBoardClient({ links, site }: { links: BlogLink[]; site: BlogSite }) {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [copyStatus, setCopyStatus] = useState('复制本站信息');
  const [form, setForm] = useState<FriendApplyForm>(emptyApplyForm);
  const [formStatus, setFormStatus] = useState('填写后复制申请内容');
  const [query, setQuery] = useState('');

  const applyFormat = site.friendLinkApplyFormat || [
    `名称：${site.title}`,
    `简介：${site.subtitle}`,
    `链接：${site.github}`,
    `头像：${site.avatar}`
  ].join('\n');

  const categories = useMemo(() => {
    const collected = links
      .map((link) => link.category?.trim())
      .filter((category): category is string => Boolean(category));
    return ['全部', ...Array.from(new Set(collected))];
  }, [links]);

  const filteredLinks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return links.filter((link) => {
      const matchCategory = activeCategory === '全部' || link.category === activeCategory;
      const searchable = [
        link.title,
        link.description,
        link.owner,
        link.category,
        link.note,
        link.url
      ].filter(Boolean).join(' ').toLowerCase();
      return matchCategory && (!keyword || searchable.includes(keyword));
    });
  }, [activeCategory, links, query]);

  const stats = useMemo(() => ({
    active: links.filter((link) => link.status === 'active').length,
    pending: links.filter((link) => link.status === 'pending').length,
    reciprocal: links.filter((link) => link.reciprocal).length
  }), [links]);

  const copyText = async (text: string, onResult: (message: string) => void, resetText: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onResult('已复制');
      window.setTimeout(() => onResult(resetText), 1800);
    } catch {
      onResult('复制失败，请手动选中');
    }
  };

  const copyApplyFormat = () => {
    void copyText(applyFormat, setCopyStatus, '复制本站信息');
  };

  const applyText = createFriendApplyText(form, site);
  const formError = validateApplyForm(form);
  const copyFriendApply = () => {
    if (formError) {
      setFormStatus(formError);
      return;
    }
    void copyText(applyText, setFormStatus, '填写后复制申请内容');
  };

  const updateForm = (key: keyof FriendApplyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="main-shell friends-board friends-board-client xh-reference-surface" aria-label="友链">
      <div className="friends-main-column">
        <div className="friends-toolbar">
          <label className="friend-link-search">
            <span>搜索友链</span>
            <input value={query} placeholder="名称、分类、简介或站长" onChange={(event) => setQuery(event.target.value)} />
          </label>

          <div className="friend-category-tabs" role="tablist" aria-label="友链分类">
            {categories.map((category) => (
              <button
                aria-selected={activeCategory === category}
                className={activeCategory === category ? 'is-active' : ''}
                key={category}
                role="tab"
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="friend-status-strip" aria-label="友链状态">
          <span><strong>{stats.active}</strong>已互链</span>
          <span><strong>{stats.pending}</strong>申请中</span>
          <span><strong>{stats.reciprocal}</strong>有回链</span>
        </div>

        <div className="friends-board-grid" aria-label="友链名录">
          {filteredLinks.map((link, index) => {
            const external = link.url.startsWith('http');
            const status = link.status || 'active';
            return (
              <a
                className="friend-node-card"
                href={link.url}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer noopener' : undefined}
                style={{ '--friend-theme': link.themeColor || `hsl(${(index * 48) % 360} 82% 74%)` } as CSSProperties}
                key={`${link.title}-${index}-card`}
              >
                <span className="friend-avatar">
                  {link.avatar ? <Image src={link.avatar} alt="" width={96} height={96} /> : link.title.slice(0, 1).toUpperCase()}
                </span>
                <span className="friend-card-meta">
                  <small>{link.category || '个人站'}</small>
                  <em>{statusLabels[status]}</em>
                </span>
                <strong>{link.title}</strong>
                {link.owner ? <small>站长：{link.owner}</small> : null}
                <p>{link.description}</p>
                <span className="friend-card-foot">
                  {link.reciprocal ? '已确认回链' : '等待回链确认'}
                  {link.addedAt ? ` / ${link.addedAt}` : ''}
                </span>
              </a>
            );
          })}
        </div>

        {filteredLinks.length === 0 ? <p className="friends-empty">没有匹配的友链。可以换个关键词，或先在右侧提交申请信息。</p> : null}
      </div>

      <aside className="friend-apply-card friend-apply-console">
        <span>Friend Link</span>
        <strong>申请友链</strong>
        <p>这里不会公开写入数据。访客可以生成申请内容，站长确认后再从后台添加到友链列表。</p>
        <pre>{applyFormat}</pre>
        <button type="button" onClick={copyApplyFormat}>{copyStatus}</button>
        <a className="friend-apply-link" href="#gitalk-container">前往留言区申请</a>

        <form className="friend-apply-form" onSubmit={(event) => { event.preventDefault(); copyFriendApply(); }}>
          <label>
            <span>站点名称</span>
            <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
          </label>
          <label>
            <span>站点链接</span>
            <input value={form.url} placeholder="https://example.com" onChange={(event) => updateForm('url', event.target.value)} />
          </label>
          <label>
            <span>一句简介</span>
            <textarea rows={3} value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
          </label>
          <label>
            <span>头像地址</span>
            <input value={form.avatar} placeholder="https://example.com/avatar.png" onChange={(event) => updateForm('avatar', event.target.value)} />
          </label>
          <label>
            <span>回链地址</span>
            <input value={form.reciprocalUrl} placeholder="可选，已添加本站时填写" onChange={(event) => updateForm('reciprocalUrl', event.target.value)} />
          </label>
          <label>
            <span>联系方式</span>
            <input value={form.contact} placeholder="GitHub 用户名或站内留言名" onChange={(event) => updateForm('contact', event.target.value)} />
          </label>
          <button type="submit">{formStatus}</button>
        </form>
      </aside>
    </section>
  );
}

function validateApplyForm(form: FriendApplyForm): string {
  if (!form.title.trim() || !form.description.trim()) {
    return '请填写站点名称和简介';
  }

  try {
    const url = new URL(form.url);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '站点链接必须是 http(s)';
    }
  } catch {
    return '请填写有效站点链接';
  }

  return '';
}

function createFriendApplyText(form: FriendApplyForm, site: BlogSite): string {
  return [
    '友链申请',
    `名称：${form.title.trim()}`,
    `链接：${form.url.trim()}`,
    `简介：${form.description.trim()}`,
    `头像：${form.avatar.trim() || '未提供'}`,
    `回链：${form.reciprocalUrl.trim() || '待确认'}`,
    `联系：${form.contact.trim() || '站内留言'}`,
    '',
    '本站信息',
    site.friendLinkApplyFormat
  ].join('\n');
}
