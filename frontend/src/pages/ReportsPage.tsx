import React, { useState } from 'react';
import { FileText, Download, ShieldCheck, Sparkles, Database, Cpu } from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { ModelDomainMonitor } from '../components/ModelDomainMonitor';

export const ReportsPage: React.FC = () => {
  const [reportTitle, setReportTitle] = useState('Ballistic Research & Machine Learning Analysis Report');
  const [selectedDataset, setSelectedDataset] = useState('accurate_ballastic.csv');
  const [selectedModel, setSelectedModel] = useState('Random Forest Regressor (Range/Height)');
  const [domainScore, setDomainScore] = useState(0.92);

  const sampleInputs = { velocity: 650, angle_deg: 45.0, gravity: 9.81 };
  const sampleOutputs = { predicted_range: 2450.8, predicted_max_height: 612.4 };

  const handleDownloadJSON = () => {
    const reportData = {
      project: "ADVANCED BALLISTIC ANALYTICS AND SIMULATION PLATFORM",
      report_title: reportTitle,
      timestamp: new Date().toISOString(),
      dataset_used: selectedDataset,
      model_used: selectedModel,
      input_domain_coverage: `${Math.round(domainScore * 100)}%`,
      input_parameters: sampleInputs,
      predictions: sampleOutputs,
      warnings: ["Parameter velocity=650 m/s is within dataset limits (300-1000 m/s)."],
      academic_disclaimer: "This report is generated for academic research and educational evaluation purposes only. No operational targeting or guidance logic is included."
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `academic_research_report_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <AcademicDisclaimer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>RESEARCH REPORT GENERATOR</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Generate and export reproducible academic research reports
          </p>
        </div>

        <button
          onClick={handleDownloadJSON}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-cyan flex items-center gap-2 transition-all font-mono"
        >
          <Download className="w-4 h-4" />
          <span>Export Research Report (JSON)</span>
        </button>
      </div>

      {/* Report Generator Controls */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
        <h3 className="text-xs font-bold text-slate-200 uppercase font-sans tracking-wider border-b border-slate-800/80 pb-2">
          Report Configuration & Metadata
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 mb-1">Report Title:</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Dataset Reference:</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
            >
              <option value="accurate_ballastic.csv">accurate_ballastic.csv (Trajectory)</option>
              <option value="ballistics_500.csv">ballistics_500.csv (Performance)</option>
              <option value="REL_v50_database_20230527(1).csv">REL_v50_database.csv (V50 Material)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Target Model:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
            >
              <option value="Random Forest Regressor (Range/Height)">Random Forest Regressor (Trajectory)</option>
              <option value="Random Forest Pipeline (V100/V200)">Random Forest Pipeline (Cartridge)</option>
              <option value="Random Forest ColumnTransformer Pipeline (V50)">Random Forest Pipeline (V50 Armor)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Report Document Preview */}
      <div className="glass-card p-8 rounded-2xl border border-slate-800 space-y-6 text-slate-200 text-xs font-mono max-w-4xl mx-auto">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] uppercase font-bold">
              Generated Research Report
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-2 font-sans">{reportTitle}</h2>
            <div className="text-slate-400 text-[11px] mt-1">Generated: {new Date().toLocaleString()}</div>
          </div>
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>

        {/* Model Domain Monitor */}
        <ModelDomainMonitor domainScore={domainScore} explanation="Input domain coverage evaluated against training bounds." />

        {/* Report Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-slate-400 text-[10px] uppercase block font-bold">Input Parameters</span>
            <pre className="text-cyan-300 text-[11px] leading-relaxed">{JSON.stringify(sampleInputs, null, 2)}</pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-slate-400 text-[10px] uppercase block font-bold">Model Predictions</span>
            <pre className="text-emerald-300 text-[11px] leading-relaxed">{JSON.stringify(sampleOutputs, null, 2)}</pre>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-[11px] leading-relaxed font-sans">
          <strong>Academic Disclaimer:</strong> This document is generated for academic machine learning research and educational trajectory physics simulation. It does not provide operational guidance or weapon targeting assistance.
        </div>
      </div>
    </div>
  );
};
