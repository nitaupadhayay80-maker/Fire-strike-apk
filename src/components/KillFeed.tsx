import React, { useState, useEffect } from 'react';
import { KillFeedEntry } from '../types/game';
import { Skull, Target, Zap, Award, Flame, Crosshair, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KillFeedProps {
  entries: KillFeedEntry[];
}

export const KillFeed: React.FC<KillFeedProps> = ({ entries }) => {
  // Active temporary list that expires each notification after 5.0 seconds
  const [activeEntries, setActiveEntries] = useState<KillFeedEntry[]>([]);

  useEffect(() => {
    const now = Date.now();
    // Keep entries newer than 5000ms, up to 5 concurrent
    const fresh = entries.filter((e) => now - e.timestamp < 5000);
    setActiveEntries(fresh.slice(0, 5));

    const interval = setInterval(() => {
      const current = Date.now();
      setActiveEntries((prev) => prev.filter((e) => current - e.timestamp < 5000));
    }, 400);

    return () => clearInterval(interval);
  }, [entries]);

  // Weapon category styling & icon helper
  const getWeaponDetails = (weaponName: string) => {
    const w = weaponName.toUpperCase();
    if (w.includes('AWM') || w.includes('SNIPER')) {
      return {
        badgeStyle: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/50',
        icon: '🎯',
        category: 'SNIPER',
      };
    }
    if (w.includes('MP40') || w.includes('SMG')) {
      return {
        badgeStyle: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/50',
        icon: '⚡',
        category: 'SMG',
      };
    }
    if (w.includes('M1887') || w.includes('SHOTGUN')) {
      return {
        badgeStyle: 'text-rose-300 bg-rose-950/80 border-rose-500/50',
        icon: '💥',
        category: 'SG',
      };
    }
    if (w.includes('PAN') || w.includes('MELEE')) {
      return {
        badgeStyle: 'text-amber-200 bg-amber-950/80 border-amber-500/50',
        icon: '🍳',
        category: 'MELEE',
      };
    }
    return {
      badgeStyle: 'text-orange-300 bg-orange-950/80 border-orange-500/50',
      icon: '🔫',
      category: 'AR',
    };
  };

  return (
    <div className="flex flex-col items-end gap-1.5 w-full max-w-[340px] pointer-events-none select-none z-30">
      <AnimatePresence initial={false}>
        {activeEntries.map((entry) => {
          const isPlayerKiller = entry.isPlayerKill;
          const isPlayerVictim = entry.isPlayerVictim || entry.victim.toUpperCase() === 'YOU';
          const weapon = getWeaponDetails(entry.weapon);

          // 1. PLAYER GOT THE KILL (Golden/Amber Victory Banner)
          if (isPlayerKiller) {
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 60, scale: 0.88 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-950/95 via-black/90 to-black/95 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] px-3 py-1.5 min-w-[240px]"
              >
                {/* Top esports event header */}
                <div className="flex items-center justify-between text-[9px] font-display font-black tracking-wider text-amber-300 pb-1 border-b border-amber-500/30 mb-1">
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>ELIMINATION CONFIRMED</span>
                  </div>
                  {entry.isHeadshot && (
                    <span className="text-red-400 font-bold font-mono flex items-center gap-0.5">
                      <Target className="w-2.5 h-2.5" />
                      HEADSHOT!
                    </span>
                  )}
                </div>

                {/* Main Kill Row */}
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  {/* Killer (Player) */}
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                    <span className="font-display font-black text-amber-300 text-sm tracking-wide drop-shadow-[0_0_8px_#f59e0b]">
                      YOU
                    </span>
                  </div>

                  {/* Weapon Silhouette */}
                  <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-black/70 border border-amber-500/40">
                    <span className="text-[10px]">{weapon.icon}</span>
                    <span className="font-bold text-[11px] text-amber-200">{entry.weapon}</span>
                  </div>

                  {/* Victim */}
                  <div className="text-right truncate max-w-[85px]">
                    <span className="text-red-300 font-semibold line-through decoration-red-500/80">
                      {entry.victim}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          }

          // 2. PLAYER WAS ELIMINATED (Crimson/Red Alert Banner)
          if (isPlayerVictim) {
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 60, scale: 0.88 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-950/95 via-black/90 to-black/95 border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)] px-3 py-1.5 min-w-[240px]"
              >
                {/* Danger ribbon */}
                <div className="flex items-center justify-between text-[9px] font-display font-black tracking-wider text-red-400 pb-1 border-b border-red-500/30 mb-1">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-400 animate-pulse" />
                    <span>YOU WERE ELIMINATED</span>
                  </div>
                  <span className="font-mono text-slate-400">COMBAT FATALITY</span>
                </div>

                {/* Kill Row */}
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="font-semibold text-red-300 truncate max-w-[90px]">
                    {entry.killer}
                  </span>

                  <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-black/70 border border-red-500/40">
                    <span className="text-[10px]">{weapon.icon}</span>
                    <span className="font-bold text-[11px] text-red-200">{entry.weapon}</span>
                  </div>

                  <span className="font-display font-black text-red-400 text-sm drop-shadow-[0_0_8px_#ef4444]">
                    YOU
                  </span>
                </div>
              </motion.div>
            );
          }

          // 3. NEUTRAL WORLD ELIMINATION (Sleek Dark Esports Cards)
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: 40, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 25, scale: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-lg bg-black/80 backdrop-blur-md border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.6)] px-2.5 py-1 min-w-[210px] border-l-[3px] border-l-cyan-500/80"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                {/* Killer */}
                <span className="font-semibold text-slate-200 truncate max-w-[80px]">
                  {entry.killer}
                </span>

                {/* Weapon Category Badge */}
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${weapon.badgeStyle} flex items-center gap-1`}
                  >
                    <span>{weapon.icon}</span>
                    <span className="tracking-tight">{entry.weapon}</span>
                  </span>

                  {entry.isHeadshot && (
                    <span
                      className="w-3.5 h-3.5 rounded bg-red-600/90 flex items-center justify-center text-white"
                      title="Headshot"
                    >
                      <Skull className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Victim */}
                <span className="text-slate-400 truncate max-w-[80px] text-right">
                  {entry.victim}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
