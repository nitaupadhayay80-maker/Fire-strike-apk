import React, { useState } from 'react';
import { WEAPON_REGISTRY } from '../data/weapons';
import { WeaponData, WeaponType } from '../types/game';
import { X, Crosshair, Zap, Shield, Target } from 'lucide-react';

interface ArmoryModalProps {
  onClose: () => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({ onClose }) => {
  const weapons = Object.values(WEAPON_REGISTRY);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponData>(weapons[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none p-4">
      <div className="relative max-w-2xl w-full bg-slate-950 border border-amber-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-display font-black text-white">WEAPON ARMORY</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Weapons List & Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 flex-1 overflow-y-auto">
          {/* Left Column: Weapon List Tabs */}
          <div className="flex flex-col gap-2">
            {weapons.map((w) => {
              const isSelected = w.id === selectedWeapon.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWeapon(w)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/30'
                  }`}
                >
                  <div>
                    <div className="font-display font-bold text-sm">{w.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{w.category}</div>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: w.color }}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Weapon Detailed Stats */}
          <div className="md:col-span-2 bg-black/60 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">
                  {selectedWeapon.category} CLASS
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  HEADSHOT x{selectedWeapon.headshotMultiplier}
                </span>
              </div>
              <h3 className="text-3xl font-display font-black text-white mt-1">
                {selectedWeapon.name}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {selectedWeapon.description}
              </p>

              {/* Stat Bars */}
              <div className="space-y-3 mt-6">
                {/* Damage */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>DAMAGE</span>
                    <span className="font-bold text-amber-400">{selectedWeapon.damage}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${Math.min(100, (selectedWeapon.damage / 150) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Rate of Fire */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>RATE OF FIRE</span>
                    <span className="font-bold text-cyan-400">{selectedWeapon.fireRate} rps</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${Math.min(100, (selectedWeapon.fireRate / 16) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Range */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>EFFECTIVE RANGE</span>
                    <span className="font-bold text-emerald-400">{selectedWeapon.range}m</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${Math.min(100, (selectedWeapon.range / 220) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Magazine */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>MAGAZINE CAPACITY</span>
                    <span className="font-bold text-purple-400">{selectedWeapon.magazineSize} rounds</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400"
                      style={{ width: `${Math.min(100, (selectedWeapon.magazineSize / 35) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Reload Time: {selectedWeapon.reloadTime}s</span>
              <span>Scope: {selectedWeapon.scopeZoom}x ADS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
