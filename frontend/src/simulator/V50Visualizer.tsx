import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Info, Play, RotateCcw, CheckCircle2, Target } from 'lucide-react';

interface V50VisualizerProps {
  v50: number;
  material: string;
  thickness: number;
  projType: string;
  calibre: number;
  projMass: number;
  yieldStrength?: number;
  hardness?: number;
  density?: number;
  runTrigger?: number;
  onFire?: () => void;
  loading?: boolean;
}

export const V50Visualizer: React.FC<V50VisualizerProps> = ({
  v50,
  material,
  thickness,
  projType,
  calibre,
  projMass,
  yieldStrength = 400,
  hardness = 200,
  density = 7.85,
  runTrigger = 0,
  onFire,
  loading = false
}) => {
  // Stable animation states: 'idle' = resting, 'running' = in-flight, 'impacted' = hit & stopped
  const [animationState, setAnimationState] = useState<'idle' | 'running' | 'impacted'>('idle');
  const [impactAnimation, setImpactAnimation] = useState<number>(0);
  const [impactFlash, setImpactFlash] = useState<boolean>(false);
  const [localTrigger, setLocalTrigger] = useState<number>(0);

  // Active trigger combines parent runTrigger and internal replay trigger
  const effectiveTrigger = runTrigger > localTrigger ? runTrigger : localTrigger;

  // Run animation ONLY when model is run by user (or Fire button clicked)
  useEffect(() => {
    if (!effectiveTrigger || effectiveTrigger <= 0) {
      setImpactAnimation(0);
      setAnimationState('idle');
      return;
    }

    setAnimationState('running');
    setImpactAnimation(0);
    setImpactFlash(false);

    const durationMs = 1200;
    const startTime = performance.now();
    let reqId: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      setImpactAnimation(progress);

      if (progress < 100) {
        reqId = requestAnimationFrame(step);
      } else {
        setAnimationState('impacted');
        setImpactFlash(true);
        setTimeout(() => setImpactFlash(false), 700);
      }
    };

    reqId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(reqId);
  }, [effectiveTrigger]);

  // When physical inputs change, reset to stable idle position
  useEffect(() => {
    setImpactAnimation(0);
    setAnimationState('idle');
    setImpactFlash(false);
  }, [material, thickness, calibre, projType, projMass]);

  const handleTestFire = () => {
    if (onFire) {
      onFire();
    } else {
      setLocalTrigger(Date.now());
    }
  };

  const handleReset = () => {
    setImpactAnimation(0);
    setAnimationState('idle');
    setImpactFlash(false);
    setLocalTrigger(0);
  };

  const currentVelocity = animationState === 'idle'
    ? 0
    : animationState === 'running'
    ? Math.round(v50 * (impactAnimation / 100))
    : Math.round(v50);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-full space-y-4 font-mono text-xs">
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-sans">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>V50 BALLISTIC LIMIT MATERIAL-TESTING BENCH</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Perforation Threshold Simulation ({material} Plate • {thickness} mm)
          </p>
        </div>

        {/* Status Badge & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Badge */}
          {animationState === 'idle' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>STABLE • READY</span>
            </span>
          )}
          {animationState === 'running' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>IN-FLIGHT</span>
            </span>
          )}
          {animationState === 'impacted' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-purple-400" />
              <span>IMPACT TEST COMPLETE</span>
            </span>
          )}

          {/* Test Fire / Reset Buttons */}
          <button
            type="button"
            onClick={handleTestFire}
            disabled={loading || animationState === 'running'}
            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[11px] font-sans font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Fire projectile at test plate"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{animationState === 'impacted' ? 'Re-Fire' : 'Fire Test'}</span>
          </button>

          {animationState === 'impacted' && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
              title="Reset Projectile"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-[11px]">
            V50: {v50 > 0 ? `${v50.toFixed(1)} m/s` : '--- m/s'}
          </div>
        </div>
      </div>

      {/* Interactive Material Test Bench Diagram */}
      <div className="relative w-full h-72 rounded-xl bg-slate-950 border border-slate-900 p-4 flex flex-col justify-between overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        {/* Top Info Bar (Metrics positioned safely above the firing track to prevent any overlap) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 items-center gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-500 text-[10px]">SPECIMEN:</span>
            <span className="text-purple-300 font-bold">{material}</span>
            <span className="text-slate-400 text-[10px]">({thickness} mm)</span>
          </div>

          <div className="flex items-center justify-center gap-2 font-mono">
            <Activity className={`w-3.5 h-3.5 text-purple-400 ${animationState === 'running' ? 'animate-pulse' : ''}`} />
            <span className="text-slate-400 text-[10px] uppercase">
              {animationState === 'idle' ? 'Ready Velocity:' : animationState === 'running' ? 'Velocity:' : 'Impact Velocity:'}
            </span>
            <span className="text-purple-300 font-bold text-xs">
              {currentVelocity} m/s
            </span>
            <span className="text-slate-500 text-[9px]">
              (Limit: {v50 > 0 ? `${v50.toFixed(1)} m/s` : '---'})
            </span>
          </div>

          <div className="flex items-center justify-start sm:justify-end gap-1.5 truncate">
            <span className="text-slate-500 text-[10px]">PROJECTILE:</span>
            <span className="text-cyan-300 font-bold">{projType}</span>
            <span className="text-slate-400 text-[10px]">({calibre} mm, {projMass} g)</span>
          </div>
        </div>

        {/* Center Firing Lane: completely unobstructed path between Launcher and Target Plate */}
        <div className="relative z-10 my-auto flex items-center justify-between h-28 px-3">
          
          {/* 1. Launcher Station (Fixed on Far Left) */}
          <div className="relative flex flex-col items-center shrink-0 w-20">
            <div className="text-[10px] text-cyan-400 font-bold mb-1 flex items-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" />
              <span>Launcher</span>
            </div>
            
            {/* Launcher Cradle graphic */}
            <div className="w-16 h-10 rounded-l-lg bg-slate-900 border-2 border-slate-700 flex items-center justify-end pr-1 shadow-inner relative">
              <div className="w-3 h-6 rounded-r bg-slate-800 border border-slate-600" />
            </div>
            
            <div className="text-[9px] text-slate-500 mt-1 font-mono">
              {animationState === 'idle' ? 'Cradle Ready' : animationState === 'running' ? 'Fired' : 'Standby'}
            </div>
          </div>

          {/* 2. Open Dedicated Ballistic Lane (Zero obstructions, no overlapping cards) */}
          <div className="flex-1 mx-3 relative h-12 flex items-center">
            {/* Ballistic flight track dashed rail */}
            <div className="w-full h-0.5 border-b border-dashed border-slate-700/80 relative">
              <span className="absolute left-0 -top-4 text-[8px] text-slate-600 font-mono">0m</span>
              <span className="absolute left-1/3 -top-4 text-[8px] text-slate-600 font-mono">5m</span>
              <span className="absolute left-2/3 -top-4 text-[8px] text-slate-600 font-mono">10m</span>
              <span className="absolute right-0 -top-4 text-[8px] text-purple-400 font-mono">Target</span>
            </div>

            {/* In-Flight Projectile: travels precisely from 0 to 100% of the open track */}
            <div
              className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
              style={{
                left: `calc(${(impactAnimation / 100)} * (100% - 48px))`,
                transition: animationState === 'idle' ? 'left 0.2s ease-out' : 'none'
              }}
            >
              <div
                className={`relative h-6 w-12 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 rounded-r-full shadow-glow-orange flex items-center justify-center text-[9px] text-slate-950 font-bold font-mono tracking-tight border border-amber-300/40 ${
                  animationState === 'running' ? 'shadow-lg shadow-orange-500/50' : ''
                }`}
              >
                <span>{calibre}mm</span>
                {animationState === 'running' && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-1.5 bg-gradient-to-l from-orange-400 to-transparent blur-xs pointer-events-none" />
                )}
              </div>
            </div>
          </div>

          {/* 3. Target Armor Plate Specimen (Fixed on Far Right) */}
          <div className="relative flex flex-col items-center shrink-0">
            <div className="text-[10px] text-purple-300 font-bold mb-1">
              Plate ({thickness}mm)
            </div>

            <div
              className={`relative bg-slate-800 border-2 rounded-lg shadow-lg flex flex-col justify-center items-center px-3 py-4 transition-all ${
                impactFlash
                  ? 'border-purple-300 shadow-glow-purple scale-105 bg-purple-900/40'
                  : animationState === 'impacted'
                  ? 'border-purple-500/80 shadow-md shadow-purple-500/20'
                  : 'border-purple-500/40'
              }`}
              style={{
                width: `${Math.max(45, Math.min(110, thickness * 5))}px`,
                height: '76px'
              }}
            >
              {/* Impact Flash Shockwave Ring */}
              {impactFlash && (
                <div className="absolute inset-0 rounded-lg border-2 border-purple-400 animate-ping pointer-events-none" />
              )}

              {/* Crater / Dent indicator when impacted */}
              {animationState === 'impacted' && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400 shadow-glow-orange flex items-center justify-center animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              )}

              <div className="text-[10px] text-purple-200 font-bold text-center truncate max-w-full">
                {material}
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                {thickness}mm
              </div>
            </div>

            <div className="text-[9px] text-slate-500 mt-1 font-mono">
              Density: {density} g/cm³
            </div>
          </div>

        </div>

        {/* Bottom Legend & Mechanical Attributes */}
        <div className="relative z-10 grid grid-cols-4 gap-2 text-[10px] border-t border-slate-800/80 pt-2 text-slate-400">
          <div>Yield: <strong className="text-slate-200">{yieldStrength} MPa</strong></div>
          <div>Hardness: <strong className="text-slate-200">{hardness} HB</strong></div>
          <div>Density: <strong className="text-slate-200">{density} g/cm³</strong></div>
          <div className="text-right text-purple-400 font-bold">V50 Limit: {v50 > 0 ? `${v50.toFixed(1)} m/s` : '---'}</div>
        </div>
      </div>

      {/* Academic Disclaimer */}
      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-200">V50 Ballistic Limit:</strong> Statistical velocity threshold at which 50% of projectile impact trials yield complete armor perforation. The visualizer remains stable at rest until triggered by a model prediction or manual fire trial.
        </span>
      </div>
    </div>
  );
};
