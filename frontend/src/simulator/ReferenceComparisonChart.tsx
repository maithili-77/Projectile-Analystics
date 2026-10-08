import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrajectoryPoint } from '../types';

interface Props {
  points: TrajectoryPoint[];
  predictedRange: number;
  predictedHeight: number;
  theoreticalRange: number;
  theoreticalHeight: number;
}

export const ReferenceComparisonChart: React.FC<Props> = ({
  points,
  predictedRange,
  predictedHeight,
  theoreticalRange,
  theoreticalHeight
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'ml' | 'reference'>('both');

  // Generate reference theoretical curve data points matching X domain
  const chartData = points.map((pt) => {
    // Standard parabolic trajectory shape ratio for analytical reference comparison
    const normX = pt.x / (predictedRange || 1);
    const refY = Math.max(0, 4 * theoreticalHeight * normX * (1 - normX));
    return {
      x: pt.x,
      mlY: pt.y,
      refY: round2(refY),
    };
  });

  function round2(val: number) {
    return Math.round(val * 100) / 100;
  }

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>ML vs Reference Comparison Graph</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            Educational / Analytical Reference Comparison (Scikit-Learn ML vs Vacuum Physics Kinematics)
          </p>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setViewMode('ml')}
            className={`px-3 py-1 rounded transition-colors ${
              viewMode === 'ml' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400'
            }`}
          >
            ML
          </button>
          <button
            onClick={() => setViewMode('reference')}
            className={`px-3 py-1 rounded transition-colors ${
              viewMode === 'reference' ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40' : 'text-slate-400'
            }`}
          >
            Reference
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1 rounded transition-colors ${
              viewMode === 'both' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400'
            }`}
          >
            Both
          </button>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="x" 
              stroke="#64748b" 
              label={{ value: 'Downrange Distance (m)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              stroke="#64748b" 
              label={{ value: 'Altitude / Height (m)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
              formatter={(value: any, name: any) => [`${value} m`, name === 'mlY' ? 'ML Prediction Path' : 'Analytical Vacuum Reference']}
              labelFormatter={(label) => `Distance: ${label} m`}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />

            {(viewMode === 'ml' || viewMode === 'both') && (
              <Line 
                type="monotone" 
                dataKey="mlY" 
                name="ML Prediction Curve (m)" 
                stroke="#22d3ee" 
                strokeWidth={2.5} 
                dot={false}
              />
            )}

            {(viewMode === 'reference' || viewMode === 'both') && (
              <Line 
                type="monotone" 
                dataKey="refY" 
                name="Analytical Reference Path (m)" 
                stroke="#818cf8" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
