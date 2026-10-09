import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Activity, Info, Zap } from 'lucide-react';

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
  density = 7.85
}) => {
  const [impactAnimation, setImpactAnimation] = useState<number>(0);

  // Smooth test velocity animation cycle
  useEffect(() => {
    setImpactAnimation(0);
    const interval = setInterval(() => {
      setImpactAnimation((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 40);
    return () => clearInterval(interval);
  }, [v50, material, thickness]);

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-sans">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>V50 BALLISTIC LIMIT MATERIAL-TESTING SIMULATOR</span>
          </h3>
          <p className="text-[10px] text-slate-400">
            Experimental 50% Perforation Limit Prediction ({material} Plate • {thickness} mm)
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
          Predicted V50: {v50 > 0 ? `${v50.toFixed(1)} m/s` : '--- m/s'}
        </div>
      </div>

      {/* Interactive Material Test Bench Diagram */}
      <div className="relative w-full h-64 rounded-xl bg-slate-950 border border-slate-900 p-4 flex flex-col justify-between overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        {/* Top Info Bar */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400">
          <div>TEST SPECIMEN: <span className="text-purple-300 font-bold">{material}</span> ({thickness} mm)</div>
          <div>PROJECTILE: <span className="text-cyan-300 font-bold">{projType}</span> ({calibre} mm, {projMass} g)</div>
        </div>

        {/* Center Animated Specimen Diagram */}
        <div className="relative z-10 my-auto flex items-center justify-around h-36">
          
          {/* Incoming Projectile Representation */}
          <div className="flex flex-col items-center space-y-1">
            <div className="text-[10px] text-cyan-400 font-bold">Test Projectile</div>
            <div
              className="w-10 h-6 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-r-full shadow-glow-cyan flex items-center justify-center text-[10px] text-white font-bold transition-transform"
              style={{ transform: `translateX(${(impactAnimation / 100) * 80}px)` }}
            >
              {calibre}mm
            </div>
            <div className="text-[9px] text-slate-500">Mass: {projMass}g</div>
          </div>

          {/* Test Obliquity Angle Indicator */}
          <div className="flex flex-col items-center justify-center text-[10px] text-slate-500 space-y-1">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Impact Velocity</span>
            <span className="text-purple-300 font-bold">{(v50 * (impactAnimation / 100)).toFixed(0)} m/s</span>
          </div>

          {/* Target Armor Specimen Block */}
          <div className="relative flex flex-col items-center space-y-1">
            <div className="text-[10px] text-purple-300 font-bold">Plate Specimen ({thickness}mm)</div>
            <div
              className="bg-slate-800 border-2 border-purple-500/50 rounded-lg shadow-lg flex flex-col justify-center items-center px-4 py-6 transition-all"
              style={{ width: `${Math.max(40, Math.min(120, thickness * 5))}px`, height: '90px' }}
            >
              <div className="text-[10px] text-purple-200 font-bold text-center">
                {material}
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-1">
                {thickness}mm
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legend & Mechanical Attributes */}
        <div className="relative z-10 grid grid-cols-4 gap-2 text-[10px] border-t border-slate-800/80 pt-2 text-slate-400">
          <div>Yield: <strong className="text-slate-200">{yieldStrength} MPa</strong></div>
          <div>Hardness: <strong className="text-slate-200">{hardness} HB</strong></div>
          <div>Density: <strong className="text-slate-200">{density} g/cm³</strong></div>
          <div className="text-right text-purple-400 font-bold">V50 Limit: {v50.toFixed(1)} m/s</div>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-200">V50 Academic Disclaimer:</strong> The V50 ballistic limit is an experimental statistical measure defined as the velocity at which 50% of impact tests yield complete perforation of a target plate under specified test conditions. Predictions are machine learning estimates based on <code className="text-purple-300">REL_v50_database_20230527.csv</code>.
        </span>
      </div>
    </div>
  );
};
