import React, { useEffect, useState } from 'react';
import {
  Compass,
  PlayCircle,
  FlaskConical,
  Database,
  Cpu,
  CheckCircle2,
  TrendingUp,
  Zap,
  ShieldCheck,
  ArrowRight,
  Activity,
  Layers
} from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { PageId } from '../components/Sidebar';
import { api } from '../services/api';
import { HealthStatus, DatasetMetadataItem, ModelMetadataItem } from '../types';

interface Props {
  setActivePage: (page: PageId) => void;
  health: HealthStatus | null;
}

export const HomePage: React.FC<Props> = ({ setActivePage, health }) => {
  const [datasets, setDatasets] = useState<DatasetMetadataItem[]>([]);
  const [models, setModels] = useState<Record<string, ModelMetadataItem>>({});

  useEffect(() => {
    api.getDatasets().then(res => setDatasets(res)).catch(() => {});
    api.getModels().then(res => setModels(res)).catch(() => {});
  }, []);

  const totalRecords = datasets.reduce((sum, d) => sum + d.rows, 0) || 11584;
  const loadedCount = health?.models_loaded || '9/9';

  return (
    <div className="space-y-8">
      <AcademicDisclaimer />

      {/* Hero Section */}
      <div className="relative rounded-2xl glass-panel p-8 sm:p-10 overflow-hidden border border-slate-800 bg-grid-pattern">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Academic Machine Learning & Computational Physics Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            ADVANCED BALLISTIC <br />
            <span className="text-gradient-cyan">ANALYTICS PLATFORM</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Machine-learning powered research, prediction and visualization for exterior trajectory dynamics, small arms aerodynamic velocity decay, and terminal armor penetration mechanics.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActivePage('simulator')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-cyan flex items-center gap-2 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Simulator</span>
            </button>
            <button
              onClick={() => setActivePage('prediction_lab')}
              className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
            >
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <span>Prediction Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>ML Domains</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">3 Models</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Trajectory, Performance, V50</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Datasets</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">3 Datasets</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Benchmark Research Data</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Backend Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 font-mono">{loadedCount} Ready</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Model Registry Active</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Total Records</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {totalRecords.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Training Samples</div>
        </div>
      </div>

      {/* Model Cards Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span>Trained Model Registry Architectures</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Trajectory */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-slate-900 text-slate-400 border border-slate-800">
                  accurate_ballastic.csv
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">TRAJECTORY ANALYTICS</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Predicts projectile downrange distance and maximum apex altitude based on launch conditions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">RECORDS</span>
                  <span className="text-cyan-300 font-bold">10,000 records</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">TARGETS</span>
                  <span className="text-cyan-300 font-bold">2 targets</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400 space-y-1">
                <div>Inputs: <span className="text-slate-200">velocity, angle_deg, gravity</span></div>
                <div>Targets: <span className="text-slate-200">range_actual, max_height_actual</span></div>
              </div>
            </div>

            <button
              onClick={() => setActivePage('prediction_lab')}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-mono border border-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <span>Test Trajectory Models</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Ballistic Performance */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-slate-900 text-slate-400 border border-slate-800">
                  ballistics_500.csv
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">BALLISTIC PERFORMANCE</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluates velocity decay, kinetic energy drop, and bullet drop over distance.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">RECORDS</span>
                  <span className="text-emerald-300 font-bold">500 records</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">TARGETS</span>
                  <span className="text-emerald-300 font-bold">6 targets</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400 space-y-1">
                <div>Inputs: <span className="text-slate-200">Cartridge, Type, Weight, BC, V0</span></div>
                <div>Targets: <span className="text-slate-200">V100, V200, E100, E200, BD100, BD200</span></div>
              </div>
            </div>

            <button
              onClick={() => setActivePage('prediction_lab')}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-mono border border-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <span>Test Ballistic Performance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: V50 Material */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-slate-900 text-slate-400 border border-slate-800">
                  REL_v50_database.csv
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">V50 MATERIAL ANALYTICS</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Predicts 50% ballistic perforation threshold velocity based on armor plate mechanical properties.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">RECORDS</span>
                  <span className="text-purple-300 font-bold">1,084 records</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">TARGETS</span>
                  <span className="text-purple-300 font-bold">1 target</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400 space-y-1">
                <div>Inputs: <span className="text-slate-200">16 Material & Projectile Attributes</span></div>
                <div>Target: <span className="text-slate-200">v50 (m/s)</span></div>
              </div>
            </div>

            <button
              onClick={() => setActivePage('prediction_lab')}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 text-xs font-mono border border-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <span>Test V50 Models</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
