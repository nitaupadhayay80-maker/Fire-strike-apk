import React from 'react';
import { DamageIndicator } from '../types/game';

interface DirectionalHitMarkersProps {
  indicators: DamageIndicator[];
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
}

export const DirectionalHitMarkers: React.FC<DirectionalHitMarkersProps> = ({
  indicators,
  playerPos,
  playerYaw,
}) => {
  if (indicators.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex items-center justify-center overflow-hidden">
      {/* Subtle peripheral red damage flash on screen edges */}
      <div
        className="absolute inset-0 border-8 sm:border-[16px] border-red-600/35 bg-radial from-transparent via-red-950/10 to-red-900/30 transition-opacity duration-150 pointer-events-none"
        style={{
          opacity: Math.min(1, indicators.reduce((acc, curr) => acc + curr.opacity, 0) * 0.7),
        }}
      />

      {/* Directional Hit Indicator Arcs around Crosshair */}
      <div className="relative w-[300px] h-[300px] flex items-center justify-center">
        {indicators.map((ind) => {
          // Calculate angle from player to attacker
          const dx = ind.attackerPos.x - playerPos.x;
          const dz = ind.attackerPos.z - playerPos.z;

          // World angle from player to attacker relative to forward (+Z axis)
          const worldAngle = Math.atan2(dx, dz);

          // Relative angle between camera forward and attacker
          let relAngle = worldAngle - playerYaw;

          // Convert to degrees: 0° is top (forward), 90° is right, 180° is bottom, -90° is left
          const deg = relAngle * (180 / Math.PI);

          return (
            <div
              key={ind.id}
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
              style={{
                transform: `rotate(${deg}deg)`,
                opacity: ind.opacity,
              }}
            >
              {/* Top Curved Red Arc / Damage Wedge */}
              <div className="absolute top-4 flex flex-col items-center">
                {/* Outward pointing directional chevron */}
                <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[14px] border-b-red-500 drop-shadow-[0_0_8px_#ef4444]" />

                {/* Curved tactical damage arc */}
                <svg
                  width="120"
                  height="40"
                  viewBox="0 0 120 40"
                  className="overflow-visible -mt-1 drop-shadow-[0_0_12px_rgba(239,68,68,0.85)]"
                >
                  <defs>
                    <linearGradient id={`dmg_grad_${ind.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                      <stop offset="25%" stopColor="#ef4444" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#f43f5e" stopOpacity="1" />
                      <stop offset="75%" stopColor="#ef4444" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Thick curved arc */}
                  <path
                    d="M 10 32 A 65 65 0 0 1 110 32"
                    fill="none"
                    stroke={`url(#dmg_grad_${ind.id})`}
                    strokeWidth="6.5"
                    strokeLinecap="round"
                  />
                  {/* Inner accent hairline */}
                  <path
                    d="M 25 36 A 60 60 0 0 1 95 36"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
