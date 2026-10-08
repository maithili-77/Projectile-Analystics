import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { BallisticPrediction } from '../types';

interface Props {
  data: BallisticPrediction;
}

export const VelocityEnergyChart: React.FC<Props> = ({ data }) => {
  const chartData = [
    { distance: 'Muzzle (0 yds)', velocity: data.V0, energy: data.E0 },
    { distance: '100 Yards', velocity: data.V100, energy: data.E100 },
    { distance: '200 Yards', velocity: data.V200, energy: data.E200 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Velocity Decay Chart */}
      <div className="glass-card p-4 rounded-xl border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Velocity Decay (fps)</span>
          <span className="text-cyan-400 font-mono">Cartridge: {data.Cartridge}</span>
        </h4>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="distance" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                formatter={(val: any) => [`${val} fps`, 'Velocity']}
              />
              <Bar dataKey="velocity" name="Velocity (fps)" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Kinetic Energy Drop Chart */}
      <div className="glass-card p-4 rounded-xl border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Kinetic Energy Decay (ft-lbs)</span>
          <span className="text-emerald-400 font-mono">Weight: {data.Weight} gr</span>
        </h4>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="distance" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                formatter={(val: any) => [`${val} ft-lbs`, 'Energy']}
              />
              <Bar dataKey="energy" name="Energy (ft-lbs)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
