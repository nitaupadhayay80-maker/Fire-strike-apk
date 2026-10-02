import React from 'react';

interface ScopeOverlayProps {
  zoomLevel: number;
}

export const ScopeOverlay: React.FC<ScopeOverlayProps> = ({ zoomLevel }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
      {/* Black vignette mask around round scope lens */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/85 to-black" />

      {/* Scope Outer Circular Ring */}
      <div className="relative w-[340px] h-[340px] md:w-[480px] md:h-[480px] rounded-full border-4 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.5)] flex items-center justify-center">
        {/* Inner grid lines */}
        <div className="absolute inset-0 rounded-full border border-amber-400/30" />

        {/* Center reticle */}
        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />

        {/* Crosshair Horizontal Lines */}
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/90 to-transparent" />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-amber-400/90 to-transparent" />

        {/* Mil-dot distance notches */}
        <div className="absolute flex flex-col items-center gap-4 text-[9px] font-mono text-amber-400/80 select-none">
          <div className="h-2 w-[1px] bg-amber-400" />
          <div className="h-3 w-[1px] bg-amber-400" />
          <span>100M</span>
          <div className="h-3 w-[1px] bg-amber-400" />
          <span>200M</span>
          <div className="h-3 w-[1px] bg-amber-400" />
          <span>300M</span>
        </div>

        {/* Scope magnification label */}
        <div className="absolute bottom-6 font-display font-bold text-xs tracking-widest text-amber-400 px-3 py-0.5 rounded bg-black/60 border border-amber-500/40">
          {zoomLevel}X TACTICAL SCOPE
        </div>
      </div>
    </div>
  );
};
