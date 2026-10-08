import React from 'react';
import {
  Compass,
  TrendingUp,
  Zap,
  ShieldCheck,
  PlayCircle,
  BarChart3,
  Cpu,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { TabId } from '../components/Navbar';
import { HealthStatus } from '../types';

interface Props {
  setActiveTab: (tab: TabId) => void;
  health: HealthStatus | null;
}

export const OverviewPage: React.FC<Props> = ({ setActiveTab, health }) => {
  const modules = [
    {
      id: 'trajectory',
      title: 'Trajectory Prediction',
      desc: 'Predict downrange distance and apex altitude using Random Forest regressor on velocity, elevation angle, and gravity.',
      icon: TrendingUp,
      color: 'from-cyan-500 to-blue-600',
      tag: 'Dataset 1 (10,000 rows)'
    },
    {
      id: 'ballistic',
      title: 'Ballistic Performance',
      desc: 'Estimate velocity decay (V100/V200), kinetic energy drop (E100/E200), and bullet drop for small arms cartridges.',
      icon: Zap,
      color: 'from-emerald-500 to-teal-600',
      tag: 'Dataset 2 (500 rows)'
    },
    {
      id: 'v50',
      title: 'V50 Penetration Velocity',
      desc: 'Predict 50% ballistic perforation limit velocity (V50) based on target material properties and projectile geometry.',
      icon: ShieldCheck,
      color: 'from-purple-500 to-indigo-600',
      tag: 'Dataset 3 (1,084 rows)'
    },
    {
      id: 'simulator',
      title: 'Interactive 2D/3D Simulator',
      desc: 'Real-time numerical trajectory physics engine with animated 2D canvas, Three.js 3D orbital scene, and drag controls.',
      icon: PlayCircle,
      color: 'from-amber-500 to-orange-600',
      tag: 'Physics + Drag Engine'
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      desc: 'Comprehensive EDA with feature correlation heatmaps, missing value statistics, and feature distributions.',
      icon: BarChart3,
      color: 'from-sky-500 to-cyan-600',
      tag: 'Statistical Insights'
    },
    {
      id: 'insights',
      title: 'Model Insights & Metrics',
      desc: 'Compare Random Forest, Gradient Boosting, Decision Tree, and Linear Regression via R², RMSE, MAE, and feature weights.',
      icon: Cpu,
      color: 'from-rose-500 to-pink-600',
      tag: 'ML Evaluation'
    }
  ];

  return (
    <div className="space-y-8">
      <AcademicDisclaimer />

      {/* Hero Banner */}
      <div className="relative rounded-2xl glass-panel p-8 overflow-hidden border border-slate-800 bg-grid-pattern">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Academic Machine Learning Research Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Advanced Ballistic Analytics & <span className="text-gradient-cyan">Simulation System</span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Integrated machine learning visualization suite for exterior trajectory dynamics, small arms velocity & kinetic energy decay, and terminal armor penetration limit velocity ($V_{50}$).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveTab('simulator')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-cyan flex items-center gap-2 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Interactive Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>View Academic Research Paper</span>
            </button>
          </div>
        </div>
      </div>

      {/* Model Registry Status Banner */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            4/4
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span>PKL Model Pipelines Registry</span>
              <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Scikit-Learn Compatibility Loaded
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              range_model.pkl (246MB) &bull; height_model.pkl (246MB) &bull; v100_rf.pkl (9.1MB) &bull; v50_rf.pkl (14.7MB)
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('insights')}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <span>View Model Metrics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>Platform Modules & Capabilities</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => setActiveTab(m.id as TabId)}
                className="glass-card p-5 rounded-xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {m.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-2">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
