'use client';

import type { CSSProperties } from 'react';

const dust = Array.from({ length: 16 }, (_item, index) => ({
  id: `room-dust-${index}`,
  left: `${7 + ((index * 19) % 86)}%`,
  top: `${10 + ((index * 23) % 74)}%`,
  delay: `${index * -0.42}s`,
  size: `${3 + (index % 5)}px`
}));

export function RoomAtmosphere() {
  return (
    <div className="xh-room-atmosphere" aria-hidden="true">
      <span className="xh-room-light-beam" />
      <span className="xh-room-prism" />
      <span className="xh-room-projector" />
      <span className="xh-room-scanline" />
      <div className="xh-room-dust-field">
        {dust.map((particle) => (
          <i
            key={particle.id}
            style={{
              '--dust-left': particle.left,
              '--dust-top': particle.top,
              '--dust-delay': particle.delay,
              '--dust-size': particle.size
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
