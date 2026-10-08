import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  TrendingUp,
  Zap,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Save,
  Download,
  Database,
  BarChart2,
  Layers,
  Cpu
} from 'lucide-react';
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
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { VelocityEnergyChart } from '../charts/VelocityEnergyChart';
import { TrajectoryChart } from '../charts/TrajectoryChart';
import { api } from '../services/api';
import {
  TrajectoryInput,
  PerformanceInput,
  V50Input,
  PredictionResult,
  SimulationResponse,
  BallisticPrediction
} from '../types';

type ProcessStep = 'IDLE' | 'INPUT VALIDATION' | 'FEATURE PROCESSING' | 'MODEL INFERENCE' | 'RESULT';

export const PredictionLabPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trajectory' | 'performance' | 'v50'>('trajectory');
  const [processStep, setProcessStep] = useState<ProcessStep>('IDLE');
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------
  // MODULE 1: Trajectory Analytics State
  // ----------------------------------------------------
  const defaultTrajInput: TrajectoryInput = { velocity: 500, angle_deg: 45, gravity: 9.81 };
  const [trajInput, setTrajInput] = useState<TrajectoryInput>(defaultTrajInput);
  const [trajResult, setTrajResult] = useState<PredictionResult | null>(null);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);

  // ----------------------------------------------------
  // MODULE 2: Cartridge Performance State
  // ----------------------------------------------------
  const defaultPerfInput: PerformanceInput = {
    Cartridge: '.308 WINCHESTER',
    Type: 'Rifle',
    Weight: 168,
    BC: 0.447,
    V0: 2700,
  };
  const [perfInput, setPerfInput] = useState<PerformanceInput>(defaultPerfInput);
  const [perfResult, setPerfResult] = useState<PredictionResult | null>(null);

  const cartridgeOptions = [
    '.308 WINCHESTER',
    '.30-06 SPRINGFIELD',
    '460 WEATHERBY MAGNUM',
    '9MM LUGER',
    '.223 REMINGTON',
    '.50 BMG',
    '.300 WINCHESTER MAGNUM',
    '.45 ACP',
    '6.5 CREEDMOOR'
  ];

  // ----------------------------------------------------
  // MODULE 3: V50 Material Analytics State
  // ----------------------------------------------------
  const defaultV50Input: V50Input = {
    proj_type: 'AP',
    calibre: 7.62,
    proj_mass: 10.5,
    proj_density: 7.85,
    proj_hardness: 60.0,
    Material: 'Steel',
    thickness: 12.5,
    density: 7.85,
    modulus: 210.0,
    hardness: 220.0,
    yield: 450.0,
    PR: 0.3,
    UTS: 650.0,
    elongation: 16.0,
    'Ludwik-n': 0.22,
    angle: 0.0
  };
  const [v50Input, setV50Input] = useState<V50Input>(defaultV50Input);
  const [v50Result, setV50Result] = useState<PredictionResult | null>(null);

  const materialOptions = ['Steel', 'Aluminum', 'Titanium', 'Kevlar', 'Composite', 'Ceramic/Alumina'];
  const projTypeOptions = ['AP', 'FSP', 'Ball', 'Deformed AP', 'Fragment'];

  // Helper for workflow animation delay
  const runStepperWorkflow = async (executeFn: () => Promise<void>) => {
    setError(null);
    setProcessStep('INPUT VALIDATION');
    await new Promise((r) => setTimeout(r, 200));

    setProcessStep('FEATURE PROCESSING');
    await new Promise((r) => setTimeout(r, 200));

    setProcessStep('MODEL INFERENCE');
    await executeFn();

    setProcessStep('RESULT');
  };

  // ----------------------------------------------------
  // Handlers
  // ----------------------------------------------------
  const handleTrajSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runStepperWorkflow(async () => {
      try {
        const [res, sim] = await Promise.all([
          api.predictTrajectory(trajInput),
          api.runSimulation({
            velocity: trajInput.velocity,
            angle_deg: trajInput.angle_deg,
            gravity: trajInput.gravity,
            mass_kg: 0.01,
            drag_coeff: 0.47,
            num_points: 100
          })
        ]);
        setTrajResult(res);
        setSimResult(sim);
      } catch (err: any) {
        setError(err.message || 'Trajectory prediction error');
      }
    });
  };

  const handlePerfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runStepperWorkflow(async () => {
      try {
        const res = await api.predictPerformance(perfInput);
        setPerfResult(res);
      } catch (err: any) {
        setError(err.message || 'Performance prediction error');
      }
    });
  };

  const handleV50Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runStepperWorkflow(async () => {
      try {
        const res = await api.predictV50(v50Input);
        setV50Result(res);
      } catch (err: any) {
        setError(err.message || 'V50 prediction error');
      }
    });
  };

  // Actions
  const handleReset = (module: 'trajectory' | 'performance' | 'v50') => {
    if (module === 'trajectory') {
      setTrajInput(defaultTrajInput);
      setTrajResult(null);
      setSimResult(null);
    } else if (module === 'performance') {
      setPerfInput(defaultPerfInput);
      setPerfResult(null);
    } else {
      setV50Input(defaultV50Input);
      setV50Result(null);
    }
    setProcessStep('IDLE');
    setError(null);
  };

  const handleSavePrediction = (type: string, input: any, result: PredictionResult | null) => {
    if (!result) return;
    const history = JSON.parse(localStorage.getItem('prediction_history') || '[]');
    const newItem = {
      type,
      timestamp: new Date().toISOString(),
      input,
      output: result.prediction
    };
    localStorage.setItem('prediction_history', JSON.stringify([newItem, ...history]));
    alert(`Saved ${type} prediction to session history!`);
  };

  const handleExportReport = (title: string, input: any, result: PredictionResult | null) => {
    if (!result) return;
    const reportData = {
      title,
      timestamp: new Date().toISOString(),
      academic_notice: "Academic Machine Learning Research Report",
      model_used: result.model_name,
      domain_score: result.domain_score,
      domain_coverage_explanation: result.domain_coverage_explanation,
      input_parameters: input,
      prediction_output: result.prediction,
      validation_warnings: result.warnings || []
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_report.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderDomainBadge = (res: PredictionResult) => {
    const scorePct = Math.round(res.domain_score * 100);
    return (
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">
            Input Domain Coverage
          </span>
          <span className="px-2.5 py-1 rounded text-xs font-bold border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
            {scorePct}% Coverage
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          {res.domain_coverage_explanation}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            <span>INTERACTIVE MACHINE LEARNING PREDICTION LAB</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Execute model inference against pre-trained PKL pipelines
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => { setActiveTab('trajectory'); setProcessStep('IDLE'); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'trajectory' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-glow-cyan' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>1. TRAJECTORY</span>
          </button>

          <button
            onClick={() => { setActiveTab('performance'); setProcessStep('IDLE'); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'performance' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-glow-emerald' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>2. PERFORMANCE</span>
          </button>

          <button
            onClick={() => { setActiveTab('v50'); setProcessStep('IDLE'); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'v50' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-glow-indigo' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. V50 MATERIAL</span>
          </button>
        </div>
      </div>

      {/* UX STEPPER (Framer Motion) */}
      {processStep !== 'IDLE' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-xl border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono"
        >
          {[
            { key: 'INPUT VALIDATION', step: 1 },
            { key: 'FEATURE PROCESSING', step: 2 },
            { key: 'MODEL INFERENCE', step: 3 },
            { key: 'RESULT', step: 4 }
          ].map((item) => {
            const stepsOrder = ['INPUT VALIDATION', 'FEATURE PROCESSING', 'MODEL INFERENCE', 'RESULT'];
            const currentIndex = stepsOrder.indexOf(processStep);
            const itemIndex = stepsOrder.indexOf(item.key);
            const isCompleted = itemIndex < currentIndex || processStep === 'RESULT';
            const isActive = processStep === item.key;

            return (
              <div
                key={item.key}
                className={`p-2.5 rounded-lg border flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900/50 text-slate-500 border-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950 animate-pulse'
                      : isCompleted
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : item.step}
                </div>
                <span>{item.key}</span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: TRAJECTORY ANALYTICS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'trajectory' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-sans">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>MODULE 1: TRAJECTORY ANALYTICS</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dataset: <strong>accurate_ballastic.csv</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Column (4 cols) */}
            <div className="lg:col-span-4 glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans border-b border-slate-800/80 pb-2">
                Launch Input Features
              </div>

              <form onSubmit={handleTrajSubmit} className="space-y-4 text-xs font-mono">
                {/* Velocity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Velocity (v0):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={100} max={1500} step={1}
                        value={trajInput.velocity}
                        onChange={(e) => setTrajInput({ ...trajInput, velocity: parseFloat(e.target.value) || 0 })}
                        className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-cyan-400 font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400">m/s</span>
                    </div>
                  </div>
                  <input
                    type="range" min={100} max={1500} step={10}
                    value={trajInput.velocity}
                    onChange={(e) => setTrajInput({ ...trajInput, velocity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500">Training Range: 300 — 1000 m/s</div>
                </div>

                {/* Angle */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Angle (θ):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={5} max={85} step={0.5}
                        value={trajInput.angle_deg}
                        onChange={(e) => setTrajInput({ ...trajInput, angle_deg: parseFloat(e.target.value) || 0 })}
                        className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-cyan-400 font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400">°</span>
                    </div>
                  </div>
                  <input
                    type="range" min={5} max={85} step={1}
                    value={trajInput.angle_deg}
                    onChange={(e) => setTrajInput({ ...trajInput, angle_deg: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500">Training Range: 10° — 80°</div>
                </div>

                {/* Gravity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Gravity (g):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={8.0} max={12.0} step={0.01}
                        value={trajInput.gravity}
                        onChange={(e) => setTrajInput({ ...trajInput, gravity: parseFloat(e.target.value) || 0 })}
                        className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-cyan-400 font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400">m/s²</span>
                    </div>
                  </div>
                  <input
                    type="range" min={8.0} max={12.0} step={0.1}
                    value={trajInput.gravity}
                    onChange={(e) => setTrajInput({ ...trajInput, gravity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500">Training Range: 9.7 — 9.9 m/s²</div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processStep !== 'IDLE' && processStep !== 'RESULT'}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-cyan transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-sans uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>PREDICT TRAJECTORY</span>
                </button>
              </form>

              {/* Actions Bar */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px] font-mono">
                <button
                  onClick={() => handleReset('trajectory')}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => handleSavePrediction('Trajectory', trajInput, trajResult)}
                  disabled={!trajResult}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>

                <button
                  onClick={() => handleExportReport('Trajectory_Analytics', trajInput, trajResult)}
                  disabled={!trajResult}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Report</span>
                </button>
              </div>
            </div>

            {/* Prediction Output Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <AnimatePresence mode="wait">
                {trajResult ? (
                  <motion.div
                    key="traj-results"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Prediction Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Predicted Downrange (range_actual)</span>
                        <div className="text-3xl font-extrabold text-cyan-300">
                          {trajResult.prediction.range_actual?.toLocaleString()} m
                        </div>
                      </div>

                      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Predicted Max Altitude (max_height_actual)</span>
                        <div className="text-3xl font-extrabold text-indigo-300">
                          {trajResult.prediction.max_height_actual?.toLocaleString()} m
                        </div>
                      </div>
                    </div>

                    {renderDomainBadge(trajResult)}

                    {/* Model Used & Warnings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500 uppercase text-[10px]">Model Name</span>
                        <span className="text-slate-200 font-bold">{trajResult.model_name}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500 uppercase text-[10px]">Validation Status</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Input Valid</span>
                        </span>
                      </div>
                    </div>

                    {/* Trajectory Plot */}
                    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">
                        Predicted Trajectory Path Curve
                      </div>
                      <TrajectoryChart points={simResult?.points || []} />
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs font-mono">
                    Configure parameters on the left and click PREDICT TRAJECTORY to run ML inference.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROJECTILE PERFORMANCE ANALYTICS                                   */}
      {/* ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-sans">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>MODULE 2: PROJECTILE PERFORMANCE ANALYTICS</span>
              </h2>
              <span className="text-[11px] text-emerald-400 font-mono">
                Comparative Performance Analytics (Non-operational academic research)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dataset: <strong>ballistics_500.csv</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Column (4 cols) */}
            <div className="lg:col-span-4 glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans border-b border-slate-800/80 pb-2">
                Cartridge Specifications
              </div>

              <form onSubmit={handlePerfSubmit} className="space-y-4 text-xs font-mono">
                {/* Cartridge Categorical Dropdown */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Cartridge Name:</label>
                  <select
                    value={perfInput.Cartridge}
                    onChange={(e) => setPerfInput({ ...perfInput, Cartridge: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-400 focus:outline-none"
                  >
                    {cartridgeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Type Categorical Dropdown */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Type:</label>
                  <select
                    value={perfInput.Type}
                    onChange={(e) => setPerfInput({ ...perfInput, Type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="Rifle">Rifle</option>
                    <option value="Handgun">Handgun</option>
                    <option value="Shotgun">Shotgun</option>
                  </select>
                </div>

                {/* Weight (grains) Slider + Number */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Bullet Weight (grains):</span>
                    <input
                      type="number" min={20} max={750} step={1}
                      value={perfInput.Weight}
                      onChange={(e) => setPerfInput({ ...perfInput, Weight: parseFloat(e.target.value) || 0 })}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-emerald-400 font-bold text-xs"
                    />
                  </div>
                  <input
                    type="range" min={20} max={750} step={5}
                    value={perfInput.Weight}
                    onChange={(e) => setPerfInput({ ...perfInput, Weight: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* BC Slider + Number */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Ballistic Coeff (BC):</span>
                    <input
                      type="number" min={0.05} max={0.95} step={0.001}
                      value={perfInput.BC}
                      onChange={(e) => setPerfInput({ ...perfInput, BC: parseFloat(e.target.value) || 0 })}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-emerald-400 font-bold text-xs"
                    />
                  </div>
                  <input
                    type="range" min={0.05} max={0.95} step={0.01}
                    value={perfInput.BC}
                    onChange={(e) => setPerfInput({ ...perfInput, BC: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* V0 (fps) Slider + Number */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Muzzle Velocity (V0 fps):</span>
                    <input
                      type="number" min={500} max={4000} step={10}
                      value={perfInput.V0}
                      onChange={(e) => setPerfInput({ ...perfInput, V0: parseFloat(e.target.value) || 0 })}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-emerald-400 font-bold text-xs"
                    />
                  </div>
                  <input
                    type="range" min={500} max={4000} step={25}
                    value={perfInput.V0}
                    onChange={(e) => setPerfInput({ ...perfInput, V0: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processStep !== 'IDLE' && processStep !== 'RESULT'}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-glow-emerald transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-sans uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>PREDICT 6 TARGET METRICS</span>
                </button>
              </form>

              {/* Actions Bar */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px] font-mono">
                <button
                  onClick={() => handleReset('performance')}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => handleSavePrediction('Performance', perfInput, perfResult)}
                  disabled={!perfResult}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>

                <button
                  onClick={() => handleExportReport('Performance_Analytics', perfInput, perfResult)}
                  disabled={!perfResult}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Report</span>
                </button>
              </div>
            </div>

            {/* Output & Charts Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <AnimatePresence mode="wait">
                {perfResult ? (
                  <motion.div
                    key="perf-results"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* All 6 Target Prediction Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                      {Object.entries(perfResult.prediction).map(([targetKey, val]) => (
                        <div key={targetKey} className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{targetKey} Target</span>
                          <div className="text-xl font-extrabold text-emerald-300">
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>

                    {renderDomainBadge(perfResult)}

                    {/* Comparative Performance Analytics Chart */}
                    <VelocityEnergyChart
                      data={{
                        Cartridge: perfInput.Cartridge,
                        Type: perfInput.Type,
                        Weight: perfInput.Weight,
                        BC: perfInput.BC,
                        V0: perfInput.V0,
                        V100: perfResult.prediction.V100 ?? 0,
                        V200: perfResult.prediction.V200 ?? 0,
                        E0: Math.round((perfInput.Weight * (perfInput.V0 ** 2)) / 450437),
                        E100: perfResult.prediction.E100 ?? 0,
                        E200: perfResult.prediction.E200 ?? 0,
                        BD100: perfResult.prediction.BD100 ?? 0,
                        BD200: perfResult.prediction.BD200 ?? 0,
                        model_used: perfResult.model_name
                      }}
                    />

                    {/* Dataset Statistics Card */}
                    <div className="glass-card p-4 rounded-xl border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-center">
                      <div className="p-2.5 rounded-lg bg-slate-900">
                        <span className="text-[10px] text-slate-500 uppercase block">Dataset Size</span>
                        <span className="font-bold text-slate-200">500 Rows</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900">
                        <span className="text-[10px] text-slate-500 uppercase block">Mean V0</span>
                        <span className="font-bold text-emerald-400">2,540 fps</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900">
                        <span className="text-[10px] text-slate-500 uppercase block">Mean Weight</span>
                        <span className="font-bold text-slate-200">180.5 gr</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900">
                        <span className="text-[10px] text-slate-500 uppercase block">Mean BC</span>
                        <span className="font-bold text-cyan-400">0.384</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs font-mono">
                    Select cartridge parameters and click PREDICT 6 TARGET METRICS to run inference.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: V50 MATERIAL ANALYTICS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'v50' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-2 gap-2">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-sans">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>MODULE 3: V50 MATERIAL ANALYTICS</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>Dataset: <strong>REL_v50_database_20230527(1).csv</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Column (5 cols) */}
            <div className="lg:col-span-5 glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans border-b border-slate-800/80 pb-2">
                Material & Projectile Inputs
              </div>

              <form onSubmit={handleV50Submit} className="space-y-4 text-xs font-mono">
                {/* Categorical Searchable Dropdowns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Target Material:</label>
                    <select
                      value={v50Input.Material}
                      onChange={(e) => setV50Input({ ...v50Input, Material: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                    >
                      {materialOptions.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Proj Type:</label>
                    <select
                      value={v50Input.proj_type}
                      onChange={(e) => setV50Input({ ...v50Input, proj_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                    >
                      {projTypeOptions.map((pt) => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Numeric Grid */}
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block text-slate-400 mb-0.5">Calibre (mm):</label>
                    <input
                      type="number" step="0.1"
                      value={v50Input.calibre}
                      onChange={(e) => setV50Input({ ...v50Input, calibre: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-purple-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Proj Mass (g):</label>
                    <input
                      type="number" step="0.1"
                      value={v50Input.proj_mass}
                      onChange={(e) => setV50Input({ ...v50Input, proj_mass: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-purple-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Thickness (mm):</label>
                    <input
                      type="number" step="0.5"
                      value={v50Input.thickness}
                      onChange={(e) => setV50Input({ ...v50Input, thickness: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-purple-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Yield (MPa):</label>
                    <input
                      type="number"
                      value={v50Input.yield}
                      onChange={(e) => setV50Input({ ...v50Input, yield: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-purple-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">UTS (MPa):</label>
                    <input
                      type="number"
                      value={v50Input.UTS}
                      onChange={(e) => setV50Input({ ...v50Input, UTS: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-purple-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Hardness (HB):</label>
                    <input
                      type="number"
                      value={v50Input.hardness}
                      onChange={(e) => setV50Input({ ...v50Input, hardness: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-purple-300 font-bold"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processStep !== 'IDLE' && processStep !== 'RESULT'}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-indigo transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-sans uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>PREDICT V50 LIMIT VELOCITY</span>
                </button>
              </form>

              {/* Actions Bar */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px] font-mono">
                <button
                  onClick={() => handleReset('v50')}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => handleSavePrediction('V50_Material', v50Input, v50Result)}
                  disabled={!v50Result}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>

                <button
                  onClick={() => handleExportReport('V50_Material_Analytics', v50Input, v50Result)}
                  disabled={!v50Result}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Report</span>
                </button>
              </div>
            </div>

            {/* Output & Visualization Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <AnimatePresence mode="wait">
                {v50Result ? (
                  <motion.div
                    key="v50-results"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* V50 Main Result Card */}
                    <div className="glass-card p-6 rounded-2xl border border-slate-800 text-center space-y-2 font-mono">
                      <span className="text-xs text-slate-400 uppercase font-bold">Predicted V50 Ballistic Limit Velocity</span>
                      <div className="text-4xl font-extrabold text-purple-300">
                        {v50Result.prediction.v50} m/s
                      </div>
                    </div>

                    {renderDomainBadge(v50Result)}

                    {/* Material Analytics Bar Chart */}
                    <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between font-sans">
                        <span>Material V50 Limit Comparison (m/s)</span>
                        <span className="text-purple-400 font-mono">Predicted: {v50Result.prediction.v50} m/s</span>
                      </h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { material: 'Steel', v50: 720 },
                              { material: 'Aluminum', v50: 510 },
                              { material: 'Titanium', v50: 830 },
                              { material: 'Kevlar', v50: 450 },
                              { material: 'Composite', v50: 600 },
                              { material: `Predicted (${v50Input.Material})`, v50: v50Result.prediction.v50 }
                            ]}
                            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="material" stroke="#64748b" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '12px' }}
                              formatter={(val: any) => [`${val} m/s`, 'V50 Velocity']}
                            />
                            <Bar dataKey="v50" name="V50 Velocity (m/s)" fill="#c084fc" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Dataset Statistics & Distribution Summary */}
                    <div className="glass-card p-4 rounded-xl border border-slate-800 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono text-center">
                      <div className="p-2.5 rounded-lg bg-slate-900">
                        <span className="text-[10px] text-slate-500 uppercase block">Dataset Size</span>
                        <span className="font-bold text-slate-200">1,084 Rows</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900">
                        <span className="text-[10px] text-slate-500 uppercase block">Dataset Mean V50</span>
                        <span className="font-bold text-purple-400">685.4 m/s</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900">
                        <span className="text-[10px] text-slate-500 uppercase block">Target Distribution</span>
                        <span className="font-bold text-cyan-400">180 — 1650 m/s</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs font-mono">
                    Set target material properties and click PREDICT V50 LIMIT VELOCITY to run model.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
