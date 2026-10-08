import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2, Trophy, Layers, Filter } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { api } from '../services/api';
import { ModelMetadataItem } from '../types';

export const ModelInsightsPage: React.FC = () => {
  const [models, setModels] = useState<Record<string, ModelMetadataItem>>({});
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([api.getModels(), api.getModelMetrics()])
      .then(([mRes, metRes]) => {
        setModels(mRes);
        setMetrics(metRes);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-rose-400" />
            <span>Trained Model Registry & Benchmark Metrics</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Model preprocessors, scalers, encoders, feature names, and benchmark metrics
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-mono text-xs">Loading model registry details...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(models).map(([mid, meta]) => (
            <div key={mid} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 font-bold uppercase text-[10px]">
                    {meta.domain}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Loaded</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100">{meta.model_name}</h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">Target: <strong className="text-cyan-300">{meta.target}</strong></div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="text-slate-400 flex justify-between">
                    <span>Algorithm:</span>
                    <span className="text-slate-200 font-semibold">{meta.model_type}</span>
                  </div>
                  <div className="text-slate-400 flex justify-between">
                    <span>Features Count:</span>
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

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Feature Names</span>
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

              {meta.model_metrics && Object.keys(meta.model_metrics).length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 text-[11px] grid grid-cols-3 gap-2 text-center">
                  {meta.model_metrics.R2 && (
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[9px] block">R² SCORE</span>
                      <span className="text-cyan-300 font-bold">{meta.model_metrics.R2}</span>
                    </div>
                  )}
                  {meta.model_metrics.RMSE && (
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[9px] block">RMSE</span>
                      <span className="text-emerald-300 font-bold">{meta.model_metrics.RMSE}</span>
                    </div>
                  )}
                  {meta.model_metrics.MAE && (
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 text-[9px] block">MAE</span>
                      <span className="text-amber-300 font-bold">{meta.model_metrics.MAE}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
