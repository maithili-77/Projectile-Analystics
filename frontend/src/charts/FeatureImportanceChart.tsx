import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { FeatureImportanceItem } from '../types';

interface Props {
  data: FeatureImportanceItem[];
  title: string;
}

export const FeatureImportanceChart: React.FC<Props> = ({ data, title }) => {
  const COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'];

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800">
      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs text-slate-400 font-mono">Relative Weight %</span>
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" stroke="#64748b" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
            <YAxis dataKey="feature" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={110} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
              formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Importance']}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
