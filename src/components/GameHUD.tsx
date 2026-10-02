import React from 'react';
import { GameController } from '../game/gameController';
import { Minimap } from './Minimap';
import { ScopeOverlay } from './ScopeOverlay';
import { KillFeed } from './KillFeed';
import { DirectionalHitMarkers } from './DirectionalHitMarkers';
import { Crosshair, Shield, Plus, Sparkles, Skull, Users, RotateCw, Car, Fuel, LogOut } from 'lucide-react';

interface GameHUDProps {
  controller: GameController;
  onDeployGloo: () => void;
  onUseMedkit: () => void;
  onActivateSkill: () => void;
  onReload: () => void;
  onSelectSlot: (idx: number) => void;
  onToggleScope: () => void;
  onToggleVehicle?: () => void;
  onShootTouchStart: () => void;
  onShootTouchEnd: () => void;
  onJump: () => void;
  onCrouch: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  controller,
  onDeployGloo,
  onUseMedkit,
  onActivateSkill,
  onReload,
  onSelectSlot,
  onToggleScope,
  onToggleVehicle,
  onShootTouchStart,
  onShootTouchEnd,
  onJump,
  onCrouch,
}) => {
  const { playerStats, aliveCount, playerKills, safeZone, enemies, killFeed, damageNumbers, damageIndicators } = controller;
  const activeWeapon = controller.getActiveWeapon();

  // Zone shrink warning check
  const isOutsideZone = Math.hypot(
    controller.playerPos.x - safeZone.currentCenter.x,
    controller.playerPos.z - safeZone.currentCenter.z
  ) > safeZone.currentRadius;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* Directional Damage Hit Markers */}
      <DirectionalHitMarkers
        indicators={damageIndicators}
        playerPos={controller.playerPos}
        playerYaw={controller.engine.cameraYaw}
      />

      {/* Outside Safe Zone Danger Vignette */}
      {isOutsideZone && (
        <div className="absolute inset-0 border-[16px] border-cyan-500/40 bg-cyan-900/10 animate-pulse pointer-events-none z-10">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600/90 text-white font-display font-bold text-xs uppercase px-4 py-1 rounded shadow-lg border border-red-400">
            Warning: You are outside the Safe Zone!
          </div>
        </div>
      )}

      {/* Scope Overlay when ADS is active */}
      {playerStats.isScoped && activeWeapon && (
        <ScopeOverlay zoomLevel={activeWeapon.scopeZoom || 2} />
      )}

      {/* TOP BAR: Minimap (Left), Alive & Kills (Center), Killfeed (Right) */}
      <div className="absolute top-3 left-4 right-4 flex items-start justify-between pointer-events-auto">
        {/* Left: Tactical Circular Minimap */}
        <div className="flex flex-col items-start">
          <Minimap
            playerPos={controller.playerPos}
            playerYaw={controller.engine.cameraYaw}
            safeZone={safeZone}
            enemies={enemies}
            vehicles={controller.vehicles}
          />
        </div>

        {/* Center: Alive Survivors & Player Kills */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 bg-black/75 backdrop-blur-md px-5 py-1.5 rounded-b-xl border-x border-b border-amber-500/40 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-1.5 text-amber-400 font-display font-bold text-sm tracking-wider">
              <Users className="w-4 h-4 text-amber-400" />
              <span>ALIVE</span>
              <span className="font-mono text-base text-white tabular-nums">{aliveCount}</span>
            </div>
            <div className="w-[1px] h-4 bg-white/20" />
            <div className="flex items-center gap-1.5 text-red-400 font-display font-bold text-sm tracking-wider">
              <Skull className="w-4 h-4 text-red-500" />
              <span>KILLS</span>
              <span className="font-mono text-base text-white tabular-nums">{playerKills}</span>
            </div>
          </div>

          {/* Safe Zone Countdown Badge */}
          <div className="mt-1 px-3 py-0.5 rounded bg-black/50 text-[10px] font-mono text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>SAFE ZONE SHRINKS IN</span>
            <span className="font-bold tabular-nums">
              {Math.max(0, Math.floor(safeZone.shrinkTimer))}s
            </span>
          </div>
        </div>

        {/* Right: Esports Elimination Killfeed */}
        <KillFeed entries={killFeed} />
      </div>

      {/* Floating Damage Numbers in 3D world */}
      {damageNumbers.map((d) => (
        <div
          key={d.id}
          className={`absolute pointer-events-none font-display font-extrabold select-none transition-all ${
            d.isHeadshot
              ? 'text-red-500 text-2xl drop-shadow-[0_0_8px_#ef4444]'
              : 'text-amber-400 text-lg drop-shadow-[0_0_4px_#f59e0b]'
          }`}
          style={{
            left: `${d.screenX ?? 0}px`,
            top: `${d.screenY ?? 0}px`,
            opacity: d.opacity,
            transform: `translate(-50%, -50%) scale(${d.scale})`,
          }}
        >
          {d.isHeadshot ? `HEADSHOT ${d.amount}` : d.amount}
        </div>
      ))}

      {/* Center Dynamic Crosshair (only if not scoped) */}
      {!playerStats.isScoped && (
        <div className="absolute left-1/2 top-1/2 -ml-3 -mt-3 w-6 h-6 flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_4px_#ffffff]" />
          <div className="absolute -top-3 w-[1.5px] h-2 bg-white/80" />
          <div className="absolute -bottom-3 w-[1.5px] h-2 bg-white/80" />
          <div className="absolute -left-3 h-[1.5px] w-2 bg-white/80" />
          <div className="absolute -right-3 h-[1.5px] w-2 bg-white/80" />
        </div>
      )}

      {/* Reloading / Healing Status Ring Progress */}
      {playerStats.isReloading && (
        <div className="absolute left-1/2 top-1/2 mt-8 -translate-x-1/2 bg-black/80 px-4 py-1.5 rounded-full border border-amber-400/50 flex items-center gap-2 text-xs font-mono text-amber-300">
          <RotateCw className="w-3.5 h-3.5 animate-spin" />
          <span>RELOADING...</span>
        </div>
      )}
      {playerStats.isHealing && (
        <div className="absolute left-1/2 top-1/2 mt-8 -translate-x-1/2 bg-emerald-950/90 px-4 py-1.5 rounded-full border border-emerald-400 flex items-center gap-2 text-xs font-mono text-emerald-300">
          <Plus className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>APPLYING MEDKIT... {Math.round(playerStats.healProgress * 100)}%</span>
        </div>
      )}

      {/* BOTTOM LEFT: Quick Actions (Gloo Wall, Medkit, Alok Skill) */}
      <div className="absolute bottom-6 left-6 flex items-end gap-3 pointer-events-auto">
        {/* Gloo Wall Deploy Button (Iconic Free Fire Feature!) */}
        <button
          onClick={onDeployGloo}
          className="relative group w-14 h-14 rounded-2xl bg-cyan-950/80 hover:bg-cyan-900 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer"
          title="Deploy Gloo Wall (G)"
        >
          <Shield className="w-6 h-6 text-cyan-300 group-hover:text-cyan-100" />
          <span className="text-[10px] font-bold text-cyan-200 mt-0.5">GLOO</span>
          <span className="absolute -top-2 -right-2 bg-cyan-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center font-mono">
            {playerStats.glooWalls}
          </span>
          <span className="absolute bottom-0 text-[8px] font-mono text-cyan-400 opacity-60">G</span>
        </button>

        {/* Medkit Heal Button */}
        <button
          onClick={onUseMedkit}
          disabled={playerStats.medkits <= 0 || playerStats.hp >= playerStats.maxHp}
          className="relative group w-14 h-14 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Use First Aid Medkit (4)"
        >
          <Plus className="w-7 h-7 text-emerald-400 group-hover:text-emerald-200" />
          <span className="text-[10px] font-bold text-emerald-200">HEAL</span>
          <span className="absolute -top-2 -right-2 bg-emerald-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center font-mono">
            {playerStats.medkits}
          </span>
          <span className="absolute bottom-0 text-[8px] font-mono text-emerald-400 opacity-60">4</span>
        </button>

        {/* DJ Alok Skill Button */}
        <button
          onClick={onActivateSkill}
          disabled={playerStats.skillCooldownLeft > 0 || playerStats.skillActive}
          className={`relative group w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer ${
            playerStats.skillActive
              ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_25px_#06b6d4] animate-pulse text-black'
              : playerStats.skillCooldownLeft > 0
              ? 'bg-slate-900/80 border-slate-700 text-slate-500 opacity-60'
              : 'bg-amber-950/80 hover:bg-amber-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] text-amber-300'
          }`}
          title="Drop The Beat Skill (Q)"
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-[9px] font-bold">ALOK</span>
          {playerStats.skillCooldownLeft > 0 && (
            <span className="absolute inset-0 bg-black/75 rounded-2xl flex items-center justify-center font-mono text-xs font-bold text-white">
              {Math.ceil(playerStats.skillCooldownLeft)}s
            </span>
          )}
          <span className="absolute bottom-0 text-[8px] font-mono opacity-60">Q</span>
        </button>
      </div>

      {/* BOTTOM CENTER: Health (HP) & EP Bars */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 w-[280px] md:w-[340px] pointer-events-auto">
        {/* Armor & Helmet badges */}
        <div className="flex items-center justify-between w-full text-[11px] font-display font-semibold text-slate-300 px-1">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px]">
              VEST LVL {playerStats.armorLevel}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px]">
              HELMET LVL {playerStats.helmetLevel}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            HP {Math.round(playerStats.hp)} / 200
          </div>
        </div>

        {/* EP Bar (Yellow Energy Points Bar - Free Fire Signature!) */}
        <div className="w-full h-1.5 bg-black/70 rounded-full overflow-hidden border border-yellow-500/30">
          <div
            className="h-full bg-yellow-400 transition-all duration-200"
            style={{ width: `${(playerStats.ep / playerStats.maxEp) * 100}%` }}
          />
        </div>

        {/* HP Bar (White/Red Health Bar) */}
        <div className="w-full h-4 bg-black/80 rounded-md overflow-hidden border border-white/20 p-0.5 relative shadow-inner">
          <div
            className={`h-full rounded-sm transition-all duration-150 ${
              playerStats.hp > 60
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-white'
                : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 animate-pulse'
            }`}
            style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
          />
        </div>
      </div>

      {/* BOTTOM RIGHT: Weapon Slots & Ammo & Firing Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Weapon Slots Selector */}
        <div className="flex items-center gap-2">
          {playerStats.weapons.map((w, idx) => {
            if (!w) return null;
            const isActive = idx === playerStats.activeWeaponIndex;
            return (
              <button
                key={w.id}
                onClick={() => onSelectSlot(idx)}
                className={`flex flex-col items-start px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'bg-black/60 border-white/10 hover:border-white/30 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="font-display font-bold text-xs text-white">{w.name}</span>
                  <span className="text-[9px] font-mono text-amber-300">[{idx + 1}]</span>
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-300">
                  <span className={w.currentAmmo === 0 ? 'text-red-400' : 'text-white'}>
                    {w.currentAmmo}
                  </span>
                  <span className="text-slate-500"> / {w.reserveAmmo}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Reload, Scope, Crouch, Jump, Fire */}
        <div className="flex items-center gap-2">
          {/* Reload Button */}
          <button
            onClick={onReload}
            className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-600 flex flex-col items-center justify-center cursor-pointer active:scale-95"
            title="Reload (R)"
          >
            <RotateCw className="w-5 h-5 text-slate-200" />
            <span className="text-[8px] font-mono text-slate-400">R</span>
          </button>

          {/* Aim / Scope Toggle */}
          <button
            onClick={onToggleScope}
            className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
              playerStats.isScoped
                ? 'bg-amber-500 border-amber-300 text-black shadow-[0_0_15px_#f59e0b]'
                : 'bg-slate-900/80 border-slate-600 text-slate-200 hover:bg-slate-800'
            }`}
            title="Aim / Scope ADS (Right Click / Space)"
          >
            <Crosshair className="w-5 h-5" />
            <span className="text-[8px] font-mono">AIM</span>
          </button>

          {/* Jump Button */}
          <button
            onClick={onJump}
            className="w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-600 flex flex-col items-center justify-center cursor-pointer active:scale-95"
            title="Jump (Space)"
          >
            <span className="text-sm font-bold text-slate-200">▲</span>
            <span className="text-[8px] font-mono text-slate-400">JUMP</span>
          </button>

          {/* Crouch Button */}
          <button
            onClick={onCrouch}
            className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
              playerStats.isCrouching
                ? 'bg-amber-500 border-amber-300 text-black'
                : 'bg-slate-900/80 border-slate-600 text-slate-200 hover:bg-slate-800'
            }`}
            title="Crouch (C)"
          >
            <span className="text-sm font-bold">▼</span>
            <span className="text-[8px] font-mono">CROUCH</span>
          </button>

          {/* Large On-Screen Fire Button (Essential for mobile or direct click!) */}
          <button
            onMouseDown={onShootTouchStart}
            onMouseUp={onShootTouchEnd}
            onTouchStart={onShootTouchStart}
            onTouchEnd={onShootTouchEnd}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-red-500 hover:from-amber-500 hover:to-red-400 border-2 border-amber-300 shadow-[0_0_20px_rgba(239,68,68,0.6)] flex flex-col items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
          >
            <span className="font-display font-black text-sm tracking-wider">FIRE</span>
            <span className="text-[8px] font-mono opacity-80">SHOOT</span>
          </button>
        </div>
      </div>

      {/* Nearby Vehicle Enter Prompt */}
      {controller.nearbyVehicleId && !playerStats.inVehicle && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            onClick={onToggleVehicle}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-display font-black text-sm tracking-wider flex items-center gap-3 border-2 border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.8)] cursor-pointer active:scale-95 animate-pulse"
          >
            <Car className="w-5 h-5 text-white" />
            <span>[F] DRIVE VEHICLE</span>
          </button>
        </div>
      )}

      {/* Vehicle In-Car Telemetry Dashboard (Active when Driving) */}
      {playerStats.inVehicle && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2">
          {/* Speedometer & Stats Card */}
          <div className="bg-slate-950/90 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(0,0,0,0.85)] flex items-center gap-6">
            {/* Speedometer */}
            <div className="flex flex-col items-center min-w-[70px]">
              <div className="text-3xl font-display font-black text-cyan-300 tabular-nums drop-shadow-[0_0_8px_#06b6d4]">
                {playerStats.vehicleSpeed || 0}
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-400">KM/H</div>
            </div>

            <div className="w-[1px] h-10 bg-white/20" />

            {/* Vehicle Health & Fuel */}
            <div className="flex flex-col gap-1.5 w-36">
              {/* Armor / HP */}
              <div>
                <div className="flex justify-between text-[9px] font-mono font-bold text-slate-300">
                  <span className="flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-emerald-400" />
                    VEHICLE ARMOR
                  </span>
                  <span className="text-emerald-300">
                    {playerStats.vehicleHp}/{playerStats.vehicleMaxHp}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, ((playerStats.vehicleHp || 0) / (playerStats.vehicleMaxHp || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Fuel */}
              <div>
                <div className="flex justify-between text-[9px] font-mono font-bold text-slate-300">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-2.5 h-2.5 text-amber-400" />
                    NITRO FUEL
                  </span>
                  <span className="text-amber-300">{playerStats.vehicleFuel || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all"
                    style={{ width: `${Math.max(0, playerStats.vehicleFuel || 0)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="w-[1px] h-10 bg-white/20" />

            {/* Exit Vehicle Button */}
            <button
              onClick={onToggleVehicle}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-display font-black text-xs tracking-wider border border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)] cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>[F] EXIT</span>
            </button>
          </div>

          {/* Driving Controls Bar */}
          <div className="text-[10px] font-mono text-slate-300 bg-black/75 px-4 py-1 rounded-full border border-white/15 flex items-center gap-3">
            <span>[W] ACCELERATE</span>
            <span>•</span>
            <span>[S] REVERSE</span>
            <span>•</span>
            <span>[A/D] STEER</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">[SHIFT] NITRO BOOST</span>
            <span>•</span>
            <span className="text-cyan-300 font-bold">[SPACE] HANDBRAKE</span>
          </div>
        </div>
      )}

      {/* Discreet Desktop Controls Guide (Bottom Left Sub-Bar) */}
      <div className="absolute bottom-2 left-6 text-[10px] font-mono text-slate-400/80 pointer-events-none hidden md:block">
        WASD: Move/Drive · F: Enter/Exit Vehicle · Mouse: Aim · Left-Click: Fire · Right-Click: Scope · Space: Jump/Handbrake · C: Crouch · R: Reload · G: Gloo Wall · Q: Skill
      </div>
    </div>
  );
};
