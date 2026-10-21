import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Save,
  Trash2,
  FolderOpen,
  Info,
  AlertTriangle,
  Table as TableIcon,
  CheckCircle2,
  Activity,
  Zap,
  Target,
  Crosshair
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  Legend
} from 'recharts';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { PageId } from '../components/Sidebar';
import { api } from '../services/api';
import { V50Input, PredictionResult } from '../types';
import { savePredictionToHistory } from '../utils/history';

interface Props {
  setActivePage?: (page: PageId) => void;
}

interface V50PresetItem {
  id: string;
  name: string;
  input: V50Input;
  isBuiltIn?: boolean;
}

interface MaterialDefault {
  density: number;
  modulus: number;
  hardness: number;
  yield: number;
  PR: number;
  UTS: number;
  elongation: number;
  'Ludwik-n': number;
}

const MATERIAL_DEFAULTS: Record<string, MaterialDefault> = {
  Steel: {
    density: 7.85,
    modulus: 210.0,
    hardness: 200.0,
    yield: 400.0,
    PR: 0.3,
    UTS: 600.0,
    elongation: 15.0,
    'Ludwik-n': 0.2
  },
  Aluminum: {
    density: 2.7,
    modulus: 70.0,
    hardness: 120.0,
    yield: 503.0,
    PR: 0.33,
    UTS: 572.0,
    elongation: 11.0,
    'Ludwik-n': 0.15
  },
  Titanium: {
    density: 4.43,
    modulus: 114.0,
    hardness: 330.0,
    yield: 880.0,
    PR: 0.34,
    UTS: 950.0,
    elongation: 14.0,
    'Ludwik-n': 0.12
  },
  Composite: {
    density: 1.44,
    modulus: 45.0,
    hardness: 85.0,
    yield: 250.0,
    PR: 0.38,
    UTS: 380.0,
    elongation: 8.0,
    'Ludwik-n': 0.10
  }
};

const PROJ_DEFAULTS: Record<string, { calibre: number; proj_mass: number; proj_density: number; proj_hardness: number }> = {
  AP: { calibre: 12.7, proj_mass: 45.0, proj_density: 7.85, proj_hardness: 60.0 },
  FSP: { calibre: 20.0, proj_mass: 53.8, proj_density: 7.85, proj_hardness: 60.0 },
  Ball: { calibre: 7.62, proj_mass: 9.5, proj_density: 11.34, proj_hardness: 25.0 },
  'Steel Core': { calibre: 7.62, proj_mass: 9.6, proj_density: 7.85, proj_hardness: 60.0 }
};

const BUILT_IN_V50_PRESETS: V50PresetItem[] = [
  {
    id: 'preset-ap-steel',
    name: 'AP vs 10mm RHA Steel Plate (0°)',
    isBuiltIn: true,
    input: {
      proj_type: 'AP',
      calibre: 12.7,
      proj_mass: 45.0,
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
      angle: 0.0
    }
  },
  {
    id: 'preset-fsp-aluminum',
    name: 'FSP vs 8mm Aluminum 7075 Plate (0°)',
    isBuiltIn: true,
    input: {
      proj_type: 'FSP',
      calibre: 20.0,
      proj_mass: 53.8,
      proj_density: 7.85,
      proj_hardness: 60.0,
      Material: 'Aluminum',
      thickness: 8.0,
      density: 2.7,
      modulus: 70.0,
      hardness: 120.0,
      yield: 503.0,
      PR: 0.33,
      UTS: 572.0,
      elongation: 11.0,
      'Ludwik-n': 0.15,
      angle: 0.0
    }
  },
  {
    id: 'preset-ap-titanium',
    name: 'AP vs 15mm Titanium Ti-6Al-4V (0°)',
    isBuiltIn: true,
    input: {
      proj_type: 'AP',
      calibre: 12.7,
      proj_mass: 45.0,
      proj_density: 7.85,
      proj_hardness: 60.0,
      Material: 'Titanium',
      thickness: 15.0,
      density: 4.43,
      modulus: 114.0,
      hardness: 330.0,
      yield: 880.0,
      PR: 0.34,
      UTS: 950.0,
      elongation: 14.0,
      'Ludwik-n': 0.12,
      angle: 0.0
    }
  },
  {
    id: 'preset-steelcore-oblique',
    name: 'Steel Core vs 6mm Steel (30° Oblique)',
    isBuiltIn: true,
    input: {
      proj_type: 'Steel Core',
      calibre: 7.62,
      proj_mass: 9.6,
      proj_density: 7.85,
      proj_hardness: 60.0,
      Material: 'Steel',
      thickness: 6.0,
      density: 7.85,
      modulus: 210.0,
      hardness: 350.0,
      yield: 1000.0,
      PR: 0.3,
      UTS: 1250.0,
      elongation: 10.0,
      'Ludwik-n': 0.18,
      angle: 30.0
    }
  }
];

