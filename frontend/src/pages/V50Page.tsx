import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Layers, ShieldAlert } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { api } from '../services/api';
import { V50Input, PredictionResult } from '../types';
import { savePredictionToHistory } from '../utils/history';

export const V50Page: React.FC = () => {
  const [input, setInput] = useState<V50Input>({
    proj_type: 'AP',
    calibre: 6.2484,
    proj_mass: 10.0,
    proj_density: 7.85,
    proj_hardness: 60.0,
    Material: 'Steel',
    thickness: 10.0,
    density: 7.85,
    modulus: 210.0,
    hardness: 200.0,
    yield: 400.0,
    PR: 0.3,
    UTS: 600.0,
    elongation: 15.0,
    'Ludwik-n': 0.2,
    angle: 0.0,
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictV50(input);
      setPrediction(res);

      if (res) {
        savePredictionToHistory({
          type: 'V50',
          model_name: res.model_name,
          domain_score: res.domain_score,
          domain_coverage_explanation: res.domain_coverage_explanation,
          source_page: 'Terminal Penetration V50 Predictor',
          input: { ...input },
          output: res.prediction
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to predict V50 limit velocity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      <AcademicDisclaimer />

      <div className="flex items-center justify-between border-b border-slate-800 pb-4 font-sans">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span>Terminal Penetration V50 Predictor</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Random Forest ColumnTransformer Pipeline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Form Inputs */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4 lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-sans">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Projectile & Target Material Attributes</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 mb-1">Projectile Type:</label>
                <select
                  value={input.proj_type}
                  onChange={(e) => setInput({ ...input, proj_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                >
                  <option value="AP">Armor Piercing (AP)</option>
                  <option value="FSP">Fragment Simulating (FSP)</option>
                  <option value="Ball">Ballistic Lead Core</option>
                  <option value="Steel Core">Steel Core</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Calibre (mm):</label>
                <input
                  type="number" step="0.01"
                  value={input.calibre}
                  onChange={(e) => setInput({ ...input, calibre: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Projectile Mass (g):</label>
                <input
                  type="number" step="0.1"
                  value={input.proj_mass}
                  onChange={(e) => setInput({ ...input, proj_mass: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Target Material:</label>
                <select
                  value={input.Material}
                  onChange={(e) => setInput({ ...input, Material: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                >
                  <option value="Steel">Steel</option>
                  <option value="Aluminum">Aluminum</option>
                  <option value="Titanium">Titanium</option>
                  <option value="Composite">Composite</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Plate Thickness (mm):</label>
                <input
                  type="number" step="0.1"
                  value={input.thickness}
                  onChange={(e) => setInput({ ...input, thickness: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Yield Strength (MPa):</label>
                <input
                  type="number" step="1"
                  value={input.yield}
                  onChange={(e) => setInput({ ...input, yield: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">UTS Strength (MPa):</label>
                <input
                  type="number" step="1"
                  value={input.UTS}
                  onChange={(e) => setInput({ ...input, UTS: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Elongation (%):</label>
                <input
                  type="number" step="0.1"
                  value={input.elongation}
                  onChange={(e) => setInput({ ...input, elongation: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Obliquity Angle (°):</label>
                <input
                  type="number" step="1"
                  value={input.angle}
                  onChange={(e) => setInput({ ...input, angle: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-indigo transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Evaluating V50...' : 'Calculate V50 Ballistic Limit Velocity'}</span>
            </button>
          </form>
        </div>

        {/* Prediction Display */}
        <div className="space-y-6">
          {prediction ? (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-xl border border-slate-800 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30 mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-400 uppercase">Predicted V50 Limit Velocity</div>
                <div className="text-3xl font-extrabold text-purple-300 mt-1">
                  {prediction.prediction.v50} m/s
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase">Input Domain Coverage</span>
                  <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
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
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-300 font-sans">Awaiting Material Inputs</h3>
              <p className="text-slate-500">
                Input projectile mass, calibre, plate thickness, and yield strength to predict V50 velocity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
