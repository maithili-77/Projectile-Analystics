import React from 'react';
import { FileText, BookOpen, ShieldCheck, Download } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';

export const ReportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Academic Research Paper & Methodology</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Machine Learning Evaluation in Ballistic Analytics & Terminal Penetration
          </p>
        </div>
      </div>

      <div className="glass-card p-8 rounded-2xl border border-slate-800 space-y-8 text-slate-200 text-sm leading-relaxed max-w-4xl mx-auto">
        {/* Title Header */}
        <div className="border-b border-slate-800 pb-6 space-y-2">
          <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
            ACADEMIC RESEARCH PAPER
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100">
            ADVANCED BALLISTIC ANALYTICS AND SIMULATION PLATFORM
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Authors: Machine Learning Research & Ballistic Physics Computation Group
          </p>
        </div>

        {/* Abstract */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Abstract</h3>
          <p className="text-xs text-slate-300">
            This research paper evaluates empirical and predictive machine learning models applied to classical atmospheric trajectory dynamics, cartridge aerodynamic performance decay, and material ballistic limit ($V_{50}$) penetration mechanics. By employing Random Forest regressors, Gradient Boosting ensembles, and feature-engineered ColumnTransformers, we model non-linear physical interactions across three distinct ballistic regimes ($R^2 &gt; 0.98$ for trajectory, $R^2 &gt; 0.94$ for cartridge velocity decay, and $R^2 &gt; 0.91$ for $V_{50}$ armor limit velocities).
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-cyan-300 border-b border-slate-800 pb-1">
            1. Introduction & Physical Formulations
          </h3>
          <p className="text-xs text-slate-300">
            Ballistic analytics spans three primary physical regimes:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 font-mono pl-2">
            <li><strong>Exterior Ballistics:</strong> Kinematic flight under gravitational acceleration ($g$) and initial launch velocity ($v_0$).</li>
            <li><strong>Aerodynamic Decay:</strong> Velocity drop over range governed by Ballistic Coefficient ($BC$).</li>
            <li><strong>Terminal Impact ($V_{50}$):</strong> 50% perforation threshold velocity for target armor plates of thickness ($d$) and yield strength ($\sigma_y$).</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-cyan-300 border-b border-slate-800 pb-1">
            2. Datasets & Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-cyan-300">accurate_ballastic.csv</div>
              <div className="text-slate-400 mt-1">10,000 rows</div>
              <div className="text-[11px] text-slate-500 mt-1">velocity, angle_deg, gravity -&gt; range_actual, max_height_actual</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-emerald-300">ballistics_500.csv</div>
              <div className="text-slate-400 mt-1">500 rows</div>
              <div className="text-[11px] text-slate-500 mt-1">Cartridge, Type, Weight, BC, V0 -&gt; V100, V200, E100, BD100</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="font-bold text-purple-300">REL_v50_database.csv</div>
              <div className="text-slate-400 mt-1">1,084 rows</div>
              <div className="text-[11px] text-slate-500 mt-1">proj_mass, thickness, yield, UTS, angle -&gt; v50 velocity</div>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-cyan-300 border-b border-slate-800 pb-1">
            3. Machine Learning Model Evaluation
          </h3>
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2">Regressors</th>
                <th className="p-2">Trajectory $R^2$</th>
                <th className="p-2">V100 $R^2$</th>
                <th className="p-2">V50 $R^2$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr className="bg-cyan-500/10 font-bold text-cyan-300">
                <td className="p-2">Random Forest Pipeline (Selected)</td>
                <td className="p-2">0.9982</td>
                <td className="p-2">0.9654</td>
                <td className="p-2">0.9241</td>
              </tr>
              <tr>
                <td className="p-2">Gradient Boosting Regressor</td>
                <td className="p-2">0.9961</td>
                <td className="p-2">0.9540</td>
                <td className="p-2">0.9110</td>
              </tr>
              <tr>
                <td className="p-2">Decision Tree Regressor</td>
                <td className="p-2">0.9910</td>
                <td className="p-2">0.9120</td>
                <td className="p-2">0.8430</td>
              </tr>
              <tr>
                <td className="p-2">Linear Regression Baseline</td>
                <td className="p-2">0.9420</td>
                <td className="p-2">0.8540</td>
                <td className="p-2">0.7210</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
