'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { BlogData, BlogPost, BlogStats } from '@/lib/blog';
import { createRoomModules, roomObstacles, roomTourSteps, roomWalkPolygon, type RoomStationId } from '@/lib/experience';
import {
  createRoomPath,
  parseWalkPolygon,
  type RoomPathNode
} from '@/lib/room-engine';
import { RoomDialogue } from './room/RoomDialogue';
import { RoomAtmosphere } from './room/RoomAtmosphere';
import { RoomMarker } from './room/RoomMarker';
import { RoomWalkMap } from './room/RoomWalkMap';

type RoomConsoleProps = {
  data: BlogData;
  stats: BlogStats;
  featuredPost?: BlogPost;
};

const rainLines = Array.from({ length: 14 }, (_item, index) => ({
  id: `room-rain-${index}`,
  left: `${8 + ((index * 13) % 86)}%`,
  delay: `${index * -0.18}s`,
  duration: `${0.92 + (index % 5) * 0.09}s`
}));

export function RoomConsole({ data, stats, featuredPost }: RoomConsoleProps) {
  const activeTrack = data.site.music[0];
  const latestNote = data.notes[0];
  const [activeRoomId, setActiveRoomId] = useState<RoomStationId>('tea');
  const [avatarPath, setAvatarPath] = useState<RoomPathNode[]>([]);
  const [windowMode, setWindowMode] = useState<'dock' | 'float' | 'mini'>('dock');
  const [mounted, setMounted] = useState(false);

  const modules = useMemo(() => createRoomModules(data, stats, featuredPost), [data, featuredPost, stats]);
  const walkPolygon = useMemo(() => parseWalkPolygon(roomWalkPolygon), []);

  const activeModule = modules.find((module) => module.id === activeRoomId) ?? modules[0];
  const activeIndex = modules.findIndex((module) => module.id === activeModule.id);
  const currentPoint = avatarPath.at(-1) ?? activeModule.routePoint;
  const roomLog = [
    latestNote?.title || '动态记录等待写入',
    featuredPost?.title || '文章书桌等待新稿',
    activeTrack?.title || '电台歌单待补全'
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const setActiveByOffset = (offset: number) => {
    const nextIndex = (activeIndex + offset + modules.length) % modules.length;
    moveToRoom(modules[nextIndex].id);
  };

  const moveToRoom = (roomId: RoomStationId) => {
    const nextModule = modules.find((module) => module.id === roomId);
    if (!nextModule) {
      return;
    }

    const nextPath = createRoomPath(currentPoint, nextModule.routePoint, walkPolygon, roomObstacles);
    setAvatarPath(nextPath);
    setActiveRoomId(roomId);
  };

  if (windowMode === 'mini') {
    return (
      <section className="xh-room-console xh-room-os is-mini" data-motion="portal-card" aria-label="房间迷你窗口">
        <button className="xh-room-mini-button" type="button" onClick={() => setWindowMode('dock')}>
          <span>{activeModule.en}</span>
          <strong>{activeModule.title}</strong>
          <small>Open Room</small>
        </button>
      </section>
    );
  }

  const roomShell = (
    <section className={`xh-room-console xh-room-os is-${windowMode}`} data-motion="portal-card" aria-label="房间式交互控制台">
      <div className="xh-room-os-bar">
        <span />
        <span />
        <span />
        <strong>Room OS</strong>
        <div>
          <button type="button" onClick={() => setWindowMode(windowMode === 'float' ? 'dock' : 'float')}>
            {windowMode === 'float' ? 'Dock' : 'Float'}
          </button>
          <button type="button" onClick={() => setWindowMode('mini')}>Mini</button>
          <button type="button" onClick={() => moveToRoom('tea')}>Reset</button>
        </div>
      </div>
      <div
        className="xh-room-stage"
        data-active-room={activeModule.id}
        style={{
          '--avatar-x': activeModule.station.x,
          '--avatar-y': activeModule.station.y,
          '--walk-poly': `"${roomWalkPolygon}"`
        } as CSSProperties}
      >
        <Image src={data.site.heroImage} alt={`${data.site.title} 房间底色`} width={920} height={560} priority data-motion="image-scale" />
        <RoomAtmosphere />
        <RoomWalkMap activeId={activeModule.id} avatarPath={avatarPath} tourSteps={roomTourSteps} />
        <div className="xh-room-wall" aria-hidden="true" />
        <div className="xh-room-window" aria-hidden="true"><span /></div>
        <div className="xh-room-wardrobe-prop" aria-hidden="true" />
        <div className="xh-room-desk-prop" aria-hidden="true" />
        <div className="xh-room-tea-prop" aria-hidden="true" />
        <div className="xh-room-tarot-prop" aria-hidden="true" />
        <div className="xh-room-bed-prop" aria-hidden="true"><span /></div>
        <div className="xh-room-floor" aria-hidden="true" />
        <div className="xh-room-rainfall" aria-hidden="true">
          {rainLines.map((line) => (
            <i key={line.id} style={{ '--rain-left': line.left, '--rain-delay': line.delay, '--rain-duration': line.duration } as CSSProperties} />
          ))}
        </div>
        <div className="xh-room-mist" aria-hidden="true" />
        <div className="xh-room-avatar">
          <span className="xh-room-avatar-frame">
            <Image src={data.site.avatar} alt={`${data.site.assistantName} 陪伴头像`} width={96} height={96} />
          </span>
          <strong>{data.site.assistantName}</strong>
        </div>
        {modules.map((module) => (
          <RoomMarker
            active={module.id === activeModule.id}
            key={module.id}
            module={module}
            onPreview={moveToRoom}
          />
        ))}
      </div>

      <RoomDialogue
        activeIndex={activeIndex}
        activeModule={activeModule}
        windowMode={windowMode}
        modules={modules}
        onPreview={moveToRoom}
        onStep={setActiveByOffset}
        roomLog={roomLog}
      />
    </section>
  );

  if (windowMode === 'float' && mounted) {
    return createPortal(roomShell, document.body);
  }

  return roomShell;
}
