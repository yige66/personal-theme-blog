'use client';

import Link from 'next/link';
import type { RoomModule } from '@/lib/experience';
import { useTypewriter } from './useTypewriter';

type RoomDialogueProps = {
  activeIndex: number;
  activeModule: RoomModule;
  modules: RoomModule[];
  roomLog: string[];
  windowMode: 'dock' | 'float';
  onStep: (offset: number) => void;
  onPreview: (id: RoomModule['id']) => void;
};

export function RoomDialogue({ activeIndex, activeModule, modules, onPreview, onStep, roomLog, windowMode }: RoomDialogueProps) {
  const typedTour = useTypewriter(activeModule.tour);

  return (
    <div className="xh-room-dialogue">
      <p className="eyebrow">Room Console / {windowMode}</p>
      <h2>把博客做成可以停留的房间</h2>
      <p>
        美术效果以房间、雨雾、灯影、路径和模块热点为骨架；信息排布以门户卡片、音乐面板和移动轮盘为秩序，让文章、相册、动态与电台像房间物件一样可进入。
      </p>
      <div className="xh-room-focus" data-room-kind={activeModule.id} aria-live="polite">
        <small>{activeModule.en} / {activeModule.tone} / {String(activeIndex + 1).padStart(2, '0')}</small>
        <strong>{activeModule.title}</strong>
        <span>{activeModule.detail}</span>
        <em className="xh-room-typewriter">{typedTour}<i aria-hidden="true" /></em>
        <b className="xh-room-coordinate">x{activeModule.routePoint.x} / y{activeModule.routePoint.y}</b>
      </div>
      <div className="xh-room-tour-nav" aria-label="房间导览控制">
        <button type="button" onClick={() => onStep(-1)}>Back</button>
        <span>{activeIndex + 1} / {modules.length}</span>
        <button type="button" onClick={() => onStep(1)}>Next</button>
      </div>
      <div className="xh-room-log" aria-label="房间日志">
        {roomLog.map((item, index) => (
          <span key={item}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            {item}
          </span>
        ))}
      </div>
      <div className="xh-room-actions">
        {modules.map((module) => (
          <Link
            className={module.id === activeModule.id ? 'is-active' : ''}
            href={module.href}
            key={module.id}
            onFocus={() => onPreview(module.id)}
            onMouseEnter={() => onPreview(module.id)}
          >
            <span>{module.title}</span>
            <small>{module.meta}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
