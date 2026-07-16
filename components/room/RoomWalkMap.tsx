'use client';

import type { RoomStation } from '@/lib/experience';
import { roomObstacles, roomWalkPolygon } from '@/lib/experience';
import { buildPathPolyline, createObstacleOverlay, parseWalkPolygon, toSvgPoints, type RoomPathNode } from '@/lib/room-engine';

type RoomWalkMapProps = {
  activeId: RoomStation['id'];
  tourSteps: Array<{
    id: RoomStation['id'];
    point: {
      x: number;
      y: number;
    };
  }>;
  avatarPath: RoomPathNode[];
};

const walkPolygon = parseWalkPolygon(roomWalkPolygon);
const obstacleOverlay = createObstacleOverlay(roomObstacles);

export function RoomWalkMap({ activeId, avatarPath, tourSteps }: RoomWalkMapProps) {
  const avatarTrail = buildPathPolyline(avatarPath);

  return (
    <>
      <svg className="xh-room-walk-map" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <polygon points={toSvgPoints(walkPolygon)} />
        <polyline points={tourSteps.map((step) => `${step.point.x},${step.point.y}`).join(' ')} />
        {avatarTrail ? <polyline className="xh-room-avatar-trail" points={avatarTrail} /> : null}
        {tourSteps.map((step) => (
          <circle
            className={step.id === activeId ? 'is-active' : undefined}
            cx={step.point.x}
            cy={step.point.y}
            r={step.id === activeId ? '2.2' : '1.3'}
            key={step.id}
          />
        ))}
      </svg>
      <div className="xh-room-obstacle-layer" aria-hidden="true">
        {obstacleOverlay.map((obstacle) => (
          <i key={obstacle.id} title={obstacle.label} style={obstacle.style} />
        ))}
      </div>
    </>
  );
}
