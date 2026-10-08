import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

export type SimulationStep = 
  | 'IDLE'
  | 'VALIDATING INPUT'
  | 'PROCESSING FEATURES'
  | 'RUNNING MODEL'
  | 'GENERATING VISUALIZATION'
  | 'COMPLETE';

interface Props {
  currentStep: SimulationStep;
}

export const SimulationStatusProgress: React.FC<Props> = ({ currentStep }) => {
  const steps: SimulationStep[] = [
    'VALIDATING INPUT',
    'PROCESSING FEATURES',
    'RUNNING MODEL',
    'GENERATING VISUALIZATION',
    'COMPLETE',
  ];

  if (currentStep === 'IDLE') return null;

  const getStepIndex = (s: SimulationStep) => steps.indexOf(s);
  const activeIdx = getStepIndex(currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-slate-900/90 shadow-glow-cyan"
    >
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar font-mono text-xs">
        {steps.map((stepName, idx) => {
          const isDone = idx < activeIdx || currentStep === 'COMPLETE';
          const isCurrent = idx === activeIdx && currentStep !== 'COMPLETE';

          return (
            <div key={stepName} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                    : isCurrent
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold animate-pulse'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-700 block shrink-0" />
                )}
                <span>{stepName}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-4 h-0.5 ${idx < activeIdx ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
