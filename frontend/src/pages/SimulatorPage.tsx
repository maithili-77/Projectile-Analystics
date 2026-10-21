import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Sparkles,
  TrendingUp,
  Activity,
  Sliders,
  Database,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { TrajectoryCanvas2D } from '../simulator/TrajectoryCanvas2D';
import { Trajectory3DCanvas } from '../simulator/Trajectory3DCanvas';
import { PerformanceVisualizer } from '../simulator/PerformanceVisualizer';
import { V50Visualizer } from '../simulator/V50Visualizer';
import { ReferenceComparisonChart } from '../simulator/ReferenceComparisonChart';
import { WhatIfAnalysis } from '../simulator/WhatIfAnalysis';
import { api } from '../services/api';
import {
  TrajectoryInput,
  PerformanceInput,
  V50Input,
  PredictionResult,
  SimulationRequest,
  SimulationResponse
} from '../types';
import { savePredictionToHistory } from '../utils/history';

export type DatasetMode = 'trajectory' | 'performance' | 'v50';

export const SimulatorPage: React.FC = () => {
  // 1. Dataset Selector State
  const [selectedDataset, setSelectedDataset] = useState<DatasetMode>('trajectory');

  // 2. Trajectory Inputs (accurate_ballastic.csv)
  const [trajVelocity, setTrajVelocity] = useState<number>(600);
  const [trajAngleDeg, setTrajAngleDeg] = useState<number>(45);
  const [trajGravity, setTrajGravity] = useState<number>(9.81);

  // 3. Performance Inputs (ballistics_500.csv)
  const [perfCartridge, setPerfCartridge] = useState<string>('.308 WINCHESTER');
  const [perfType, setPerfType] = useState<string>('Rifle');
  const [perfWeight, setPerfWeight] = useState<number>(150);
  const [perfBC, setPerfBC] = useState<number>(0.45);
  const [perfV0, setPerfV0] = useState<number>(2800);
  const [perfTargets, setPerfTargets] = useState<string[]>(['V100', 'V200', 'E100', 'E200', 'BD100', 'BD200']);

  // 4. V50 Inputs (REL_v50_database_20230527.csv)
  const [v50ProjType, setV50ProjType] = useState<string>('AP');
  const [v50Calibre, setV50Calibre] = useState<number>(12.7);
  const [v50ProjMass, setV50ProjMass] = useState<number>(45.0);
  const [v50ProjDensity, setV50ProjDensity] = useState<number>(7.85);
  const [v50ProjHardness, setV50ProjHardness] = useState<number>(60.0);
  const [v50Material, setV50Material] = useState<string>('Steel');
  const [v50Thickness, setV50Thickness] = useState<number>(10.0);
  const [v50Density, setV50Density] = useState<number>(7.85);
  const [v50Modulus, setV50Modulus] = useState<number>(210.0);
  const [v50Hardness, setV50Hardness] = useState<number>(200.0);
  const [v50Yield, setV50Yield] = useState<number>(400.0);
  const [v50PR, setV50PR] = useState<number>(0.3);
  const [v50UTS, setV50UTS] = useState<number>(600.0);
  const [v50Elongation, setV50Elongation] = useState<number>(15.0);
  const [v50LudwikN, setV50LudwikN] = useState<number>(0.2);
  const [v50Angle, setV50Angle] = useState<number>(0.0);

  // Status & Prediction Results
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [simulationRes, setSimulationRes] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionStatus, setPredictionStatus] = useState<'NEWLY PREDICTED' | 'PREVIOUS PREDICTION' | 'PENDING'>('PENDING');

  // Trajectory Canvas View toggle (2D / 3D)
  const [activeView, setActiveView] = useState<'2d' | '3d'>('2d');

  // Explicit user trigger timestamp for Trajectory animation (stable at 0 until user runs model)
  const [trajRunTrigger, setTrajRunTrigger] = useState<number>(0);
  // Explicit user trigger timestamp for V50 animation (stable at 0 until user runs model)
  const [v50RunTrigger, setV50RunTrigger] = useState<number>(0);
  // Explicit user trigger timestamp for Velocity animation (stable at 0 until user runs model)
  const [perfRunTrigger, setPerfRunTrigger] = useState<number>(0);

  // Primary Predict Handler
  const handlePredict = async (saveHistory: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      if (selectedDataset === 'trajectory') {
        const inputData: TrajectoryInput = {
          velocity: Number(trajVelocity),
          angle_deg: Number(trajAngleDeg),
          gravity: Number(trajGravity)
        };

        const simReq: SimulationRequest = {
          velocity: Number(trajVelocity),
          angle_deg: Number(trajAngleDeg),
          gravity: Number(trajGravity),
          mass_kg: 1.0,
          drag_coeff: 0.0,
          num_points: 100
        };

        const [predRes, simData] = await Promise.all([
          api.predictTrajectory(inputData),
          api.runSimulation(simReq).catch(() => null)
        ]);

        setPrediction(predRes);
        setSimulationRes(simData);

        if (saveHistory && predRes) {
          savePredictionToHistory({
            type: 'Trajectory',
            model_name: predRes.model_name,
            domain_score: predRes.domain_score,
            domain_coverage_explanation: predRes.domain_coverage_explanation,
            source_page: 'Interactive Multi-Domain Simulator',
            input: {
              velocity: Number(trajVelocity),
              angle_deg: Number(trajAngleDeg),
              gravity: Number(trajGravity)
            },
            output: predRes.prediction
          });
        }

      } else if (selectedDataset === 'performance') {
        const inputData: PerformanceInput = {
          Cartridge: perfCartridge,
          Type: perfType,
          Weight: Number(perfWeight),
          BC: Number(perfBC),
          V0: Number(perfV0),
          targets: perfTargets
        };

        const predRes = await api.predictPerformance(inputData);
        setPrediction(predRes);

        if (saveHistory && predRes) {
          savePredictionToHistory({
            type: 'Performance',
            model_name: predRes.model_name,
            domain_score: predRes.domain_score,
            domain_coverage_explanation: predRes.domain_coverage_explanation,
            source_page: 'Interactive Multi-Domain Simulator',
            input: {
              Cartridge: perfCartridge,
              Type: perfType,
              Weight: Number(perfWeight),
              BC: Number(perfBC),
              V0: Number(perfV0),
              targets: perfTargets
            },
            output: predRes.prediction
          });
        }

      } else if (selectedDataset === 'v50') {
        const inputData: V50Input = {
          proj_type: v50ProjType,
          calibre: Number(v50Calibre),
          proj_mass: Number(v50ProjMass),
          proj_density: Number(v50ProjDensity),
          proj_hardness: Number(v50ProjHardness),
          Material: v50Material,
          thickness: Number(v50Thickness),
          density: Number(v50Density),
          modulus: Number(v50Modulus),
          hardness: Number(v50Hardness),
          yield: Number(v50Yield),
          PR: Number(v50PR),
          UTS: Number(v50UTS),
          elongation: Number(v50Elongation),
          'Ludwik-n': Number(v50LudwikN),
          angle: Number(v50Angle)
        };

        const predRes = await api.predictV50(inputData);
        setPrediction(predRes);

        if (saveHistory && predRes) {
          savePredictionToHistory({
            type: 'V50',
            model_name: predRes.model_name,
            domain_score: predRes.domain_score,
            domain_coverage_explanation: predRes.domain_coverage_explanation,
            source_page: 'Interactive Multi-Domain Simulator',
            input: inputData,
            output: predRes.prediction
          });
        }
      }

      setPredictionStatus('NEWLY PREDICTED');
    } catch (err: any) {
      console.error('Prediction API Error:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to generate prediction from backend ML model.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial prediction on dataset tab change
  useEffect(() => {
    handlePredict(false);
  }, [selectedDataset]);

  // Mark status as previous when inputs are adjusted
  const markInputsChanged = () => {
    if (predictionStatus === 'NEWLY PREDICTED') {
      setPredictionStatus('PREVIOUS PREDICTION');
    }
    if (selectedDataset === 'trajectory') {
      setTrajRunTrigger(0);
    } else if (selectedDataset === 'v50') {
      setV50RunTrigger(0);
    } else if (selectedDataset === 'performance') {
      setPerfRunTrigger(0);
    }
  };

  // User-initiated model run (activates Trajectory / V50 / Velocity animation on demand & records to history)
  const handleUserRunModel = () => {
    if (selectedDataset === 'trajectory') {
      setTrajRunTrigger(Date.now());
    } else if (selectedDataset === 'v50') {
      setV50RunTrigger(Date.now());
    } else if (selectedDataset === 'performance') {
      setPerfRunTrigger(Date.now());
    }
    handlePredict(true);
  };

  const domainScorePct = prediction ? Math.round(prediction.domain_score * 100) : 100;

  return (
    <div className="space-y-8 pb-12">
      <AcademicDisclaimer />

      {/* Header Title & Dataset Mode Selector */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 bg-grid-pattern">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
              <PlayCircle className="w-6 h-6 text-amber-400" />
              <span>INTERACTIVE MULTI-DOMAIN SIMULATOR</span>
            </h1>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Select an experimental dataset & machine learning domain to run live interactive simulations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
              predictionStatus === 'NEWLY PREDICTED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
              predictionStatus === 'PREVIOUS PREDICTION' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
              'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              Status: {predictionStatus}
            </span>
          </div>
        </div>

        {/* 3-Dataset Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Option A: Trajectory */}
          <button
            type="button"
            onClick={() => setSelectedDataset('trajectory')}
            className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
              selectedDataset === 'trajectory'
                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-glow-cyan text-slate-100'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="text-xs font-bold text-slate-200">Predict Range and Max Height</div>
          </button>

          {/* Option B: Performance */}
          <button
            type="button"
            onClick={() => setSelectedDataset('performance')}
            className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
              selectedDataset === 'performance'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-100'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs font-bold text-slate-200">Velocity at 100 & 200 yards, Energy at 100 & 200 yards, Bullet Drop at 100 & 200 yards</div>
          </button>

          {/* Option C: V50 Material */}
          <button
            type="button"
            onClick={() => setSelectedDataset('v50')}
            className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
              selectedDataset === 'v50'
                ? 'bg-purple-500/10 border-purple-500/50 text-slate-100'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="text-xs font-bold text-slate-200">Armor Penetration Limit V50 Damage</div>
          </button>

        </div>
      </div>

      {/* Main 3-Column Simulator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* COLUMN 1: Dynamic Input Form (3 Cols on LG) */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Model Input Features</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {selectedDataset === 'trajectory' ? '3 Features' : selectedDataset === 'performance' ? '5 Features' : '16 Attributes'}
                </span>
              </div>

            {/* FORM A: TRAJECTORY INPUTS */}
            {selectedDataset === 'trajectory' && (
              <div className="space-y-4 font-mono text-xs">
                {/* Velocity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Initial Velocity (v0):</span>
                    <span className="text-cyan-400 font-bold">{trajVelocity} m/s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={50}
                      max={2000}
                      value={trajVelocity}
                      onChange={(e) => { setTrajVelocity(Number(e.target.value)); markInputsChanged(); }}
                      className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                    />
                    <input
                      type="range"
                      min={100}
                      max={1200}
                      step={5}
                      value={trajVelocity}
                      onChange={(e) => { setTrajVelocity(Number(e.target.value)); markInputsChanged(); }}
                      className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Synchronized Angle Input + Slider */}
                <div className="space-y-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold text-cyan-300">Launch Angle (angle_deg):</span>
                    <span className="text-cyan-400 font-bold">{trajAngleDeg}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.1}
                      max={89.9}
                      step={0.1}
                      value={trajAngleDeg}
                      onChange={(e) => { setTrajAngleDeg(Number(e.target.value)); markInputsChanged(); }}
                      className="w-20 px-2 py-1 rounded bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold"
                    />
                    <input
                      type="range"
                      min={1}
                      max={89}
                      step={0.5}
                      value={trajAngleDeg}
                      onChange={(e) => { setTrajAngleDeg(Number(e.target.value)); markInputsChanged(); }}
                      className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Synchronized Slider Control</span>
                    <span>1° - 89°</span>
                  </div>
                </div>

                {/* Gravity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Gravity Acceleration (g):</span>
                    <span className="text-cyan-400 font-bold">{trajGravity} m/s²</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.1}
                      max={25}
                      step={0.01}
                      value={trajGravity}
                      onChange={(e) => { setTrajGravity(Number(e.target.value)); markInputsChanged(); }}
                      className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                    />
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={0.1}
                      value={Math.min(trajGravity, 20)}
                      onChange={(e) => { setTrajGravity(Number(e.target.value)); markInputsChanged(); }}
                      className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FORM B: PERFORMANCE INPUTS */}
            {selectedDataset === 'performance' && (
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Cartridge Designation:</label>
                  <select
                    value={perfCartridge}
                    onChange={(e) => { setPerfCartridge(e.target.value); markInputsChanged(); }}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                  >
                    <option value=".308 WINCHESTER">.308 WINCHESTER</option>
                    <option value="223 REMINGTON">223 REMINGTON</option>
                    <option value="9MM LUGER">9MM LUGER</option>
                    <option value="30-06 SPRINGFIELD">30-06 SPRINGFIELD</option>
                    <option value="460 WEATHERBY MAGNUM">460 WEATHERBY MAGNUM</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Firearm Platform Category:</label>
                  <select
                    value={perfType}
                    onChange={(e) => { setPerfType(e.target.value); markInputsChanged(); }}
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                  >
                    <option value="Rifle">Rifle</option>
                    <option value="Handgun">Handgun</option>
                    <option value="Shotgun">Shotgun</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1">Bullet Weight (gr):</label>
                    <input
                      type="number"
                      value={perfWeight}
                      onChange={(e) => { setPerfWeight(Number(e.target.value)); markInputsChanged(); }}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Ballistic Coeff (BC):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={perfBC}
                      onChange={(e) => { setPerfBC(Number(e.target.value)); markInputsChanged(); }}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-slate-300">
                    <span>Muzzle Velocity V0 (fps):</span>
                    <span className="text-emerald-400 font-bold">{perfV0} fps</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={4500}
                    step={25}
                    value={perfV0}
                    onChange={(e) => { setPerfV0(Number(e.target.value)); markInputsChanged(); }}
                    className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Select Target Variables:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {['V100', 'V200', 'E100', 'E200', 'BD100', 'BD200'].map((tgt) => (
                      <label key={tgt} className="flex items-center gap-1.5 cursor-pointer bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={perfTargets.includes(tgt)}
                          onChange={(e) => {
                            if (e.target.checked) setPerfTargets([...perfTargets, tgt]);
                            else setPerfTargets(perfTargets.filter((t) => t !== tgt));
                            markInputsChanged();
                          }}
                          className="accent-emerald-500 rounded"
                        />
                        <span className="font-mono text-slate-300">{tgt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FORM C: V50 INPUTS */}
            {selectedDataset === 'v50' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 text-[10px] block">Proj Type:</label>
                    <select
                      value={v50ProjType}
                      onChange={(e) => { setV50ProjType(e.target.value); markInputsChanged(); }}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                    >
                      <option value="AP">AP (Armor Piercing)</option>
                      <option value="FSP">FSP (Fragment Simulator)</option>
                      <option value="Ball">Ball</option>
                      <option value="Steel Core">Steel Core</option>
                      <option value="Heavy AP">Heavy AP</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">Material:</label>
                    <select
                      value={v50Material}
                      onChange={(e) => { setV50Material(e.target.value); markInputsChanged(); }}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                    >
                      <option value="Steel">Steel</option>
                      <option value="Aluminum">Aluminum</option>
                      <option value="Titanium">Titanium</option>
                      <option value="Composite">Composite</option>
                      <option value="Armor Steel">Armor Steel</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 text-[10px] block">Calibre (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={v50Calibre}
                      onChange={(e) => { setV50Calibre(Number(e.target.value)); markInputsChanged(); }}
                      className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">Mass (g):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={v50ProjMass}
                      onChange={(e) => { setV50ProjMass(Number(e.target.value)); markInputsChanged(); }}
                      className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">Thickness (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={v50Thickness}
                      onChange={(e) => { setV50Thickness(Number(e.target.value)); markInputsChanged(); }}
                      className="w-full px-1.5 py-1 rounded bg-slate-900 border border-purple-500/50 text-purple-300 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 text-[10px] block">Yield (MPa):</label>
                    <input
                      type="number"
                      value={v50Yield}
                      onChange={(e) => { setV50Yield(Number(e.target.value)); markInputsChanged(); }}
                      className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">Hardness (HB):</label>
                    <input
                      type="number"
                      value={v50Hardness}
                      onChange={(e) => { setV50Hardness(Number(e.target.value)); markInputsChanged(); }}
                      className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block">Angle (°):</label>
                    <input
                      type="number"
                      value={v50Angle}
                      onChange={(e) => { setV50Angle(Number(e.target.value)); markInputsChanged(); }}
                      className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            </div>

            {/* Bottom Actions: Error Message & Run Prediction Button */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleUserRunModel}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-glow-cyan flex items-center justify-center gap-2 transition-all cursor-pointer font-sans uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Predicting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>RUN MODEL PREDICTION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Dedicated Visualization Canvas (6 Cols on LG) */}
        <div className="lg:col-span-6 flex flex-col">
          {selectedDataset === 'trajectory' ? (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>ANIMATED DEDICATED VISUALIZER</span>
                </h3>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveView('2d')}
                    className={`px-2 py-1 rounded transition-colors ${activeView === '2d' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
                  >
                    2D Canvas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('3d')}
                    className={`px-2 py-1 rounded transition-colors ${activeView === '3d' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400'}`}
                  >
                    3D View
                  </button>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {activeView === '2d' ? (
                  <TrajectoryCanvas2D
                    points={simulationRes?.points || []}
                    maxRange={prediction?.prediction?.range_actual || simulationRes?.max_range || 1000}
                    maxHeight={prediction?.prediction?.max_height_actual || simulationRes?.max_height || 500}
                    velocity={trajVelocity}
                    angleDeg={trajAngleDeg}
                    gravity={trajGravity}
                    predictedRange={prediction?.prediction?.range_actual}
                    predictedHeight={prediction?.prediction?.max_height_actual}
                    onFire={handleUserRunModel}
                    loading={loading}
                    runTrigger={trajRunTrigger}
                  />
                ) : (
                  <Trajectory3DCanvas
                    points={simulationRes?.points || []}
                    maxRange={prediction?.prediction?.range_actual || simulationRes?.max_range || 1000}
                    maxHeight={prediction?.prediction?.max_height_actual || simulationRes?.max_height || 500}
                    velocity={trajVelocity}
                    angleDeg={trajAngleDeg}
                    gravity={trajGravity}
                    predictedRange={prediction?.prediction?.range_actual}
                    predictedHeight={prediction?.prediction?.max_height_actual}
                    runTrigger={trajRunTrigger}
                  />
                )}
              </div>
            </div>
          ) : selectedDataset === 'performance' ? (
            <PerformanceVisualizer
              v0={perfV0}
              v100={prediction?.prediction?.V100}
              v200={prediction?.prediction?.V200}
              e0={Math.round((0.5 * (perfWeight / 7000) * (perfV0 ** 2)) / 32.174)}
              e100={prediction?.prediction?.E100}
              e200={prediction?.prediction?.E200}
              bd100={prediction?.prediction?.BD100}
              bd200={prediction?.prediction?.BD200}
              cartridgeName={perfCartridge}
              firearmType={perfType}
              weightGrains={perfWeight}
              bc={perfBC}
              onFire={handleUserRunModel}
              loading={loading}
              runTrigger={perfRunTrigger}
            />
          ) : (
            <V50Visualizer
              v50={prediction?.prediction?.v50 || 0}
              material={v50Material}
              thickness={v50Thickness}
              projType={v50ProjType}
              calibre={v50Calibre}
              projMass={v50ProjMass}
              yieldStrength={v50Yield}
              hardness={v50Hardness}
              density={v50Density}
              runTrigger={v50RunTrigger}
              onFire={handleUserRunModel}
              loading={loading}
            />
          )}
        </div>

        {/* COLUMN 3: Prediction Output Cards (3 Cols on LG) */}
        <div className="lg:col-span-3 flex flex-col font-mono text-xs">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>MODEL PREDICTIONS</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {selectedDataset === 'performance' ? 'V100/V200 ML' : 'ML Pipeline'}
                </span>
              </div>

              {/* TRAJECTORY PREDICTIONS */}
              {selectedDataset === 'trajectory' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Predicted Range (range_actual)</div>
                    <div className="text-2xl font-extrabold text-cyan-300">
                      {(prediction?.prediction?.range_actual || 0).toLocaleString()} m
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Predicted Max Height</div>
                    <div className="text-2xl font-extrabold text-indigo-300">
                      {(prediction?.prediction?.max_height_actual || 0).toLocaleString()} m
                    </div>
                  </div>
                </div>
              )}

              {/* PERFORMANCE PREDICTIONS */}
              {selectedDataset === 'performance' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {['V100', 'V200', 'E100', 'E200', 'BD100', 'BD200'].map((targetKey) => {
                      const val = prediction?.prediction?.[targetKey];
                      const isV = targetKey.startsWith('V');
                      const isE = targetKey.startsWith('E');
                      const unit = isV ? 'fps' : isE ? 'ft·lbs' : 'in';
                      const colorClass = isV ? 'text-cyan-300' : isE ? 'text-emerald-300' : 'text-purple-300';
                      const badgeClass = isV ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : isE ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30';

                      return (
                        <div key={targetKey} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}>{targetKey}</span>
                            <span className="text-[9px] text-slate-500">{unit}</span>
                          </div>
                          <div className={`text-base font-extrabold mt-1 font-mono ${colorClass}`}>
                            {val !== undefined ? val : '---'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* V50 PREDICTION */}
              {selectedDataset === 'v50' && (
                <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2 text-center">
                  <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">50% Perforation Limit V50</div>
                  <div className="text-3xl font-extrabold text-purple-200">
                    {(prediction?.prediction?.v50 || 0).toLocaleString()} m/s
                  </div>
                  <div className="text-[10px] text-slate-400">Impact Velocity Threshold</div>
                </div>
              )}
            </div>

            {/* Pinned Bottom Metadata: Domain Coverage & Loaded Model */}
            <div className="space-y-3 pt-3 border-t border-slate-800/60">
              {/* Domain Coverage */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Domain Coverage</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 text-[10px]">
                    {domainScorePct}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  {prediction?.domain_coverage_explanation || 'Input vector evaluated against training bounds.'}
                </div>
              </div>

              {/* Active Model Name */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] flex items-center justify-between">
                <span className="text-slate-500 uppercase">Loaded Model</span>
                <span className="text-slate-200 font-bold">{prediction?.model_name || 'Random Forest Pipeline'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FULL-WIDTH DEDICATED GRAPHS CONTAINER BELOW MODEL INPUT FEATURES & WORKSPACE */}
      {selectedDataset === 'performance' && (
        <div id="performance-graphs-slot" className="w-full"></div>
      )}


    </div>
  );
};
