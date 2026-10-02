import React, { useState, useMemo } from 'react';
import { SafeZoneState, EnemyBot, Vehicle } from '../types/game';
import { ZoomIn, ZoomOut, Maximize2, Compass, AlertTriangle, Package, Car } from 'lucide-react';

interface MinimapProps {
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
  safeZone: SafeZoneState;
  enemies: EnemyBot[];
  vehicles?: Vehicle[];
  onOpenMap?: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  playerPos,
  playerYaw,
  safeZone,
  enemies,
  vehicles = [],
  onOpenMap,
}) => {
  // Zoom mode: 1 = Close quarters (~80m range), 0.55 = Standard tactical (~150m range)
  const [zoomLevel, setZoomLevel] = useState<number>(0.65);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Radar dimensions
  const mapSize = isExpanded ? 240 : 140;
  const mapRadius = mapSize / 2;

  // Degrees calculation from yaw: 0 is North, 90 is East, etc.
  const degrees = useMemo(() => {
    let deg = Math.round((-playerYaw * (180 / Math.PI)) % 360);
    if (deg < 0) deg += 360;
    return deg;
  }, [playerYaw]);

  const compassHeading = useMemo(() => {
    if (degrees >= 337.5 || degrees < 22.5) return 'N';
    if (degrees >= 22.5 && degrees < 67.5) return 'NE';
    if (degrees >= 67.5 && degrees < 112.5) return 'E';
    if (degrees >= 112.5 && degrees < 157.5) return 'SE';
    if (degrees >= 157.5 && degrees < 202.5) return 'S';
    if (degrees >= 202.5 && degrees < 247.5) return 'SW';
    if (degrees >= 247.5 && degrees < 292.5) return 'W';
    return 'NW';
  }, [degrees]);

  // Convert world coordinate (X, Z) into Radar local (pixelX, pixelY)
  const toMapCoords = (worldX: number, worldZ: number) => {
    const scale = zoomLevel;
    const dx = (worldX - playerPos.x) * scale;
    const dz = (worldZ - playerPos.z) * scale;
    return {
      x: mapRadius + dx,
      y: mapRadius + dz,
      distance: Math.hypot(worldX - playerPos.x, worldZ - playerPos.z),
    };
  };

  // Safe zone centers
  const currentZone = toMapCoords(safeZone.currentCenter.x, safeZone.currentCenter.z);
  const currentRadiusPx = safeZone.currentRadius * zoomLevel;

  const targetZone = toMapCoords(safeZone.targetCenter.x, safeZone.targetCenter.z);
  const targetRadiusPx = safeZone.targetRadius * zoomLevel;

  // Player distance to safe zone border
  const distFromCenter = Math.hypot(
    playerPos.x - safeZone.currentCenter.x,
    playerPos.z - safeZone.currentCenter.z
  );
  const isOutsideSafeZone = distFromCenter > safeZone.currentRadius;
  const distToSafeZoneBorder = Math.abs(safeZone.currentRadius - distFromCenter);

  // Landmarks in Bermuda
  const landmarks = [
    { name: 'CLOCK TOWER', x: 0, z: 20 },
    { name: 'FACTORY', x: -75, z: -55 },
    { name: 'WAREHOUSE', x: 65, z: -40 },
    { name: 'AIRDROP', x: -20, z: -15, isAirdrop: true },
  ];

  return (
    <div className="flex flex-col items-start gap-1 select-none pointer-events-auto">
      {/* Compass Heading & Degree Readout Ribbon */}
      <div className="flex items-center justify-between w-full max-w-[140px] px-1 text-[10px] font-mono text-amber-400 font-bold tracking-wider">
        <div className="flex items-center gap-1">
          <Compass className="w-3 h-3 text-amber-400" />
          <span>{degrees}°</span>
          <span className="text-white bg-black/60 px-1 rounded">{compassHeading}</span>
        </div>
        {isOutsideSafeZone ? (
          <span className="text-red-400 animate-pulse font-extrabold flex items-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5" />
            {Math.round(distToSafeZoneBorder)}m
          </span>
        ) : (
          <span className="text-cyan-300 font-mono text-[9px]">
            ZONE: {Math.round(safeZone.currentRadius)}m
          </span>
        )}
      </div>

      {/* Circular Radar Body */}
      <div
        style={{ width: `${mapSize}px`, height: `${mapSize}px` }}
        className="relative rounded-full overflow-hidden border-2 border-amber-500/80 shadow-[0_0_20px_rgba(0,0,0,0.85)] bg-slate-950 transition-all duration-300"
      >
        {/* Tactical Satellite Map Image */}
        <img
          src="/src/assets/images/ff_island_minimap_1790912300143.jpg"
          alt="Tactical Bermuda Map"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-65"
          style={{
            transform: `translate(${-playerPos.x * 0.18 * zoomLevel}px, ${-playerPos.z * 0.18 * zoomLevel}px) scale(${1.6 * (zoomLevel / 0.65)})`,
          }}
        />

        {/* Sonar sweep & Grid concentric circles */}
        <div className="absolute inset-0 rounded-full border border-emerald-500/25 pointer-events-none" />
        <div className="absolute inset-[25%] rounded-full border border-emerald-500/20 pointer-events-none" />
        <div className="absolute inset-[50%] rounded-full border border-emerald-500/20 pointer-events-none" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-emerald-500/15 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500/15 pointer-events-none" />

        {/* 1. Next Target Safe Zone (Dotted White/Cyan circle) */}
        <div
          className="absolute rounded-full border-2 border-dashed border-white/60 pointer-events-none transition-all duration-500"
          style={{
            left: `${targetZone.x - targetRadiusPx}px`,
            top: `${targetZone.y - targetRadiusPx}px`,
            width: `${targetRadiusPx * 2}px`,
            height: `${targetRadiusPx * 2}px`,
          }}
        />

        {/* 2. Current Safe Zone (Glowing Electric Blue Solid circle) */}
        <div
          className="absolute rounded-full border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_12px_rgba(6,182,212,0.6)] pointer-events-none transition-all duration-300"
          style={{
            left: `${currentZone.x - currentRadiusPx}px`,
            top: `${currentZone.y - currentRadiusPx}px`,
            width: `${currentRadiusPx * 2}px`,
            height: `${currentRadiusPx * 2}px`,
          }}
        />

        {/* 3. Tactical Landmarks / Airdrop markers */}
        {landmarks.map((poi, idx) => {
          const coords = toMapCoords(poi.x, poi.z);
          const dist = Math.hypot(coords.x - mapRadius, coords.y - mapRadius);
          if (dist > mapRadius - 8) return null;

          return (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
              style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
            >
              {poi.isAirdrop ? (
                <div className="flex items-center gap-1 bg-red-600/90 text-white text-[8px] font-bold px-1 rounded shadow animate-bounce">
                  <Package className="w-2.5 h-2.5 text-amber-300" />
                  <span>DROP</span>
                </div>
              ) : (
                <span className="text-[7px] font-mono font-bold text-slate-300 bg-black/70 px-1 rounded whitespace-nowrap border border-white/10">
                  {poi.name}
                </span>
              )}
            </div>
          );
        })}

        {/* Vehicles on radar */}
        {vehicles.map((v) => {
          const coords = toMapCoords(v.position.x, v.position.z);
          const dist = Math.hypot(coords.x - mapRadius, coords.y - mapRadius);
          if (dist > mapRadius - 6) return null;

          return (
            <div
              key={v.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
              style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
              title={v.name}
            >
              <div className="w-3.5 h-3.5 rounded bg-cyan-600/90 text-white flex items-center justify-center shadow-[0_0_6px_#06b6d4] border border-cyan-300">
                <Car className="w-2 h-2" />
              </div>
            </div>
          );
        })}

        {/* 4. Nearby Enemies & Perimeter Threat Arrows */}
        {enemies
          .filter((e) => e.isAlive)
          .map((enemy) => {
            const coords = toMapCoords(enemy.position.x, enemy.position.z);
            const distFromCenterPx = Math.hypot(coords.x - mapRadius, coords.y - mapRadius);
            const isInsideRadar = distFromCenterPx <= mapRadius - 6;

            if (isInsideRadar) {
              // Enemy within radar radius
              return (
                <div
                  key={enemy.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                  style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
                >
                  {/* Gunshot ping pulse if actively attacking */}
                  {enemy.state === 'attack' && (
                    <div className="absolute w-5 h-5 rounded-full bg-red-500/40 animate-ping" />
                  )}
                  {/* Combat red blip */}
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-[0_0_8px_#ef4444]" />
                </div>
              );
            } else {
              // Off-screen threat arrow along perimeter
              const angle = Math.atan2(coords.y - mapRadius, coords.x - mapRadius);
              const rimX = mapRadius + Math.cos(angle) * (mapRadius - 8);
              const rimY = mapRadius + Math.sin(angle) * (mapRadius - 8);

              return (
                <div
                  key={`rim_${enemy.id}`}
                  className="absolute pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${rimX}px`, top: `${rimY}px` }}
                >
                  <div
                    className="w-2.5 h-2.5 border-t-2 border-r-2 border-red-500 shadow-[0_0_6px_#ef4444]"
                    style={{
                      transform: `rotate(${angle * (180 / Math.PI) + 45}deg)`,
                    }}
                  />
                </div>
              );
            }
          })}

        {/* 5. Player Vision Cone (Line of Sight FOV) */}
        <div
          className="absolute left-1/2 top-1/2 -ml-8 -mt-16 w-16 h-16 pointer-events-none"
          style={{
            transform: `rotate(${playerYaw * (180 / Math.PI) + 180}deg)`,
            transformOrigin: '50% 100%',
          }}
        >
          <div
            className="w-full h-full opacity-35"
            style={{
              background: 'radial-gradient(ellipse at bottom, rgba(245, 158, 11, 0.7) 0%, transparent 70%)',
              clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
            }}
          />
        </div>

        {/* 6. Center Player Tactical Marker (Amber Chevron) */}
        <div className="absolute left-1/2 top-1/2 -ml-2 -mt-2 w-4 h-4 flex items-center justify-center pointer-events-none">
          <div
            className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[11px] border-b-amber-400 drop-shadow-[0_0_6px_#f59e0b]"
            style={{
              transform: `rotate(${playerYaw * (180 / Math.PI) + 180}deg)`,
            }}
          />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
        </div>

        {/* Compass Cardinal Marks on Rim */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-black font-mono text-amber-300 drop-shadow pointer-events-none">
          N
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black font-mono text-slate-400 drop-shadow pointer-events-none">
          S
        </div>
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black font-mono text-slate-400 drop-shadow pointer-events-none">
          E
        </div>
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black font-mono text-slate-400 drop-shadow pointer-events-none">
          W
        </div>
      </div>

      {/* Tactical Radar Control Bar (+ / - Zoom and Expand) */}
      <div className="flex items-center gap-1 mt-0.5">
        <button
          onClick={() => setZoomLevel((z) => Math.min(1.2, z + 0.25))}
          className="p-1 rounded bg-black/70 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Zoom In Radar"
        >
          <ZoomIn className="w-3 h-3" />
        </button>

        <button
          onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.25))}
          className="p-1 rounded bg-black/70 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Zoom Out Radar"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <button
          onClick={() => setIsExpanded((exp) => !exp)}
          className={`p-1 rounded border transition-colors cursor-pointer ${
            isExpanded
              ? 'bg-amber-500 border-amber-300 text-black'
              : 'bg-black/70 hover:bg-slate-800 border-white/10 text-slate-300 hover:text-white'
          }`}
          title="Toggle Expanded Radar"
        >
          <Maximize2 className="w-3 h-3" />
        </button>

        <div className="text-[9px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
          {zoomLevel > 0.8 ? 'CLOSE' : zoomLevel < 0.5 ? 'WIDE' : 'TACTICAL'}
        </div>
      </div>
    </div>
  );
};
