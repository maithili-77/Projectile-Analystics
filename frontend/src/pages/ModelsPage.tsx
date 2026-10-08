import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, Layers, Award } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { api } from '../services/api';
import { ModelMetadataItem } from '../types';

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<Record<string, ModelMetadataItem>>({});
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([api.getModels(), api.getModelMetrics()])
      .then(([mRes, metRes]) => {
        setModels(mRes);
        setMetrics(metRes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getMetricDisplay = (val?: number | string | null) => {
    if (val === undefined || val === null || val === '') return 'Not Available';
    return String(val);
  };

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-rose-400" />
            <span>MODEL INSIGHTS & PIPELINE REGISTRY</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Empirical Model Artifact Specifications, Scalers, Encoders & Offline Metrics
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-mono text-xs">Loading model registry details...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(models).map(([mid, meta]) => {
            const mData = meta.model_metrics || {};

            return (
              <div
                key={mid}
                className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 font-bold uppercase text-[10px]">
                      {meta.domain} REGIME
                    </span>
                    <span className={`flex items-center gap-1 font-bold text-[10px] ${meta.loaded ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {meta.loaded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{meta.loaded ? 'Loaded' : 'Failed'}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{meta.model_name}</h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">Target: <strong className="text-cyan-300">{meta.target}</strong></div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px]">
                    <div className="text-slate-400 flex justify-between">
                      <span>Algorithm:</span>
                      <span className="text-slate-200 font-semibold">{meta.model_type}</span>
                    </div>
                    <div className="text-slate-400 flex justify-between">
                      <span>Expected Features:</span>
                      <span className="text-slate-200 font-semibold">{meta.expected_num_features}</span>
                    </div>
                    <div className="text-slate-400 flex justify-between">
                      <span>Scaler:</span>
                      <span className="text-slate-200 font-semibold">{meta.scaler || 'None'}</span>
                    </div>
                    <div className="text-slate-400 flex justify-between">
                      <span>Encoder:</span>
                      <span className="text-slate-200 font-semibold">{meta.encoder || 'None'}</span>
                    </div>
                    <div className="text-slate-400 flex justify-between">
                      <span>Preprocessor:</span>
                      <span className="text-slate-200 font-semibold">{meta.preprocessor || 'None'}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Features</span>
                    <div className="flex flex-wrap gap-1">
                      {meta.feature_names.slice(0, 6).map((f, fIdx) => (
                        <span key={fIdx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px]">
                          {f}
                        </span>
                      ))}
                      {meta.feature_names.length > 6 && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-500 text-[10px]">
                          +{meta.feature_names.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics & Feature Importance Section */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3 font-mono">
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[9px] block">R² SCORE</span>
                      <span className="text-cyan-300 font-bold">{getMetricDisplay(mData.R2)}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[9px] block">MAE</span>
                      <span className="text-amber-300 font-bold">{getMetricDisplay(mData.MAE)}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[9px] block">RMSE</span>
                      <span className="text-emerald-300 font-bold">{getMetricDisplay(mData.RMSE)}</span>
                    </div>
                  </div>

                  {/* Feature Importance Check */}
                  <div className="text-[10px] text-slate-400 text-center p-2 rounded bg-slate-900/60 border border-slate-800/80">
                    {meta.model_type.includes('RandomForest') || meta.model_type.includes('Pipeline') ? (
                      <span className="text-cyan-400 font-bold">Tree Feature Importances Supported</span>
                    ) : (
                      <span>Feature importance unavailable.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
