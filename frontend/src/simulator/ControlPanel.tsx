import React from 'react';
import { Sliders, RotateCcw, Play } from 'lucide-react';
import { SimulationRequest } from '../types';

interface Props {
  params: SimulationRequest;
  setParams: React.Dispatch<React.SetStateAction<SimulationRequest>>;
  onStartSimulation: () => void;
  loading: boolean;
}

export const ControlPanel: React.FC<Props> = ({ params, setParams, onStartSimulation, loading }) => {
  const handleChange = (key: keyof SimulationRequest, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const resetDefaults = () => {
    setParams({
      velocity: 500.0,
      angle_deg: 45.0,
      gravity: 9.81,
      mass_kg: 0.01,
      drag_coeff: 0.47,
      num_points: 100,
    });
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-sans">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>SIMULATION PARAMETERS</span>
        </h3>
        <button
          onClick={resetDefaults}
          className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-4 text-xs font-mono">
        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-cyan-400 font-sans border-b border-slate-800/60 pb-1">
          Trajectory Parameters
        </div>

        {/* Velocity */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span>Velocity (v0):</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={100}
                max={1500}
                step={1}
                value={params.velocity}
                onChange={(e) => handleChange('velocity', parseFloat(e.target.value) || 0)}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-cyan-400 font-bold text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400">m/s</span>
            </div>
          </div>
          <input
            type="range"
            min={100}
            max={1500}
            step={10}
            value={params.velocity}
            onChange={(e) => handleChange('velocity', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Dataset Training Range: 300</span>
            <span>1000 m/s</span>
          </div>
        </div>

        {/* Angle */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span>Elevation Angle (θ):</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={5}
                max={85}
                step={0.5}
                value={params.angle_deg}
                onChange={(e) => handleChange('angle_deg', parseFloat(e.target.value) || 0)}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-cyan-400 font-bold text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400">°</span>
            </div>
          </div>
          <input
            type="range"
            min={5}
            max={85}
            step={1}
            value={params.angle_deg}
            onChange={(e) => handleChange('angle_deg', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Dataset Training Range: 10°</span>
            <span>80°</span>
          </div>
        </div>

        {/* Gravity */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span>Gravity Acceleration (g):</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={8.0}
                max={12.0}
                step={0.01}
                value={params.gravity}
                onChange={(e) => handleChange('gravity', parseFloat(e.target.value) || 0)}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right font-mono text-cyan-400 font-bold text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400">m/s²</span>
            </div>
          </div>
          <input
            type="range"
            min={8.0}
            max={12.0}
            step={0.1}
            value={params.gravity}
            onChange={(e) => handleChange('gravity', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Dataset Training Range: 9.7</span>
            <span>9.9 m/s²</span>
          </div>
        </div>


        {/* Aerodynamic Drag Parameters */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-emerald-400 font-sans">
            Aerodynamic Drag Controls
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Projectile Mass (kg):</span>
              <span className="text-emerald-400 font-bold">{params.mass_kg} kg</span>
            </div>
            <input
              type="range"
              min={0.001}
              max={2.0}
              step={0.005}
              value={params.mass_kg}
              onChange={(e) => handleChange('mass_kg', parseFloat(e.target.value))}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Drag Coeff (Cd):</span>
              <span className="text-emerald-400 font-bold">{params.drag_coeff}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.2}
              step={0.02}
              value={params.drag_coeff}
              onChange={(e) => handleChange('drag_coeff', parseFloat(e.target.value))}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-3">
          <button
            onClick={onStartSimulation}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-cyan transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-sans uppercase tracking-wider"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{loading ? 'Simulating...' : 'START SIMULATION'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
