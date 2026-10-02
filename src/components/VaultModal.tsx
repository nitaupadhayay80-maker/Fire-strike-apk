import React, { useState } from 'react';
import { VaultItem, VaultCategory, ItemRarity } from '../types/vault';
import { X, Sparkles, Check, Shield, Flame, Zap, Award, Layers } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface VaultModalProps {
  items: VaultItem[];
  onEquipItem: (item: VaultItem) => void;
  onClose: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  items,
  onEquipItem,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<VaultCategory>('bundles');
  const filteredItems = items.filter((i) => i.category === activeCategory);
  const [selectedItem, setSelectedItem] = useState<VaultItem>(filteredItems[0] || items[0]);

  // Rarity styling helper
  const getRarityBadge = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'mythic':
        return {
          text: 'MYTHIC EVO',
          color: 'text-red-400 bg-red-950/80 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
          glow: 'from-red-600/30 via-red-900/10 to-transparent',
        };
      case 'legendary':
        return {
          text: 'LEGENDARY',
          color: 'text-amber-400 bg-amber-950/80 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
          glow: 'from-amber-600/30 via-amber-900/10 to-transparent',
        };
      case 'epic':
        return {
          text: 'EPIC',
          color: 'text-purple-400 bg-purple-950/80 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
          glow: 'from-purple-600/30 via-purple-900/10 to-transparent',
        };
      case 'rare':
        return {
          text: 'RARE',
          color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]',
          glow: 'from-cyan-600/30 via-cyan-900/10 to-transparent',
        };
    }
  };

  const handleSelectCategory = (cat: VaultCategory) => {
    setActiveCategory(cat);
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) {
      setSelectedItem(catItems[0]);
    }
  };

  const handleEquip = (item: VaultItem) => {
    onEquipItem(item);
    soundManager.playAlokSkill(); // Triumphant equip chime
  };

  const rarityMeta = getRarityBadge(selectedItem.rarity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none p-3 sm:p-5">
      <div className="relative max-w-4xl w-full bg-slate-950 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Layers className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black tracking-wider text-white">
                SURVIVOR VAULT <span className="text-amber-400">वॉल्ट</span>
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                OUTFIT BUNDLES · EVO WEAPON SKINS · GLOO WALLS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-xs font-mono">
              <span className="text-cyan-400">💎 9,990</span>
              <span className="text-white/20">|</span>
              <span className="text-yellow-400">🪙 88,500</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-white/10 overflow-x-auto">
          {[
            { id: 'bundles', label: 'BUNDLES & SUITS', icon: '🦹' },
            { id: 'weapons', label: 'EVO WEAPON SKINS', icon: '🔫' },
            { id: 'gloowall', label: 'GLOO WALL SKINS', icon: '🛡️' },
            { id: 'backpacks', label: 'BACKPACKS & CRATES', icon: '🎒' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id as VaultCategory)}
                className={`px-4 py-2 rounded-xl border text-xs font-display font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 border-amber-300 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/30'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content: Grid on Left, Showcase Details on Right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 flex-1 overflow-hidden">
          {/* Items Grid List */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 max-h-[50vh] md:max-h-[55vh]">
            {filteredItems.map((item) => {
              const isSelected = item.id === selectedItem.id;
              const badge = getRarityBadge(item.rarity);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/20 to-black/80 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'bg-black/50 border-white/10 hover:border-white/30'
                  }`}
                >
                  {/* Equipped Ribbon Flag */}
                  {item.isEquipped && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-black font-display font-black text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <Check className="w-2.5 h-2.5" />
                      EQUIPPED
                    </div>
                  )}

                  {/* Icon & Color Aura */}
                  <div className="relative w-full h-24 rounded-xl overflow-hidden flex items-center justify-center my-1 bg-slate-900/60 border border-white/5">
                    <div
                      className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity"
                      style={{
                        background: `radial-gradient(circle at center, ${item.previewColor} 0%, transparent 70%)`,
                      }}
                    />
                    <span className="text-4xl relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                      {item.icon}
                    </span>
                  </div>

                  {/* Name and Rarity */}
                  <div>
                    <span
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                    <h4 className="text-xs font-display font-bold text-white mt-1 truncate">
                      {item.name}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Showcase Preview Panel */}
          <div className="bg-black/70 rounded-2xl p-5 border border-white/15 flex flex-col justify-between relative overflow-hidden">
            {/* Background Glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${rarityMeta.glow} pointer-events-none`}
            />

            <div className="relative z-10">
              {/* Item Showcase Visual */}
              <div className="w-full h-36 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden bg-slate-900/80 mb-4 shadow-inner">
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: `radial-gradient(circle at center, ${selectedItem.previewColor} 0%, transparent 65%)`,
                  }}
                />
                <span className="text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] animate-pulse">
                  {selectedItem.icon}
                </span>
                <span
                  className={`absolute top-2 left-2 text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${rarityMeta.color}`}
                >
                  {rarityMeta.text}
                </span>
              </div>

              {/* Title & Lore */}
              <h3 className="text-xl font-display font-black text-white">
                {selectedItem.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {selectedItem.description}
              </p>

              {/* Perks / Combat Attributes */}
              {selectedItem.perk && (
                <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                  <div className="flex items-center gap-1.5 text-amber-400 font-display font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SPECIAL ATTRIBUTES</span>
                  </div>
                  <div className="text-xs font-mono text-amber-200 mt-1">
                    {selectedItem.perk}
                  </div>
                </div>
              )}
            </div>

            {/* Equip Action Button */}
            <div className="relative z-10 mt-5 pt-3 border-t border-white/10">
              {selectedItem.isEquipped ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 font-display font-black text-sm flex items-center justify-center gap-2 cursor-default"
                >
                  <Check className="w-4 h-4" />
                  <span>CURRENTLY EQUIPPED</span>
                </button>
              ) : (
                <button
                  onClick={() => handleEquip(selectedItem)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:via-orange-400 hover:to-red-500 text-black font-display font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>EQUIP TO LOADOUT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
