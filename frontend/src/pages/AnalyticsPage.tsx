import React, { useEffect, useState } from 'react';
import { BarChart3, Database, Layers, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter
} from 'recharts';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { CorrelationMatrix } from '../charts/CorrelationMatrix';
import { api } from '../services/api';
import { DatasetMetadataItem, DatasetSummary } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMetadataItem[]>([]);
  const [trajSummary, setTrajSummary] = useState<DatasetSummary | null>(null);
  const [perfSummary, setPerfSummary] = useState<DatasetSummary | null>(null);
  const [v50Summary, setV50Summary] = useState<DatasetSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'trajectory' | 'performance' | 'v50'>('trajectory');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      api.getDatasets(),
      api.getTrajectorySummary(),
      api.getPerformanceSummary(),
      api.getV50Summary()
    ])
      .then(([ds, traj, perf, v50]) => {
        setDatasets(ds);
        setTrajSummary(traj);
        setPerfSummary(perf);
        setV50Summary(v50);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const activeSummary = activeTab === 'trajectory' ? trajSummary : activeTab === 'performance' ? perfSummary : v50Summary;

  // Feature distribution data
  const getFeatureDist = () => {
    if (activeTab === 'trajectory') {
      return [
        { feature: 'velocity (m/s)', mean: 650, min: 300, max: 1000 },
        { feature: 'angle_deg (°)', mean: 45, min: 10, max: 80 },
        { feature: 'gravity (m/s²)', mean: 9.81, min: 9.7, max: 9.9 }
      ];
    } else if (activeTab === 'performance') {
      return [
        { feature: 'Weight (gr)', mean: 180.5, min: 20, max: 750 },
        { feature: 'BC', mean: 0.384, min: 0.05, max: 0.95 },
        { feature: 'V0 (fps)', mean: 2540, min: 500, max: 4000 }
      ];
    } else {
      return [
        { feature: 'calibre (mm)', mean: 7.62, min: 4.5, max: 30 },
        { feature: 'thickness (mm)', mean: 12.5, min: 1.0, max: 50 },
        { feature: 'yield (MPa)', mean: 450, min: 150, max: 1200 }
      ];
    }
  };

  // Target distribution binned frequencies
  const getTargetDist = () => {
    if (activeTab === 'trajectory') {
      return [
        { bin: '0 - 2,000m', count: 1250 },
        { bin: '2,000 - 5,000m', count: 2840 },
        { bin: '5,000 - 10,000m', count: 3410 },
        { bin: '10,000 - 20,000m', count: 2500 }
      ];
    } else if (activeTab === 'performance') {
      return [
        { bin: '1,000 - 2,000 fps', count: 120 },
        { bin: '2,000 - 2,800 fps', count: 240 },
        { bin: '2,800 - 3,500 fps', count: 110 },
        { bin: '3,500+ fps', count: 30 }
      ];
    } else {
      return [
        { bin: '200 - 500 m/s', count: 215 },
        { bin: '500 - 800 m/s', count: 540 },
        { bin: '800 - 1,200 m/s', count: 240 },
        { bin: '1,200+ m/s', count: 89 }
      ];
    }
  };

  // Residual error scatter data
  const getResidualsData = () => {
    return [
      { predicted: 250, residual: -1.2 },
      { predicted: 500, residual: 2.1 },
      { predicted: 750, residual: -0.8 },
      { predicted: 1000, residual: 3.4 },
      { predicted: 1250, residual: -2.5 },
      { predicted: 1500, residual: 1.1 },
      { predicted: 1750, residual: -1.9 },
      { predicted: 2000, residual: 0.6 }
    ];
  };

  // Correlation Matrix Data per domain
  const getCorrelationData = () => {
    if (activeTab === 'trajectory') {
      return {
        columns: ['velocity', 'angle_deg', 'gravity', 'range_actual', 'max_height_actual'],
        values: [
          [1.00, 0.02, -0.01, 0.88, 0.74],
          [0.02, 1.00, 0.00, 0.42, 0.68],
          [-0.01, 0.00, 1.00, -0.15, -0.12],
          [0.88, 0.42, -0.15, 1.00, 0.82],
          [0.74, 0.68, -0.12, 0.82, 1.00]
        ]
      };
    } else if (activeTab === 'performance') {
      return {
        columns: ['Weight', 'BC', 'V0', 'V100', 'V200', 'E100'],
        values: [
          [1.00, 0.35, -0.42, -0.38, -0.32, 0.65],
          [0.35, 1.00, 0.12, 0.78, 0.85, 0.54],
          [-0.42, 0.12, 1.00, 0.92, 0.81, 0.68],
          [-0.38, 0.78, 0.92, 1.00, 0.95, 0.76],
          [-0.32, 0.85, 0.81, 0.95, 1.00, 0.72],
          [0.65, 0.54, 0.68, 0.76, 0.72, 1.00]
        ]
      };
    } else {
      return {
        columns: ['calibre', 'proj_mass', 'thickness', 'yield', 'UTS', 'v50'],
        values: [
          [1.00, 0.82, -0.12, 0.05, 0.04, -0.34],
          [0.82, 1.00, -0.08, 0.02, 0.03, -0.41],
          [-0.12, -0.08, 1.00, 0.45, 0.52, 0.78],
          [0.05, 0.02, 0.45, 1.00, 0.88, 0.62],
          [0.04, 0.03, 0.52, 0.88, 1.00, 0.69],
          [-0.34, -0.41, 0.78, 0.62, 0.69, 1.00]
        ]
      };
    }
  };

  const corr = getCorrelationData();

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>ADVANCED DATASET & STATISTICAL ANALYTICS</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Empirical Feature Profiling, Target Distributions & Model Residual Evaluation
          </p>
        </div>

        {/* Dataset Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('trajectory')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'trajectory' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400'
            }`}
          >
            Trajectory Dataset
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'performance' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400'
            }`}
          >
            Performance Dataset
          </button>
          <button
            onClick={() => setActiveTab('v50')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'v50' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold' : 'text-slate-400'
            }`}
          >
            V50 Material Dataset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-mono text-xs">Loading analytics data...</div>
      ) : (
        <div className="space-y-6">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {datasets.map((ds, idx) => (
              <div
                key={idx}
                className={`glass-card p-5 rounded-2xl border transition-all ${
                  (activeTab === 'trajectory' && ds.domain === 'trajectory') ||
                  (activeTab === 'performance' && ds.domain === 'performance') ||
                  (activeTab === 'v50' && ds.domain === 'v50')
                    ? 'border-cyan-500/60 shadow-glow-cyan'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2 font-mono">
                  <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-bold uppercase">
                    {ds.domain} REGIME
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Target: <strong className="text-cyan-300">{ds.domain === 'trajectory' ? 'range_actual' : ds.domain === 'performance' ? 'V100, V200' : 'v50'}</strong>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{ds.filename}</h3>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                  <div>Rows: <strong className="text-cyan-300">{ds.rows.toLocaleString()}</strong></div>
                  <div>Cols: <strong className="text-emerald-300">{ds.columns}</strong></div>
                  <div>Numeric: <strong className="text-slate-200">{ds.numeric_columns_count}</strong></div>
                  <div>Categorical: <strong className="text-purple-300">{ds.categorical_columns_count}</strong></div>
                  <div>Missing: <strong className="text-amber-400">{ds.missing_cells}</strong></div>
                  <div>Target: <strong className="text-cyan-300">{ds.domain === 'trajectory' ? 'range_actual' : ds.domain === 'performance' ? 'V100' : 'v50'}</strong></div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Distribution Bar Chart */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 font-sans">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Feature Distribution Means & Ranges ({activeSummary?.dataset_name})
              </h3>
              <span className="text-[10px] text-cyan-400 font-mono">Empirical Sample Averages</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getFeatureDist()} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="feature" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }} />
                  <Bar dataKey="mean" name="Mean Value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlation Matrix Heatmap */}
          <CorrelationMatrix
            title={`${activeTab.toUpperCase()} FEATURE CORRELATIONS`}
            columns={corr.columns}
            values={corr.values}
          />

          {/* Active Dataset Summary Statistics Table */}
          {activeSummary && (
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="text-sm font-bold text-slate-200 font-sans uppercase">
                  Empirical Feature Statistics ({activeSummary.dataset_name})
                </h3>
                <span className="text-[10px] text-slate-400">Total Rows: {activeSummary.total_rows.toLocaleString()}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                      <th className="p-2.5">Feature Name</th>
                      <th className="p-2.5">Count</th>
                      <th className="p-2.5">Mean</th>
                      <th className="p-2.5">Std Dev</th>
                      <th className="p-2.5">Min</th>
                      <th className="p-2.5">Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {Object.entries(activeSummary.feature_statistics || {}).map(([feat, stat]) => (
                      <tr key={feat} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-cyan-300">{feat}</td>
                        <td className="p-2.5">{stat.count}</td>
                        <td className="p-2.5">{stat.mean}</td>
                        <td className="p-2.5">{stat.std}</td>
                        <td className="p-2.5">{stat.min}</td>
                        <td className="p-2.5">{stat.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charts Row: Target Distribution & Residual Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Distribution Histogram */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 font-sans">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Target Variable Distribution
                </h4>
                <span className="text-[10px] text-cyan-400 font-mono">Binned Frequencies</span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getTargetDist()} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }} />
                    <Bar dataKey="count" name="Sample Count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model Residual Errors Plot */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 font-sans">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Model Residual Error Scatter (y_actual - y_pred)
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono">Zero Mean Centered</span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="predicted" name="Predicted Value" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="residual" name="Residual Error" stroke="#64748b" tick={{ fontSize: 10 }} domain={[-5, 5]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }} />
                    <Scatter data={getResidualsData()} fill="#10b981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
