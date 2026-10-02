import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Skull, Crosshair, Clock, Award, RotateCw, Home } from 'lucide-react';

interface GameOverModalProps {
  isWin: boolean;
  kills: number;
  damage: number;
  survivalSeconds: number;
  onPlayAgain: () => void;
  onReturnLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isWin,
  kills,
  damage,
  survivalSeconds,
  onPlayAgain,
  onReturnLobby,
}) => {
  useEffect(() => {
    if (isWin) {
      // Fire victory confetti burst
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#06b6d4', '#ffffff'],
        });
      } catch {
        // Fallback gracefully if confetti fails
      }
    }
  }, [isWin]);

  const minutes = Math.floor(survivalSeconds / 60);
  const seconds = survivalSeconds % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none p-4">
      <div className="relative max-w-md w-full bg-gradient-to-b from-slate-900 to-black border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.3)] text-center">
        {/* Banner Graphic Header */}
        {isWin ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_20px_#f59e0b] mb-2">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-5xl sm:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 animate-booyah tracking-widest drop-shadow-[0_4px_10px_rgba(245,158,11,0.8)]">
              BOOYAH!
            </h2>
            <p className="text-xs font-mono font-bold text-amber-300 mt-1 uppercase tracking-wider">
              #1 / 50 VICTORY ROYALE · BERMUDA CHAMPION
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_20px_#ef4444] mb-2">
              <Skull className="w-8 h-8" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-display font-black text-red-500 tracking-wider">
              ELIMINATED
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
              BETTER LUCK NEXT MATCH
            </p>
          </div>
        )}

        {/* Rank Points Earned */}
        <div className="my-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Award className="w-5 h-5" />
            <span className="font-display font-bold text-sm">RANK SCORE</span>
          </div>
          <span className="font-mono font-bold text-lg text-emerald-400 tabular-nums">
            {isWin ? '+58 PTS ★' : '+15 PTS'}
          </span>
        </div>

        {/* Match Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
            <Skull className="w-4 h-4 text-red-400 mb-1" />
            <div className="text-[10px] font-mono text-slate-400">KILLS</div>
            <div className="font-display font-bold text-lg text-white tabular-nums">{kills}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
            <Crosshair className="w-4 h-4 text-amber-400 mb-1" />
            <div className="text-[10px] font-mono text-slate-400">DAMAGE</div>
            <div className="font-display font-bold text-lg text-white tabular-nums">{damage}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
            <Clock className="w-4 h-4 text-cyan-400 mb-1" />
            <div className="text-[10px] font-mono text-slate-400">SURVIVED</div>
            <div className="font-display font-bold text-lg text-white tabular-nums">{timeFormatted}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          <button
            onClick={onReturnLobby}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>LOBBY</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-display font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
