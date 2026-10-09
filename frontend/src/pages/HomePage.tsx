import React from 'react';
import {
  PlayCircle,
  Calculator,
  TrendingUp,
  Zap,
  ShieldCheck,
  Activity,
  GraduationCap,
  BookOpen,
  Info
} from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { PageId } from '../components/Sidebar';
import { HealthStatus } from '../types';

interface Props {
  setActivePage: (page: PageId) => void;
  health: HealthStatus | null;
}

export const HomePage: React.FC<Props> = ({ setActivePage }) => {

  return (
    <div className="space-y-8">
      <AcademicDisclaimer />

      {/* Hero Section */}
      <div className="relative rounded-2xl glass-panel p-8 sm:p-10 overflow-hidden border border-slate-800 bg-grid-pattern">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Academic Machine Learning & Computational Physics Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            ADVANCED BALLISTIC <br />
            <span className="text-gradient-cyan">ANALYTICS PLATFORM</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Machine-learning powered research, prediction and visualization for exterior trajectory dynamics, small arms aerodynamic velocity decay, and terminal armor penetration mechanics.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActivePage('simulator')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-cyan flex items-center gap-2 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Simulator</span>
            </button>
            <button
              onClick={() => setActivePage('calculator')}
              className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Launch Calculator</span>
            </button>
          </div>
        </div>
      </div>



      {/* Informational Research Sections */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Predictive Analytics & Research Modules</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: Predicting Projectile Range and Maximum Height */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100 leading-snug">
                  Predicting Projectile Range and Maximum Height
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This module predicts the actual range and maximum height using input parameters such as initial velocity, launch angle, and gravity. Machine learning models analyze the relationship between these parameters and recorded outcomes to estimate both target values.
              </p>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>How it helps students and researchers:</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                    <span>Understand how input variables influence predicted range and maximum height.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                    <span>Compare machine learning predictions with recorded values and reference calculations.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                    <span>Explore regression techniques, model performance, and prediction errors.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                    <span>Support academic experiments involving mathematical modelling and trajectory analysis.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Predicting Velocity, Energy, and Ballistic Drop */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100 leading-snug">
                  Predicting Velocity, Energy, and Ballistic Drop
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This module predicts velocity at 100 and 200 units of distance, energy at 100 and 200 units, and ballistic drop at 100 and 200 units using available projectile characteristics and recorded measurements.
              </p>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>How it helps students and researchers:</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>Study relationships between projectile characteristics and measured performance values.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>Compare predictions across multiple regression models.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>Investigate how missing data, feature selection, and preprocessing affect model accuracy.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>Learn how machine learning can estimate multiple continuous target values from structured data.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Predicting V50 Ballistic Limit */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100 leading-snug">
                  Predicting V50 Ballistic Limit
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This module predicts V50, the estimated impact velocity associated with a 50% probability of complete penetration under specified material-testing conditions. It uses available material properties, projectile characteristics, specimen thickness, and impact angle as input features.
              </p>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 font-mono flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>How it helps students and researchers:</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                    <span>Explore relationships between material properties and experimentally measured ballistic-limit values.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                    <span>Study regression modelling with numerical and categorical features.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                    <span>Compare predicted values with experimental records and evaluate prediction errors.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                    <span>Support academic research into material testing, data analysis, and predictive modelling.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Research Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-mono">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>These modules are intended for educational and research use. Predictions are estimates based on the available data and should not be treated as substitutes for validated experimental testing.</span>
        </div>
      </div>
    </div>
  );
};

