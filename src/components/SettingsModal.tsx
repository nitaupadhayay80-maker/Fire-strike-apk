import React from 'react';
import { GameSettings } from '../types/game';
import { X, Sliders, Volume2, Eye } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none p-4">
      <div className="relative max-w-md w-full bg-slate-950 border border-amber-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-display font-black text-white">GAME SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-5 mt-5">
          {/* Camera View Mode */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">CAMERA PERSPECTIVE</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ ...settings, viewMode: 'tpp' })}
                className={`py-2.5 rounded-xl border font-display font-bold text-xs transition-all cursor-pointer ${
                  settings.viewMode === 'tpp'
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/30'
                }`}
              >
                TPP (THIRD PERSON)
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, viewMode: 'fpp' })}
                className={`py-2.5 rounded-xl border font-display font-bold text-xs transition-all cursor-pointer ${
                  settings.viewMode === 'fpp'
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/30'
                }`}
              >
                FPP (FIRST PERSON)
              </button>
            </div>
          </div>

          {/* Mouse Aim Sensitivity */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span>AIM SENSITIVITY</span>
              <span className="font-bold text-amber-400">
                {Math.round(settings.mouseSensitivity * 1000)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={settings.mouseSensitivity * 1000}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  mouseSensitivity: parseFloat(e.target.value) / 1000,
                })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Sound FX Volume */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>COMBAT AUDIO VOLUME</span>
              </span>
              <span className="font-bold text-cyan-400">
                {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  soundVolume: parseFloat(e.target.value),
                })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Graphics Quality */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">GRAPHICS PRESET</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ ...settings, graphicsQuality: q })}
                  className={`py-2 rounded-xl border text-xs font-mono uppercase transition-all cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/30'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-display font-black text-sm tracking-wider cursor-pointer"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};
