import React from 'react';
import { Cpu } from 'lucide-react';
import { FeatureImportanceChart } from '../charts/FeatureImportanceChart';

interface Props {
  featureImportances?: { feature: string; importance: number }[];
}

export const ModelExplanation: React.FC<Props> = ({ featureImportances }) => {
  const hasData = featureImportances && featureImportances.length > 0;

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 font-sans">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-rose-400" />
          <span>WHY DID THE MODEL PREDICT THIS?</span>
        </h3>
        <span className="text-[10px] text-slate-400">Model Interpretability & Feature Weights</span>
      </div>

      {hasData ? (
        <FeatureImportanceChart
          title="Random Forest Feature Contribution Breakdown"
          data={featureImportances}
        />
      ) : (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs font-mono">
          Feature contribution information is unavailable for this model.
        </div>
      )}
    </div>
  );
};

