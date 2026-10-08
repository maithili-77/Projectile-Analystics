import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, ArrowRightLeft, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { TrajectoryInput, PredictionResult } from '../types';

interface Props {
  currentInput: TrajectoryInput;
  currentPrediction: PredictionResult | null;
}

export const WhatIfAnalysis: React.FC<Props> = ({ currentInput, currentPrediction }) => {
  const [modifiedInput, setModifiedInput] = useState<TrajectoryInput>({
    velocity: currentInput.velocity + 100,
    angle_deg: currentInput.angle_deg,
    gravity: currentInput.gravity,
  });

  const [scenarioBPrediction, setScenarioBPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setModifiedInput({
      velocity: currentInput.velocity + 50,
      angle_deg: currentInput.angle_deg,
      gravity: currentInput.gravity,
    });
  }, [currentInput.velocity, currentInput.angle_deg, currentInput.gravity]);

  const runScenarioB = async () => {
    setLoading(true);
    try {
      const res = await api.predictTrajectory(modifiedInput);
      setScenarioBPrediction(res);
    } catch (err) {
      console.error('What-If scenario error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runScenarioB();
  }, [modifiedInput.velocity, modifiedInput.angle_deg, modifiedInput.gravity]);

  const predA_Range = currentPrediction?.prediction?.range_actual ?? 0;
  const predA_Height = currentPrediction?.prediction?.max_height_actual ?? 0;

  const predB_Range = scenarioBPrediction?.prediction?.range_actual ?? 0;
  const predB_Height = scenarioBPrediction?.prediction?.max_height_actual ?? 0;

  const diffRange = Math.round((predB_Range - predA_Range) * 100) / 100;
  const diffHeight = Math.round((predB_Height - predA_Height) * 100) / 100;

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-sans">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span>WHAT-IF SCENARIO ANALYSIS</span>
        </h3>
        <span className="text-[10px] text-slate-400">Live API Sensitivity Evaluation</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scenario A */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold text-cyan-400">
            Scenario A (Current Input)
          </div>
          <div className="text-slate-300">
            Velocity: <strong className="text-white">{currentInput.velocity} m/s</strong> | Angle: <strong className="text-white">{currentInput.angle_deg}°</strong>
          </div>
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <div>Range A: <strong className="text-cyan-300">{predA_Range} m</strong></div>
            <div>Apex Height A: <strong className="text-indigo-300">{predA_Height} m</strong></div>
          </div>
        </div>

        {/* Scenario B Modification Sliders */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="text-[10px] text-slate-400 uppercase font-bold text-emerald-400 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3 text-emerald-400" />
            <span>Scenario B (Modified Input)</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span>Velocity (m/s):</span>
              <span className="text-emerald-400 font-bold">{modifiedInput.velocity} m/s</span>
            </div>
            <input
              type="range"
              min={100} max={1500} step={10}
              value={modifiedInput.velocity}
              onChange={(e) => setModifiedInput({ ...modifiedInput, velocity: parseFloat(e.target.value) })}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span>Angle (°):</span>
              <span className="text-emerald-400 font-bold">{modifiedInput.angle_deg}°</span>
            </div>
            <input
              type="range"
              min={5} max={85} step={1}
              value={modifiedInput.angle_deg}
              onChange={(e) => setModifiedInput({ ...modifiedInput, angle_deg: parseFloat(e.target.value) })}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Prediction Difference */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold text-purple-400">
            Difference ($\Delta$ Scenario B vs A)
          </div>
          <div className="space-y-2 pt-1">
            <div className="p-2 rounded bg-slate-950 border border-slate-900 flex items-center justify-between">
              <span>Range Shift ($\Delta R$):</span>
              <span className={`font-bold ${diffRange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diffRange >= 0 ? `+${diffRange}` : diffRange} m
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-900 flex items-center justify-between">
              <span>Apex Altitude Shift ($\Delta H$):</span>
              <span className={`font-bold ${diffHeight >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diffHeight >= 0 ? `+${diffHeight}` : diffHeight} m
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
