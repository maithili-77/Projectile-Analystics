import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Activity, Zap, ShieldAlert } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  Cell
} from 'recharts';

interface PerformanceProps {
  v0: number;
  v100?: number;
  v200?: number;
  e0?: number;
  e100?: number;
  e200?: number;
  bd100?: number;
  bd200?: number;
  cartridgeName?: string;
  firearmType?: string;
  weightGrains?: number;
}

export const PerformanceVisualizer: React.FC<PerformanceProps> = ({
  v0,
  v100 = 0,
  v200 = 0,
  e0 = 0,
  e100 = 0,
  e200 = 0,
  bd100 = 0,
  bd200 = 0,
  cartridgeName = 'Standard Cartridge',
  firearmType = 'Rifle',
  weightGrains = 150
}) => {
  const [activeTab, setActiveTab] = useState<'velocity' | 'energy' | 'drop'>('velocity');
  const [distProgress, setDistProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);

  // Animation loop driving distance marker (0 to 200 units)
  useEffect(() => {
    setDistProgress(0);
    setIsPlaying(true);
  }, [v0, v100, v200, e100, e200, bd100, bd200]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setDistProgress((prev) => {
        if (prev >= 200) {
          return 0; // loop back smoothly
        }
        return prev + 2 * speed;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  // Velocity curve data
  const velocityData = [
    { distance: 'Muzzle (0m)', v: v0, stage: 'V0' },
    { distance: '100 Units', v: v100, stage: 'V100' },
    { distance: '200 Units', v: v200, stage: 'V200' },
  ];

  // Energy curve data
  const energyData = [
    { distance: 'Muzzle (0m)', e: e0, stage: 'E0' },
    { distance: '100 Units', e: e100, stage: 'E100' },
    { distance: '200 Units', e: e200, stage: 'E200' },
  ];

  // Ballistic Drop data
  const dropData = [
    { distance: 'Muzzle (0m)', drop: 0, stage: 'Zero Point' },
    { distance: '100 Units', drop: bd100, stage: 'BD100' },
    { distance: '200 Units', drop: bd200, stage: 'BD200' },
  ];

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            AERODYNAMIC PERFORMANCE VISUALIZER
          </h3>
          <p className="text-[10px] text-slate-400">
            {cartridgeName} ({firearmType} • {weightGrains} gr)
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('velocity')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'velocity' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400'
            }`}
          >
            Velocity Decay
          </button>
          <button
            onClick={() => setActiveTab('energy')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'energy' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400'
            }`}
          >
            Kinetic Energy
          </button>
          <button
            onClick={() => setActiveTab('drop')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'drop' ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40' : 'text-slate-400'
            }`}
          >
            Ballistic Drop
          </button>
        </div>
      </div>

      {/* Downrange Animated Track */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Downrange Checkpoint:</span>
          <span className="text-cyan-300 font-bold">{distProgress.toFixed(0)} / 200 Distance Units</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-cyan-400" />}
            </button>
            <button
              onClick={() => setDistProgress(0)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => setSpeed((s) => (s >= 4 ? 1 : s * 2))}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px]"
            >
              {speed}x
            </button>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500 transition-all duration-75"
            style={{ width: `${(distProgress / 200) * 100}%` }}
          />
          {/* Checkpoint Markers */}
          <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-slate-400" title="Muzzle 0m" />
          <div className="absolute top-0 left-1/2 bottom-0 w-0.5 bg-slate-500" title="100 Units" />
          <div className="absolute top-0 right-0 bottom-0 w-0.5 bg-slate-400" title="200 Units" />
        </div>
      </div>

      {/* Chart Section depending on Active Tab */}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'velocity' ? (
            <LineChart data={velocityData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="distance" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" fps" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                formatter={(val: any) => [`${val} fps`, 'Velocity']}
              />
              <Legend verticalAlign="top" wrapperStyle={{ color: '#94a3b8', fontSize: '11px' }} />
              <Line type="monotone" dataKey="v" name="Velocity (fps)" stroke="#22d3ee" strokeWidth={3} dot={{ r: 6, fill: '#06b6d4' }} />
            </LineChart>
          ) : activeTab === 'energy' ? (
            <BarChart data={energyData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="distance" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" ft·lbs" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                formatter={(val: any) => [`${val} ft·lbs`, 'Kinetic Energy']}
              />
              <Legend verticalAlign="top" wrapperStyle={{ color: '#94a3b8', fontSize: '11px' }} />
              <Bar dataKey="e" name="Kinetic Energy (ft·lbs)" fill="#10b981" radius={[6, 6, 0, 0]}>
                {energyData.map((_, idx) => (
                  <Cell key={idx} fill={idx === 0 ? '#10b981' : idx === 1 ? '#34d399' : '#6ee7b7'} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={dropData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="distance" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" in" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                formatter={(val: any) => [`${val} inches`, 'Trajectory Drop']}
              />
              <Legend verticalAlign="top" wrapperStyle={{ color: '#94a3b8', fontSize: '11px' }} />
              <Line type="monotone" dataKey="drop" name="Ballistic Drop (inches)" stroke="#c084fc" strokeWidth={3} dot={{ r: 6, fill: '#a855f7' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
        <strong className="text-slate-200">Dataset Note:</strong> Values shown are scalar machine learning predictions from <code className="text-emerald-300">ballistics_500.csv</code> evaluated at fixed experimental distance checkpoints (100 and 200 distance units).
      </div>
    </div>
  );
};
