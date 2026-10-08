import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrajectoryPoint } from '../types';

interface Props {
  points: TrajectoryPoint[];
  predictedMaxHeight?: number;
  predictedRange?: number;
}

export const TrajectoryChart: React.FC<Props> = ({ points, predictedMaxHeight, predictedRange }) => {
  if (!points || points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
        No trajectory points to render. Run simulation to generate path.
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="colorTrajectory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
            formatter={(value: any) => [`${value} m`, 'Height']}
            labelFormatter={(label) => `Distance: ${label} m`}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
          <Area 
            type="monotone" 
            dataKey="y" 
            name="Flight Path Altitude (m)" 
            stroke="#22d3ee" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#colorTrajectory)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
