'use client';

import Link from 'next/link';
import { type CSSProperties } from 'react';
import type { RoomModule, RoomStationId } from '@/lib/experience';

type RoomMarkerProps = {
  module: RoomModule;
  active: boolean;
  onPreview: (id: RoomStationId) => void;
};

export function RoomMarker({ active, module, onPreview }: RoomMarkerProps) {
  const style = {
    '--room-x': module.position.x,
    '--room-y': module.position.y
  } as CSSProperties;

  return (
    <Link
      className={`xh-room-node xh-room-marker node-${module.id}${active ? ' is-active' : ''}`}
      href={module.href}
      onFocus={() => onPreview(module.id)}
      onMouseEnter={() => onPreview(module.id)}
      style={style}
    >
      <span className="xh-room-marker-aura" aria-hidden="true" />
      <span className="xh-room-marker-spark" aria-hidden="true" />
      <small>{module.en}</small>
      <strong>{module.cn}</strong>
    </Link>
  );
}