const V50_PRESETS_STORAGE_KEY = 'ballistix_v50_calculator_presets';

export const CalculatorPage: React.FC<Props> = ({ setActivePage: _setActivePage }) => {
  // Input parameters state
  const [input, setInput] = useState<V50Input>(BUILT_IN_V50_PRESETS[0].input);

  // Status & Prediction Results
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [calcCount, setCalcCount] = useState<number>(0);

  // Interactive Test Velocity Probe state
  const [testVelocity, setTestVelocity] = useState<number>(619);

  // Presets state
  const [userPresets, setUserPresets] = useState<V50PresetItem[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-ap-steel');
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [presetSavedFeedback, setPresetSavedFeedback] = useState<boolean>(false);

  // Load custom presets on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(V50_PRESETS_STORAGE_KEY);
      if (stored) {
        setUserPresets(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load V50 presets from storage', e);
    }

    // Initial prediction run
    handlePredict(BUILT_IN_V50_PRESETS[0].input);
  }, []);

  const allPresets = useMemo(() => [...BUILT_IN_V50_PRESETS, ...userPresets], [userPresets]);

  const handlePredict = async (customInput?: V50Input) => {
    const targetInput = customInput || input;
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictV50(targetInput);
      setPrediction(res);
      setCalcCount((prev) => prev + 1);

      const predictedV50 = res.prediction?.v50;
      if (typeof predictedV50 === 'number' && predictedV50 > 0) {
        setTestVelocity(Math.round(predictedV50));
      }

      if (res) {
        savePredictionToHistory({
          type: 'V50',
          model_name: res.model_name,
          domain_score: res.domain_score,
          domain_coverage_explanation: res.domain_coverage_explanation,
          source_page: 'V50 Ballistic Calculator',
          input: { ...targetInput },
          output: res.prediction
        });
      }
    } catch (err: any) {
      console.error('V50 prediction error:', err);
      const detail = err?.response?.data?.detail;
      let errorMsg = 'Failed to calculate V50 ballistic limit velocity.';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultInput = BUILT_IN_V50_PRESETS[0].input;
    setInput(defaultInput);
    setSelectedPresetId('preset-ap-steel');
    setError(null);
    handlePredict(defaultInput);
  };

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const target = allPresets.find((p) => p.id === id);
    if (target) {
      setInput(target.input);
      handlePredict(target.input);
    }
  };

  const updateField = (field: keyof V50Input, value: any) => {
    setInput((prev) => ({ ...prev, [field]: value }));
    setSelectedPresetId('custom-active');
  };

  const handleProjTypeChange = (newType: string) => {
    const defaults = PROJ_DEFAULTS[newType] || PROJ_DEFAULTS.AP;
    setInput((prev) => ({
      ...prev,
      proj_type: newType,
      calibre: defaults.calibre,
      proj_mass: defaults.proj_mass,
      proj_density: defaults.proj_density,
      proj_hardness: defaults.proj_hardness
    }));
    setSelectedPresetId('custom-active');
  };

  const handleMaterialChange = (newMat: string) => {
    const defaults = MATERIAL_DEFAULTS[newMat] || MATERIAL_DEFAULTS.Steel;
    setInput((prev) => ({
      ...prev,
      Material: newMat,
      density: defaults.density,
      modulus: defaults.modulus,
      hardness: defaults.hardness,
      yield: defaults.yield,
      PR: defaults.PR,
      UTS: defaults.UTS,
      elongation: defaults.elongation,
      'Ludwik-n': defaults['Ludwik-n']
    }));
    setSelectedPresetId('custom-active');
  };

  const handleSavePreset = () => {
    const trimmed = newPresetName.trim();
    if (!trimmed) return;

    const newPreset: V50PresetItem = {
      id: 'custom-' + Date.now(),
      name: trimmed,
      input: { ...input },
      isBuiltIn: false
    };

    const updated = [...userPresets, newPreset];
    setUserPresets(updated);
    try {
      localStorage.setItem(V50_PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save V50 preset to storage', e);
    }

    setNewPresetName('');
    setSelectedPresetId(newPreset.id);
    setPresetSavedFeedback(true);
    setTimeout(() => setPresetSavedFeedback(false), 2500);
  };

  const handleDeletePreset = (id: string) => {
    const updated = userPresets.filter((p) => p.id !== id);
    setUserPresets(updated);
    try {
      localStorage.setItem(V50_PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update storage after delete', e);
    }
    if (selectedPresetId === id) {
      setSelectedPresetId('preset-ap-steel');
      setInput(BUILT_IN_V50_PRESETS[0].input);
      handlePredict(BUILT_IN_V50_PRESETS[0].input);
    }
  };

  // Generate Sigmoid S-Curve Data for Perforation Probability (%) vs Velocity (m/s)
  const curveData = useMemo(() => {
    if (!prediction) return [];
    const v50 = prediction.prediction?.v50 || 619.4;
    const slope = 0.035; // typical ballistic limit transition steepness

    const points = [];
    const minV = Math.max(30, Math.round(v50 - 250));
    const maxV = Math.round(v50 + 250);
    const step = 5;

    for (let v = minV; v <= maxV; v += step) {
      const prob = 1 / (1 + Math.exp(-slope * (v - v50)));
      const energyJ = Math.round(0.5 * (input.proj_mass / 1000) * v * v);
      points.push({
        velocity: v,
        Probability: Math.round(prob * 1000) / 10, // 0 - 100%
        Energy: energyJ
      });
    }

    const roundedV50 = Math.round(v50);
    if (!points.some((p) => p.velocity === roundedV50)) {
      const prob50 = 1 / (1 + Math.exp(-slope * (roundedV50 - v50)));
      const energy50 = Math.round(0.5 * (input.proj_mass / 1000) * roundedV50 * roundedV50);
      points.push({
        velocity: roundedV50,
        Probability: Math.round(prob50 * 1000) / 10,
        Energy: energy50
      });
      points.sort((a, b) => a.velocity - b.velocity);
    }

    return points;
  }, [prediction, input.proj_mass]);

  // Derived Ballistic Metrics
  const v50Val = prediction?.prediction?.v50 || 0;
  const kineticEnergyJ = v50Val > 0 ? Math.round(0.5 * (input.proj_mass / 1000) * v50Val * v50Val) : 0;
  const kineticEnergyFtLbs = Math.round(kineticEnergyJ * 0.737562);
  const v50Fps = Math.round(v50Val * 3.28084);
  const v50Kmh = Math.round(v50Val * 3.6);

  // Probe telemetry at testVelocity
  const slope = 0.035;
  const currentTestProb = useMemo(() => {
    if (!v50Val) return 50;
    const prob = 1 / (1 + Math.exp(-slope * (testVelocity - v50Val)));
    return Math.round(prob * 1000) / 10;
  }, [testVelocity, v50Val]);

  const currentTestEnergy = useMemo(() => {
    return Math.round(0.5 * (input.proj_mass / 1000) * testVelocity * testVelocity);
  }, [testVelocity, input.proj_mass]);

  const minCurveV = curveData.length > 0 ? curveData[0].velocity : Math.max(30, Math.round(v50Val - 250));
  const maxCurveV = curveData.length > 0 ? curveData[curveData.length - 1].velocity : Math.round(v50Val + 250);

  return (
    <div className="space-y-8 pb-16 font-sans">
      <AcademicDisclaimer />

      {/* Hero Header Section */}
      <div className="relative rounded-2xl glass-panel p-6 sm:p-8 overflow-hidden border border-slate-800 bg-grid-pattern">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Terminal Ballistics & Armor Penetration Calculator</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              V50 ARMOR PENETRATION CALCULATOR
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Calculate the 50% ballistic perforation limit velocity (<code className="text-purple-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono">V50</code>) and evaluate material penetration probability curves using our trained ColumnTransformer Random Forest pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ------------------------------------------------------------- */}
        {/* LEFT COLUMN: Input Parameters & Specimen Presets (5 Cols)      */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 font-mono text-xs">
            
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Specimen Parameters</span>
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                16 Features Pipeline
              </span>
            </div>

            {/* Presets Dropdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <label htmlFor="v50-preset-select" className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Armor Configuration Preset:</span>
                </label>
                {selectedPresetId && !allPresets.find((p) => p.id === selectedPresetId)?.isBuiltIn && selectedPresetId !== 'custom-active' && (
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(selectedPresetId)}
                    className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Delete custom preset"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
              <select
                id="v50-preset-select"
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-400"
              >
                {selectedPresetId === 'custom-active' && (
                  <option value="custom-active" disabled>
                    ✏️ Custom Configuration (Modified)
                  </option>
                )}
                <optgroup label="Standard Test Standards (MIL-STD-662F)">
                  {BUILT_IN_V50_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                {userPresets.length > 0 && (
                  <optgroup label="My Custom Test Presets">
                    {userPresets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Form Inputs */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePredict();
              }}
              className="space-y-3.5 pt-2 border-t border-slate-800"
            >
              {/* Row 1: Projectile Type & Target Material */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Projectile Type:</label>
                  <select
                    value={input.proj_type}
                    onChange={(e) => handleProjTypeChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                  >
                    <option value="AP">Armor Piercing (AP)</option>
                    <option value="FSP">Fragment Simulating (FSP)</option>
                    <option value="Ball">Ball Lead Core</option>
                    <option value="Steel Core">Hardened Steel Core</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Target Material:</label>
                  <select
                    value={input.Material}
                    onChange={(e) => handleMaterialChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                  >
                    <option value="Steel">RHA Steel</option>
                    <option value="Aluminum">Aluminum 7075-T6</option>
                    <option value="Titanium">Titanium Ti-6Al-4V</option>
                    <option value="Composite">Polymer Composite</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Calibre & Projectile Mass */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Calibre (mm):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="100"
                    value={input.calibre}
                    onChange={(e) => updateField('calibre', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Projectile Mass (g):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1000"
                    value={input.proj_mass}
                    onChange={(e) => updateField('proj_mass', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              {/* Row 3: Plate Thickness & Obliquity Angle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Plate Thickness (mm):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="150"
                    value={input.thickness}
                    onChange={(e) => updateField('thickness', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Obliquity Angle (°):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="75"
                    value={input.angle}
                    onChange={(e) => updateField('angle', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Material Strength Attributes (Yield & UTS) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Yield Strength (MPa):</label>
                  <input
                    type="number"
                    step="5"
                    min="50"
                    max="3000"
                    value={input.yield}
                    onChange={(e) => updateField('yield', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">UTS Strength (MPa):</label>
                  <input
                    type="number"
                    step="5"
                    min="50"
                    max="3500"
                    value={input.UTS}
                    onChange={(e) => updateField('UTS', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              {/* Row 5: Material Elongation & Target Hardness */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Elongation (%):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="60"
                    value={input.elongation}
                    onChange={(e) => updateField('elongation', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Target Hardness (HB):</label>
                  <input
                    type="number"
                    step="5"
                    min="50"
                    max="800"
                    value={input.hardness}
                    onChange={(e) => updateField('hardness', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              {/* Error Callout */}
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-indigo flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Evaluating V50 Model...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Calculate V50 Ballistic Limit</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  title="Reset to Standard Test"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Save Custom Preset Input */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Save Specimen as Preset</span>
                {presetSavedFeedback && (
                  <span className="text-emerald-400 flex items-center gap-1 normal-case font-normal text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Custom name (e.g. 12mm Ceramic Composite)"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  disabled={!newPresetName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-purple-300 text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT COLUMN: Results, S-Curve & Probability Table (7 Cols)  */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-6">

          {/* Result Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1: V50 Limit Velocity */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>PREDICTED V50 LIMIT</span>
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-purple-300 font-mono tracking-tight my-2">
                  {loading ? (
                    <span className="text-slate-600 animate-pulse">---.-</span>
                  ) : (
                    <>
                      {v50Val.toFixed(1)}
                      <span className="text-sm font-normal text-slate-400 ml-1.5">m/s</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span>≈ {v50Fps} fps</span>
                <span>•</span>
                <span>≈ {v50Kmh} km/h</span>
              </div>
            </div>

            {/* Card 2: Kinetic Energy at V50 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span>ENERGY AT V50</span>
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-indigo-300 font-mono tracking-tight my-2">
                  {loading ? (
                    <span className="text-slate-600 animate-pulse">----</span>
                  ) : (
                    <>
                      {kineticEnergyJ.toLocaleString()}
                      <span className="text-sm font-normal text-slate-400 ml-1.5">J</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span>≈ {(kineticEnergyJ / 1000).toFixed(2)} kJ</span>
                <span>•</span>
                <span>≈ {kineticEnergyFtLbs.toLocaleString()} ft·lbs</span>
              </div>
            </div>

            {/* Card 3: Domain Coverage */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>DOMAIN COVERAGE</span>
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-300 font-mono tracking-tight my-2">
                  {loading ? (
                    <span className="text-slate-600 animate-pulse">--%</span>
                  ) : (
                    <>{Math.round((prediction?.domain_score || 0) * 100)}%</>
                  )}
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 truncate">
                {prediction?.input_valid ? 'In-Domain Feature Vector' : 'Interpolated Domain'}
              </div>
            </div>

          </div>

          {/* Interactive Perforation Probability S-Curve Graph */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>Perforation Probability vs Impact Velocity S-Curve</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Sigmoidal transition curve centered at critical ballistic limit threshold V50 ({v50Val.toFixed(1)} m/s).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTable(!showTable)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <TableIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>{showTable ? 'Hide Table' : 'Show Probability Table'}</span>
              </button>
            </div>

            {/* S-Curve Area Chart with Key tied to prediction updates */}
            <div className="w-full h-80 sm:h-96">
              {curveData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                  Awaiting model prediction calculation.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" key={`rc-${calcCount}`}>
                  <AreaChart
                    key={`v50-chart-${v50Val.toFixed(1)}-${calcCount}`}
                    data={curveData}
                    margin={{ top: 20, right: 30, left: 15, bottom: 25 }}
                  >
                    <defs>
                      <linearGradient id="v50CurveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                    <XAxis
                      type="number"
                      dataKey="velocity"
                      domain={['dataMin', 'dataMax']}
                      stroke="#64748b"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      label={{
                        value: 'Projectile Impact Velocity (m/s)',
                        position: 'insideBottom',
                        offset: -15,
                        fill: '#cbd5e1',
                        fontSize: 11,
                        fontFamily: 'monospace'
                      }}
                    />

                    <YAxis
                      type="number"
                      domain={[0, 100]}
                      stroke="#64748b"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      label={{
                        value: 'Perforation Probability (%)',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#cbd5e1',
                        fontSize: 11,
                        fontFamily: 'monospace'
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                      formatter={(val: any, name: string) => {
                        if (name === 'Perforation Probability (%)') return [`${val}%`, 'Perforation Probability'];
                        return [val, name];
                      }}
                      labelFormatter={(label) => `Impact Velocity: ${label} m/s`}
                    />

                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}
                    />

                    <Area
                      type="monotone"
                      dataKey="Probability"
                      name="Perforation Probability (%)"
                      stroke="#818cf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#v50CurveGrad)"
                      isAnimationActive={true}
                      animationDuration={600}
                    />

                    {/* V50 50% Horizontal Reference Line */}
                    <ReferenceLine
                      y={50}
                      stroke="#64748b"
                      strokeDasharray="4 4"
                      label={{
                        value: '50% Perforation Threshold',
                        position: 'insideBottomRight',
                        fill: '#94a3b8',
                        fontSize: 10,
                        fontFamily: 'monospace'
                      }}
                    />

                    {/* V50 Vertical Line */}
                    {v50Val > 0 && (
                      <ReferenceLine
                        x={Math.round(v50Val)}
                        stroke="#f43f5e"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* V50 Apex Marker */}
                    {v50Val > 0 && (
                      <ReferenceDot
                        x={Math.round(v50Val)}
                        y={50}
                        r={7}
                        fill="#f43f5e"
                        stroke="#ffffff"
                        strokeWidth={2}
                        label={{
                          value: `V50: ${v50Val.toFixed(1)} m/s (50%)`,
                          position: 'top',
                          fill: '#fda4af',
                          fontSize: 11,
                          fontFamily: 'monospace'
                        }}
                      />
                    )}

                    {/* Interactive Test Velocity Probe Marker if different from V50 */}
                    {testVelocity !== null && Math.abs(testVelocity - Math.round(v50Val)) > 3 && (
                      <>
                        <ReferenceLine
                          x={testVelocity}
                          stroke="#38bdf8"
                          strokeDasharray="2 2"
                        />
                        <ReferenceDot
                          x={testVelocity}
                          y={currentTestProb}
                          r={6}
                          fill="#38bdf8"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                          label={{
                            value: `${testVelocity} m/s (${currentTestProb}%)`,
                            position: currentTestProb > 50 ? 'bottom' : 'top',
                            fill: '#7dd3fc',
                            fontSize: 10,
                            fontFamily: 'monospace'
                          }}
                        />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Interactive Impact Velocity Simulation Probe */}
            {v50Val > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Interactive Impact Velocity Probe
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Armor Outcome:</span>
                    {currentTestProb < 30 ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        Deflection / Ricochet Dominates
                      </span>
                    ) : currentTestProb <= 70 ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        Critical V50 Transition Regime
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                        Target Perforation Complete
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-7 flex items-center gap-3">
                    <label className="text-[11px] text-slate-400 shrink-0">
                      Test Velocity:
                    </label>
                    <input
                      type="range"
                      min={minCurveV}
                      max={maxCurveV}
                      step={1}
                      value={testVelocity}
                      onChange={(e) => setTestVelocity(parseInt(e.target.value) || minCurveV)}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-5 flex items-center justify-end gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                      <input
                        type="number"
                        min={minCurveV}
                        max={maxCurveV}
                        value={testVelocity}
                        onChange={(e) => setTestVelocity(parseInt(e.target.value) || minCurveV)}
                        className="w-16 bg-transparent text-cyan-300 font-bold focus:outline-none text-right font-mono"
                      />
                      <span className="text-slate-500 text-[10px]">m/s</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                        {currentTestProb}% Prob
                      </span>
                      <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {currentTestEnergy.toLocaleString()} J
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTestVelocity(Math.round(v50Val))}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 cursor-pointer transition-colors"
                      title="Snap probe back to exact V50 threshold"
                    >
                      Reset V50
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Educational Standards & Methodology Note */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">Terminal Ballistics Standard (MIL-STD-662F):</strong> The ballistic limit <code className="text-purple-300 font-bold">V50</code> represents the critical impact velocity at which complete penetration of the target material plate has a 50% statistical probability. Below V50, partial penetration and ricochet dominate; above V50, projectile perforation occurs with residual kinetic energy.
              </span>
            </div>

            {/* Collapsible Sampled Velocity Step Table */}
            {showTable && curveData.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Sampled Velocity Regime & Perforation Telemetry
                </h4>
                <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs font-mono text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Velocity (m/s)</th>
                        <th className="px-3 py-2">Perforation Prob (%)</th>
                        <th className="px-3 py-2">Kinetic Energy (J)</th>
                        <th className="px-3 py-2">Armor State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                      {curveData.map((pt, idx) => {
                        const isCloseToV50 = Math.abs(pt.velocity - v50Val) <= 15;
                        const isSubCritical = pt.Probability < 40;
                        const isSuperCritical = pt.Probability > 60;

                        return (
                          <tr key={idx} className={`hover:bg-slate-900/50 ${isCloseToV50 ? 'bg-purple-950/30' : ''}`}>
                            <td className="px-3 py-2 font-semibold text-slate-200">{pt.velocity} m/s</td>
                            <td className="px-3 py-2 text-purple-300 font-bold">{pt.Probability}%</td>
                            <td className="px-3 py-2 text-indigo-300">{pt.Energy?.toLocaleString()} J</td>
                            <td className="px-3 py-2">
                              {isCloseToV50 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                  Critical V50 Threshold
                                </span>
                              ) : isSubCritical ? (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Armor Deflection / Non-Perforation
                                </span>
                              ) : isSuperCritical ? (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Complete Perforation
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Transition Zone
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
