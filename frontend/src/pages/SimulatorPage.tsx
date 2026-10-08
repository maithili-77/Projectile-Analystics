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
  Activity
} from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { ControlPanel } from '../simulator/ControlPanel';
import { TrajectoryCanvas2D } from '../simulator/TrajectoryCanvas2D';
import { Trajectory3DCanvas } from '../simulator/Trajectory3DCanvas';
import { SimulationStatusProgress, SimulationStep } from '../simulator/SimulationStatusProgress';
import { ReferenceComparisonChart } from '../simulator/ReferenceComparisonChart';
import { WhatIfAnalysis } from '../simulator/WhatIfAnalysis';
import { ModelExplanation } from '../simulator/ModelExplanation';
import { api } from '../services/api';
import { SimulationRequest, SimulationResponse, TrajectoryInput, PredictionResult } from '../types';

export const SimulatorPage: React.FC = () => {
  const [params, setParams] = useState<SimulationRequest>({
    velocity: 500.0,
    angle_deg: 45.0,
    gravity: 9.81,
    mass_kg: 0.01,
    drag_coeff: 0.47,
    num_points: 100,
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<SimulationStep>('IDLE');
  const [activeView, setActiveView] = useState<'2d' | '3d' | 'both'>('2d');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const startSimulationWorkflow = async () => {
    setLoading(true);
    setSimulationStep('VALIDATING INPUT');

    // Step 1: Validation delay animation
    await new Promise((r) => setTimeout(r, 200));
    setSimulationStep('PROCESSING FEATURES');

    // Step 2: Processing features animation
    await new Promise((r) => setTimeout(r, 200));
    setSimulationStep('RUNNING MODEL');

    try {
      const trajInput: TrajectoryInput = {
        velocity: params.velocity,
        angle_deg: params.angle_deg,
        gravity: params.gravity,
      };

      const [predRes, simRes] = await Promise.all([
        api.predictTrajectory(trajInput),
        api.runSimulation(params),
      ]);

      setPrediction(predRes);
      setSimulation(simRes);

      setSimulationStep('GENERATING VISUALIZATION');
      await new Promise((r) => setTimeout(r, 300));

      setSimulationStep('COMPLETE');
    } catch (err) {
      console.error('Simulation execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startSimulationWorkflow();
  }, []);

  const handleReset = () => {
    setParams({
      velocity: 500.0,
      angle_deg: 45.0,
      gravity: 9.81,
      mass_kg: 0.01,
      drag_coeff: 0.47,
      num_points: 100,
    });
    setSimulationStep('IDLE');
  };

  const domainScorePct = prediction ? Math.round(prediction.domain_score * 100) : 100;
  const predRange = prediction?.prediction?.range_actual ?? simulation?.max_range ?? 0;
  const predHeight = prediction?.prediction?.max_height_actual ?? simulation?.max_height ?? 0;

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-amber-400" />
            <span>INTERACTIVE RESEARCH SIMULATOR</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Full-Spectrum Educational Physics & Scikit-Learn ML Model Simulator
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveView('2d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeView === '2d' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400'
            }`}
          >
            2D Canvas View
          </button>
          <button
            onClick={() => setActiveView('3d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeView === '3d' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold' : 'text-slate-400'
            }`}
          >
            Three.js 3D View
          </button>
          <button
            onClick={() => setActiveView('both')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'both' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400'
            }`}
          >
            Split Views
          </button>
        </div>
      </div>

      {/* Simulation Execution Status Stepper */}
      <SimulationStatusProgress currentStep={simulationStep} />

      {/* MAIN 3-PANEL GRID (LEFT, CENTER, RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: SIMULATION PARAMETERS (3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          <ControlPanel
            params={params}
            setParams={setParams}
            onStartSimulation={startSimulationWorkflow}
            loading={loading}
          />
        </div>

        {/* CENTER PANEL: ANIMATED RESEARCH VISUALIZATION (6 columns) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                ANIMATED RESEARCH VISUALIZATION
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={startSimulationWorkflow}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-cyan-300" />
                  <span>START</span>
                </button>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 transition-all"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
                </button>
                <button
                  onClick={startSimulationWorkflow}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition-all"
                  title="Restart Animation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESTART</span>
                </button>
              </div>
            </div>

            {/* Animation Visualizer Canvas */}
            {simulation && (
              <div className="space-y-4">
                {(activeView === '2d' || activeView === 'both') && (
                  <TrajectoryCanvas2D
                    points={simulation.points}
                    maxRange={simulation.max_range}
                    maxHeight={simulation.max_height}
                  />
                )}

                {(activeView === '3d' || activeView === 'both') && (
                  <Trajectory3DCanvas
                    points={simulation.points}
                    maxRange={simulation.max_range}
                    maxHeight={simulation.max_height}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: ML PREDICTION (3 columns) */}
        <div className="lg:col-span-3 space-y-4 font-mono text-xs">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>ML PREDICTION</span>
            </h3>

            {/* Range Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Predicted Range</div>
              <div className="text-2xl font-extrabold text-cyan-300">
                {predRange.toLocaleString()} m
              </div>
            </div>

            {/* Max Height Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Predicted Maximum Height</div>
              <div className="text-2xl font-extrabold text-indigo-300">
                {predHeight.toLocaleString()} m
              </div>
            </div>

            {/* Domain Coverage Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Input Domain Coverage</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 text-[11px]">
                  {domainScorePct}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                {prediction?.domain_coverage_explanation || 'Input Domain Coverage measures similarity to the training data and is not probability of correctness.'}
              </p>
            </div>

            {/* Model Used */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
              <span className="text-slate-500 block text-[9px] uppercase">Model Used</span>
              <span className="text-slate-200 font-bold">{prediction?.model_name || 'Random Forest Regressor'}</span>
            </div>

            {/* Status */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 uppercase text-[9px]">Status</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{simulationStep === 'COMPLETE' ? 'Prediction Valid' : simulationStep}</span>
              </span>
            </div>

            {/* Warnings */}
            {prediction?.warnings && prediction.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Validation Warnings</span>
                </div>
                {prediction.warnings.map((w, idx) => (
                  <div key={idx}>{w}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: ANALYTICS & WHAT-IF ANALYSIS */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        {/* ML vs Reference Graph */}
        {simulation && (
          <ReferenceComparisonChart
            points={simulation.points}
            predictedRange={predRange}
            predictedHeight={predHeight}
            theoreticalRange={(params.velocity ** 2 * Math.sin(2 * (params.angle_deg * Math.PI / 180))) / params.gravity}
            theoreticalHeight={(params.velocity ** 2 * (Math.sin(params.angle_deg * Math.PI / 180) ** 2)) / (2 * params.gravity)}
          />
        )}

        {/* What-If Analysis Panel */}
        <WhatIfAnalysis
          currentInput={{ velocity: params.velocity, angle_deg: params.angle_deg, gravity: params.gravity }}
          currentPrediction={prediction}
        />

        {/* Model Explanation Panel */}
        <ModelExplanation featureImportances={prediction?.feature_importances} />

      </div>
    </div>
  );
};
