import React, { useState } from 'react';
import { TrendingUp, Calculator, Sparkles } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { TrajectoryChart } from '../charts/TrajectoryChart';
import { api } from '../services/api';
import { TrajectoryInput, PredictionResult, SimulationResponse } from '../types';

export const TrajectoryPage: React.FC = () => {
  const [input, setInput] = useState<TrajectoryInput>({
    velocity: 500,
    angle_deg: 45,
    gravity: 9.81,
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const predRes = await api.predictTrajectory(input);
      setPrediction(predRes);

      const simRes = await api.runSimulation({
        velocity: input.velocity,
        angle_deg: input.angle_deg,
        gravity: input.gravity,
        mass_kg: 0.01,
        drag_coeff: 0.47,
        num_points: 100,
      });
      setSimulation(simRes);
    } catch (err: any) {
      setError(err.message || 'Failed to generate trajectory prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>Trajectory Prediction Engine</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Random Forest Regressor Pipelines &bull; range_model.pkl & height_model.pkl
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Initial Launch Parameters</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">Velocity (v0 m/s):</label>
              <input
                type="number"
                min={10} max={3000} step={1}
                value={input.velocity}
                onChange={(e) => setInput({ ...input, velocity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Angle (°):</label>
              <input
                type="number"
                min={0.1} max={89.9} step={0.5}
                value={input.angle_deg}
                onChange={(e) => setInput({ ...input, angle_deg: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Gravity (g m/s²):</label>
              <input
                type="number"
                min={1} max={30} step={0.01}
                value={input.gravity}
                onChange={(e) => setInput({ ...input, gravity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Predicting...' : 'Execute Trajectory Prediction'}</span>
            </button>
          </form>
        </div>

        {/* Prediction Results */}
        <div className="lg:col-span-2 space-y-6">
          {prediction ? (
            <div className="space-y-6 font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase">Predicted Downrange</div>
                  <div className="text-2xl font-extrabold text-cyan-300 mt-1">
                    {prediction.prediction.range_actual} m
                  </div>
                </div>

                <div className="glass-card p-5 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase">Predicted Max Altitude</div>
                  <div className="text-2xl font-extrabold text-indigo-300 mt-1">
                    {prediction.prediction.max_height_actual} m
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase">Input Domain Coverage</span>
                  <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                    {Math.round(prediction.domain_score * 100)}% Coverage
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {prediction.domain_coverage_explanation}
                </p>
              </div>

              <div className="glass-card p-4 rounded-xl border border-slate-800">
                <TrajectoryChart points={simulation?.points || []} />
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-xl border border-slate-800 text-center space-y-3 font-mono text-xs">
              <TrendingUp className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
              <h3 className="text-sm font-semibold text-slate-300">Ready for Trajectory Inference</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Set initial launch velocity, elevation angle, and gravity to invoke the pre-trained PKL models.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
