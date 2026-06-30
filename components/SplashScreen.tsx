'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { BlogSite } from '@/lib/blog';

type SplashScreenProps = {
  site: BlogSite;
};

const SESSION_KEY = 'personal-theme-blog:splash-seen';

const entryHotspots = [
  { id: 'archive', label: '档案柜', hint: '文章与年表', x: '18%', y: '56%' },
  { id: 'music', label: '电台', hint: '云端歌单', x: '80%', y: '58%' },
  { id: 'friends', label: '星图', hint: '友链关系', x: '66%', y: '31%' },
  { id: 'desk', label: '写作桌', hint: '项目与草稿', x: '37%', y: '72%' }
];

const roomObjects = [
  { id: 'moon', x: '13%', y: '24%', label: 'moon console' },
  { id: 'console', x: '27%', y: '71%', label: 'archive terminal' },
  { id: 'crystal', x: '72%', y: '26%', label: 'light prism' },
  { id: 'shelf', x: '83%', y: '70%', label: 'music shelf' },
  { id: 'plant', x: '50%', y: '84%', label: 'floor bloom' }
];

export function SplashScreen({ site }: SplashScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadingLines = useMemo(() => [
    'SCENE READY',
    'DAY / NIGHT LAYER ONLINE',
    'CLICK TO ENTER'
  ], []);

  useEffect(() => {
    setMounted(true);

    const hasSeen = window.sessionStorage.getItem(SESSION_KEY) === 'true';
    if (hasSeen) {
      document.documentElement.classList.add('xh-splash-seen');
      return undefined;
    }

    setVisible(true);
    return undefined;
  }, []);

  const enterBlog = () => {
    setLeaving(true);
    window.sessionStorage.setItem(SESSION_KEY, 'true');
    window.setTimeout(() => {
      document.documentElement.classList.add('xh-splash-seen');
      setVisible(false);
    }, 720);
  };

  if (!mounted || !visible) {
    return null;
  }

  return (
    <div className={`ib-entry-splash${leaving ? ' is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label="星屿手记入口">
      <div className="ib-entry-mist" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <section className="ib-entry-stage" aria-label="可点击的个人博客入口场景">
        <div className="ib-entry-scanlines" aria-hidden="true" />
        <div className="ib-entry-rain" aria-hidden="true">
          {Array.from({ length: 18 }, (_item, index) => <i key={index} />)}
        </div>
        <div className="ib-entry-window" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="ib-entry-room-backdrop" aria-hidden="true">
          <span className="is-left-shelf" />
          <span className="is-center-window" />
          <span className="is-right-terminal" />
          <span className="is-floor-reflection" />
        </div>
        <div className="ib-entry-room-light" aria-hidden="true" />
        <div className="ib-entry-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="ib-entry-room-floor" aria-hidden="true" />
        {roomObjects.map((object) => (
          <span
            className={`ib-entry-object is-${object.id}`}
            style={{ '--object-x': object.x, '--object-y': object.y } as CSSProperties}
            aria-hidden="true"
            key={object.id}
          >
            {object.label}
          </span>
        ))}
        {entryHotspots.map((hotspot) => (
          <button
            className={`ib-entry-hotspot is-${hotspot.id}`}
            type="button"
            style={{ '--entry-x': hotspot.x, '--entry-y': hotspot.y } as CSSProperties}
            onClick={enterBlog}
            key={hotspot.id}
          >
            <strong>{hotspot.label}</strong>
            <small>{hotspot.hint}</small>
          </button>
        ))}
        <aside className="ib-entry-dialogue" aria-label="入口提示">
          <small>BOOT CHANNEL</small>
          <strong>星屿手记已连接</strong>
          <span>选择任意星点或点击主面板进入博客。</span>
        </aside>
        <span className="ib-entry-character" aria-hidden="true">
          <Image src={site.avatar} alt="" width={92} height={92} priority />
        </span>
        <button className="ib-entry-panel" type="button" onClick={enterBlog} aria-label="进入博客">
          <span className="ib-entry-avatar">
            <Image src={site.avatar} alt="" width={112} height={112} priority />
          </span>
          <span className="ib-entry-copy">
            <small>{site.title}</small>
            <strong>{site.owner || site.title}</strong>
            <em>{site.motto}</em>
          </span>
          <span className="ib-entry-progress" aria-hidden="true">
            <i />
          </span>
          <span className="ib-entry-lines" aria-hidden="true">
            {loadingLines.map((line) => <b key={line}>{line}</b>)}
          </span>
          <span className="ib-entry-cta">进入博客</span>
        </button>
      </section>
    </div>
  );
}
