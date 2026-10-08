import React, { useState } from 'react';
import { Zap, Sparkles, Crosshair } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { VelocityEnergyChart } from '../charts/VelocityEnergyChart';
import { api } from '../services/api';
import { BallisticInput, PredictionResult } from '../types';

export const BallisticPage: React.FC = () => {
  const [input, setInput] = useState<BallisticInput>({
    Cartridge: '460 WEATHERBY MAGNUM',
    Type: 'Rifle',
    Weight: 410,
    BC: 0.45,
    V0: 2700,
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictPerformance(input);
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Failed to predict ballistic performance');
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
            <Zap className="w-5 h-5 text-emerald-400" />
            <span>Ballistic Performance Predictor</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Random Forest Pipelines &bull; V100, V200, E100, E200, BD100, BD200
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <span>Cartridge Specifications</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">Cartridge Name:</label>
              <input
                type="text"
                value={input.Cartridge}
                onChange={(e) => setInput({ ...input, Cartridge: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Platform Type:</label>
              <select
                value={input.Type}
                onChange={(e) => setInput({ ...input, Type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-400 focus:outline-none"
              >
                <option value="Rifle">Rifle</option>
                <option value="Handgun">Handgun</option>
                <option value="Shotgun">Shotgun</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Bullet Weight (grains):</label>
              <input
                type="number"
                min={1} max={2000}
                value={input.Weight}
                onChange={(e) => setInput({ ...input, Weight: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">BC:</label>
              <input
                type="number" step="0.01"
                value={input.BC}
                onChange={(e) => setInput({ ...input, BC: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Muzzle Velocity (V0 fps):</label>
              <input
                type="number"
                value={input.V0}
                onChange={(e) => setInput({ ...input, V0: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-emerald-400 focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-glow-emerald transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Predicting...' : 'Predict Performance'}</span>
            </button>
          </form>
        </div>

        {/* Prediction Results */}
        <div className="lg:col-span-2 space-y-6">
          {prediction ? (
            <div className="space-y-6 font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(prediction.prediction).map(([k, v]) => (
                  <div key={k} className="glass-card p-4 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">{k}</div>
                    <div className="text-xl font-bold text-emerald-300 mt-1">{v}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase">Input Domain Coverage</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    {Math.round(prediction.domain_score * 100)}% Coverage
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {prediction.domain_coverage_explanation}
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-xl border border-slate-800 text-center space-y-3 font-mono text-xs">
              <Zap className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-300">Awaiting Cartridge Parameters</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Submit cartridge features to invoke pre-trained PKL artifacts for V100, V200, E100, E200, BD100, BD200.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
