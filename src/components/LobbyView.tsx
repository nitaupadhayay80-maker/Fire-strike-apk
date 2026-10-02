import React, { useState } from 'react';
import { Character, GameSettings } from '../types/game';
import { CHARACTERS } from '../data/characters';
import { Shield, Sparkles, Volume2, VolumeX, Crosshair, Award, Zap, Play, Settings as SettingsIcon, Layers } from 'lucide-react';

interface LobbyViewProps {
  onStartGame: (character: Character) => void;
  onOpenArmory: () => void;
  onOpenVault: () => void;
  onOpenSettings: () => void;
  settings: GameSettings;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  onStartGame,
  onOpenArmory,
  onOpenVault,
  onOpenSettings,
  onToggleMute,
  isMuted,
}) => {
  const [selectedChar, setSelectedChar] = useState<Character>(CHARACTERS[0]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between bg-black text-white select-none">
      {/* Cinematic High-Tech Hangar Backdrop */}
      <img
        src="/src/assets/images/ff_lobby_backdrop_1790912284794.jpg"
        alt="Free Fire Lobby Staging"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-75 transform scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/80" />

      {/* TOP HEADER: Player Profile, Grandmaster Rank, Diamonds & Gold, Audio */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-amber-500/30 backdrop-blur-md bg-black/40">
        {/* Brand Zone: Single wordmark text */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-display font-black text-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.6)]">
            FF
          </div>
          <div>
            <h1 className="text-xl font-display font-black tracking-wider text-white">
              FIRESTRIKE <span className="text-amber-400">3D</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400">BERMUDA BATTLE ROYALE</p>
          </div>
        </div>

        {/* Currency & Rank Badges */}
        <div className="flex items-center gap-4">
          {/* Grandmaster Rank */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-display font-bold text-xs">GRANDMASTER ★</span>
          </div>

          {/* Diamonds */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
            <span>💎</span>
            <span>9,990</span>
          </div>

          {/* Gold Coins */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-950/60 border border-yellow-500/40 text-yellow-300 font-mono text-xs font-bold">
            <span>🪙</span>
            <span>88,500</span>
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-black/60 border border-white/20 hover:border-amber-400 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-black/60 border border-white/20 hover:border-amber-400 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CENTER AREA: Character Showcase & Skill Info */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-4">
        {/* Left: Character Info Card */}
        <div className="max-w-md w-full bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-amber-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              CHARACTER ROSTER
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              ACTIVE SKILL READY
            </span>
          </div>

          <h2 className="text-3xl font-display font-black text-white mt-1 tracking-wide">
            {selectedChar.name}
          </h2>
          <p className="text-xs font-display text-slate-400">{selectedChar.title}</p>

          {/* Skill description */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="flex items-center gap-2 text-cyan-400 font-display font-bold text-sm">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>SKILL: {selectedChar.skillName}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {selectedChar.skillDesc}
            </p>
            <div className="mt-2 text-[11px] font-mono text-amber-300">
              Perk: {selectedChar.perk}
            </div>
          </div>

          {/* Character Switcher Selector */}
          <div className="mt-5">
            <div className="text-[11px] font-mono text-slate-400 mb-2">SELECT HERO</div>
            <div className="grid grid-cols-4 gap-2">
              {CHARACTERS.map((char) => {
                const isSelected = char.id === selectedChar.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => setSelectedChar(char)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 border-amber-300 text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                        : 'bg-black/60 border-white/15 text-slate-300 hover:border-white/40'
                    }`}
                  >
                    <div className="text-xs font-display truncate">{char.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center/Right: Character Portrait Artwork */}
        <div className="relative flex flex-col items-center mt-4 md:mt-0">
          <div className="relative w-64 md:w-80 h-80 md:h-96 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            <img
              src={selectedChar.avatarUrl}
              alt={selectedChar.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <div className="text-sm font-display font-black text-white">{selectedChar.name}</div>
              <div className="text-xs font-mono text-amber-400">LVL 80 MAX</div>
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM FOOTER: Armory, Match Mode, Start Game Button */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-amber-500/30 backdrop-blur-md bg-black/50 gap-4">
        {/* Left: Armory & Vault buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenVault}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-red-600/30 hover:from-amber-600/50 hover:to-red-600/50 border border-amber-400/60 text-sm font-display font-black text-amber-300 hover:text-white transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>VAULT वॉल्ट</span>
          </button>

          <button
            onClick={onOpenArmory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-600 text-sm font-display font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <Crosshair className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">WEAPON ARMORY</span>
            <span className="sm:hidden">ARMORY</span>
          </button>
        </div>

        {/* Center: Match Mode Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-xl border border-amber-500/40">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-left">
            <div className="text-xs font-display font-black text-white">BERMUDA - BATTLE ROYALE</div>
            <div className="text-[10px] font-mono text-slate-400">CLASSIC SOLO · 50 PLAYERS</div>
          </div>
        </div>

        {/* Right: Big Radiant START MATCH Button */}
        <button
          onClick={() => onStartGame(selectedChar)}
          className="group relative px-10 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:via-orange-400 hover:to-red-500 text-black font-display font-black text-lg tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center gap-3 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-black group-hover:scale-110 transition-transform" />
          <span>START MATCH</span>
        </button>
      </footer>
    </div>
  );
};
