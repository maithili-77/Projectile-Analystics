import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Target,
  Info,
  AlertTriangle,
  BarChart2,
  Table as TableIcon,
  Layers,
  Settings,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  FolderOpen,
  Sliders,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Palette
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot,
  ReferenceLine
} from 'recharts';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { PageId } from '../components/Sidebar';
import { api } from '../services/api';
import {
  TrajectoryInput,
  PerformanceInput,
  V50Input,
  PredictionResult
} from '../types';

interface Props {
  setActivePage?: (page: PageId) => void;
}

interface PlotPoint {
  x: number; // Downrange distance in meters
  y: number; // Altitude / height in meters
  time: number; // Flight time in seconds
  velocity: number; // Estimated velocity in m/s
  phase: string;
}

interface TrajectorySeries {
  id: string;
  name: string;
  velocity: number;
  angleDeg: number;
  gravity: number;
  color: string;
  visible: boolean;
  predictedRange: number;
  predictedHeight: number;
  points: { x: number; y: number }[];
}

interface PresetItem {
  id: string;
  name: string;
  velocity: number;
  angleDeg: number;
  gravity: number;
  isBuiltIn?: boolean;
}

interface ChartConfig {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  height: number;
  showGrid: boolean;
  showTooltip: boolean;
  showApexDot: boolean;
  showImpactDot: boolean;
  showFillGradient: boolean;
  showLegend: boolean;
  primaryColor: string;
}

const DEFAULT_CHART_CONFIG: ChartConfig = {
  title: 'Interactive Trajectory Profile',
  xAxisLabel: 'Downrange Distance (m)',
  yAxisLabel: 'Altitude / Height (m)',
  height: 380,
  showGrid: true,
  showTooltip: true,
  showApexDot: true,
  showImpactDot: true,
  showFillGradient: true,
  showLegend: true,
  primaryColor: '#22d3ee'
};

const BUILT_IN_PRESETS: PresetItem[] = [
  { id: 'preset-rifle', name: 'Standard Rifle (800 m/s, 30°)', velocity: 800, angleDeg: 30, gravity: 9.81, isBuiltIn: true },
  { id: 'preset-max', name: 'Max Range Trajectory (600 m/s, 45°)', velocity: 600, angleDeg: 45, gravity: 9.81, isBuiltIn: true },
  { id: 'preset-mortar', name: 'High-Angle Mortar (400 m/s, 65°)', velocity: 400, angleDeg: 65, gravity: 9.81, isBuiltIn: true },
  { id: 'preset-handgun', name: 'Subsonic Handgun (340 m/s, 15°)', velocity: 340, angleDeg: 15, gravity: 9.81, isBuiltIn: true }
];

const PRESET_STORAGE_KEY = 'ballistix_calc_user_presets';
const CHART_CONFIG_STORAGE_KEY = 'ballistix_calc_chart_config';

const COLOR_OPTIONS = [
  { name: 'Cyan', hex: '#22d3ee' },
  { name: 'Indigo', hex: '#818cf8' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Purple', hex: '#c084fc' }
];

export const CalculatorPage: React.FC<Props> = ({ setActivePage }) => {
  // Mode Selector: trajectory (accurate_ballastic), performance (ballistics_500), v50 (material)
  const [calculatorMode, setCalculatorMode] = useState<'trajectory' | 'performance' | 'v50'>('trajectory');

  // ==========================================
  // 1. TRAJECTORY CALCULATOR (Panel A, B, C)
  // ==========================================
  const [velocity, setVelocity] = useState<number>(600);
  const [angleDeg, setAngleDeg] = useState<number>(45);
  const [gravity, setGravity] = useState<number>(9.81);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [plotData, setPlotData] = useState<PlotPoint[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);

  // Panel Selection / Active Tab for Trajectory Mode
  const [activePanelTab, setActivePanelTab] = useState<'single' | 'multiple' | 'customize'>('single');

  // Presets State
  const [userPresets, setUserPresets] = useState<PresetItem[]>([]);
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [presetSavedFeedback, setPresetSavedFeedback] = useState<boolean>(false);

  // Panel B: Multiple Trajectory Series State
  const [seriesList, setSeriesList] = useState<TrajectorySeries[]>([]);
  const [newSeriesName, setNewSeriesName] = useState<string>('');
  const [newSeriesColor, setNewSeriesColor] = useState<string>('#818cf8');
  const [isAddingSeries, setIsAddingSeries] = useState<boolean>(false);

  // Panel C: Chart Customization State
  const [chartConfig, setChartConfig] = useState<ChartConfig>(DEFAULT_CHART_CONFIG);
  const [configSavedFeedback, setConfigSavedFeedback] = useState<boolean>(false);

  // ==========================================
  // 2. PERFORMANCE CALCULATOR (ballistics_500)
  // ==========================================
  const [perfInput, setPerfInput] = useState<PerformanceInput>({
    Cartridge: '.308 WINCHESTER',
    Type: 'Rifle',
    Weight: 168,
    BC: 0.462,
    V0: 2650
  });
  const [perfLoading, setPerfLoading] = useState<boolean>(false);
  const [perfError, setPerfError] = useState<string | null>(null);
  const [perfResult, setPerfResult] = useState<PredictionResult | null>(null);
  const [perfActiveMetric, setPerfActiveMetric] = useState<'velocity' | 'energy' | 'drop'>('velocity');

  // ==========================================
  // 3. V50 TERMINAL PENETRATION CALCULATOR
  // ==========================================
  const [v50Input, setV50Input] = useState<V50Input>({
    proj_type: 'AP',
    calibre: 6.25,
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
    angle: 0.0
  });
  const [v50Loading, setV50Loading] = useState<boolean>(false);
  const [v50Error, setV50Error] = useState<string | null>(null);
  const [v50Result, setV50Result] = useState<PredictionResult | null>(null);

  // ==========================================
  // INITIALIZATION & PERSISTENCE
  // ==========================================
  useEffect(() => {
    // Load presets from localStorage
    try {
      const storedPresets = localStorage.getItem(PRESET_STORAGE_KEY);
      if (storedPresets) {
        setUserPresets(JSON.parse(storedPresets));
      }
    } catch (e) {
      console.warn('Could not read user presets from storage', e);
    }

    // Load chart config from localStorage
    try {
      const storedConfig = localStorage.getItem(CHART_CONFIG_STORAGE_KEY);
      if (storedConfig) {
        setChartConfig({ ...DEFAULT_CHART_CONFIG, ...JSON.parse(storedConfig) });
      }
    } catch (e) {
      console.warn('Could not read chart config from storage', e);
    }

    // Initial prediction run
    handlePredict(600, 45, 9.81);
  }, []);

  // Validation hook for Trajectory parameters
  useEffect(() => {
    if (velocity <= 0 || velocity > 3000) {
      setValidationWarning('Initial velocity should be between 1 and 3000 m/s');
    } else if (angleDeg <= 0 || angleDeg >= 90) {
      setValidationWarning('Launch angle must be between 0.1° and 89.9°');
    } else if (gravity <= 0 || gravity > 30) {
      setValidationWarning('Gravity acceleration must be positive (0.1 - 30 m/s²)');
    } else {
      setValidationWarning(null);
    }
  }, [velocity, angleDeg, gravity]);

  // ==========================================
  // TRAJECTORY METHODS (Panel A, B, C)
  // ==========================================
  const generateTrajectoryPoints = (
    v0: number,
    deg: number,
    g: number,
    rangePred: number,
    heightPred: number,
    numSteps = 50
  ): PlotPoint[] => {
    const rad = (deg * Math.PI) / 180;
    const v0x = v0 * Math.cos(rad);
    const v0y = v0 * Math.sin(rad);

    const totalTime = v0x > 0 ? rangePred / v0x : (2 * v0y) / g;
    const theoreticalMaxY = (v0y * v0y) / (2 * g);
    const heightScale = theoreticalMaxY > 0 ? heightPred / theoreticalMaxY : 1;

    const points: PlotPoint[] = [];
    for (let i = 0; i <= numSteps; i++) {
      const frac = i / numSteps;
      const x = Math.round(frac * rangePred * 100) / 100;
      const t = Math.round(frac * totalTime * 100) / 100;

      const rawY = Math.max(0, x * Math.tan(rad) - (g * x * x) / (2 * v0x * v0x));
      const y = Math.round(rawY * heightScale * 100) / 100;

      const vy = v0y - g * t;
      const vInst = Math.round(Math.sqrt(v0x * v0x + vy * vy) * 100) / 100;

      let phase = 'Flight';
      if (i === 0) phase = 'Launch';
      else if (i === Math.floor(numSteps / 2)) phase = 'Apex';
      else if (i === numSteps) phase = 'Impact';
      else if (i < numSteps / 2) phase = 'Ascent';
      else phase = 'Descent';

      points.push({ x, y, time: t, velocity: vInst, phase });
    }
    return points;
  };

  const handlePredict = async (v = velocity, a = angleDeg, g = gravity) => {
    if (v <= 0 || a <= 0 || a >= 90 || g <= 0) {
      setError('Please provide valid velocity, launch angle, and gravity values.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const inputData: TrajectoryInput = {
        velocity: Number(v),
        angle_deg: Number(a),
        gravity: Number(g)
      };

      const result = await api.predictTrajectory(inputData);
      setPredictionResult(result);

      const points = generateTrajectoryPoints(
        v,
        a,
        g,
        result.prediction.range_actual,
        result.prediction.max_height_actual
      );
      setPlotData(points);
    } catch (err: any) {
      console.error('Trajectory prediction error:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to connect to ML prediction backend server.');
      setPredictionResult(null);
      setPlotData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setVelocity(600);
    setAngleDeg(45);
    setGravity(9.81);
    setError(null);
    setValidationWarning(null);
    handlePredict(600, 45, 9.81);
  };

  // Preset Handlers
  const allPresets = useMemo(() => [...BUILT_IN_PRESETS, ...userPresets], [userPresets]);

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const target = allPresets.find((p) => p.id === id);
    if (target) {
      setVelocity(target.velocity);
      setAngleDeg(target.angleDeg);
      setGravity(target.gravity);
      handlePredict(target.velocity, target.angleDeg, target.gravity);
    }
  };

  const handleSavePreset = () => {
    const trimmed = presetNameInput.trim();
    if (!trimmed) return;

    const newPreset: PresetItem = {
      id: 'custom-' + Date.now(),
      name: trimmed,
      velocity,
      angleDeg,
      gravity,
      isBuiltIn: false
    };

    const updated = [...userPresets, newPreset];
    setUserPresets(updated);
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage failed', e);
    }
    setPresetNameInput('');
    setSelectedPresetId(newPreset.id);
    setPresetSavedFeedback(true);
    setTimeout(() => setPresetSavedFeedback(false), 2500);
  };

  const handleDeletePreset = (id: string) => {
    const updated = userPresets.filter((p) => p.id !== id);
    setUserPresets(updated);
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage failed', e);
    }
    if (selectedPresetId === id) {
      setSelectedPresetId('');
    }
  };

  // Panel B: Multiple Series Handlers
  const handleAddCurrentAsSeries = async () => {
    if (!predictionResult) return;
    setIsAddingSeries(true);
    try {
      const name = newSeriesName.trim() || `Series ${seriesList.length + 1} (${velocity}m/s, ${angleDeg}°)`;
      const pts = generateTrajectoryPoints(
        velocity,
        angleDeg,
        gravity,
        predictionResult.prediction.range_actual,
        predictionResult.prediction.max_height_actual
      );

      const newSeries: TrajectorySeries = {
        id: 'series-' + Date.now(),
        name,
        velocity,
        angleDeg,
        gravity,
        color: newSeriesColor,
        visible: true,
        predictedRange: predictionResult.prediction.range_actual,
        predictedHeight: predictionResult.prediction.max_height_actual,
        points: pts.map((p) => ({ x: p.x, y: p.y }))
      };

      setSeriesList((prev) => [...prev, newSeries]);
      setNewSeriesName('');
    } finally {
      setIsAddingSeries(false);
    }
  };

  const handleToggleSeriesVisibility = (id: string) => {
    setSeriesList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleRemoveSeries = (id: string) => {
    setSeriesList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllSeries = () => {
    setSeriesList([]);
  };

  // Build combined multi-series data for Panel B
  const multiSeriesPlotData = useMemo(() => {
    const activeSeries = seriesList.filter((s) => s.visible);
    if (activeSeries.length === 0) return [];

    // Max range across all active series
    const maxRange = Math.max(...activeSeries.map((s) => s.predictedRange));
    const numSamples = 60;
    const sampledData: Array<Record<string, any>> = [];

    for (let i = 0; i <= numSamples; i++) {
      const sampleX = Math.round((i / numSamples) * maxRange);
      const row: Record<string, any> = { x: sampleX };

      activeSeries.forEach((series) => {
        if (sampleX > series.predictedRange) {
          row[series.id] = null;
        } else {
          // Find interpolated y for sampleX
          const rad = (series.angleDeg * Math.PI) / 180;
          const v0x = series.velocity * Math.cos(rad);
          const v0y = series.velocity * Math.sin(rad);
          const theoreticalMaxY = (v0y * v0y) / (2 * series.gravity);
          const heightScale = theoreticalMaxY > 0 ? series.predictedHeight / theoreticalMaxY : 1;
          const rawY = Math.max(0, sampleX * Math.tan(rad) - (series.gravity * sampleX * sampleX) / (2 * v0x * v0x));
          row[series.id] = Math.round(rawY * heightScale * 10) / 10;
        }
      });

      sampledData.push(row);
    }

    return sampledData;
  }, [seriesList]);

  // Panel C: Chart Customization Handlers
  const handleSaveChartConfig = () => {
    try {
      localStorage.setItem(CHART_CONFIG_STORAGE_KEY, JSON.stringify(chartConfig));
      setConfigSavedFeedback(true);
      setTimeout(() => setConfigSavedFeedback(false), 2500);
    } catch (e) {
      console.warn('Config save failed', e);
    }
  };

  const handleResetChartConfig = () => {
    setChartConfig(DEFAULT_CHART_CONFIG);
    try {
      localStorage.removeItem(CHART_CONFIG_STORAGE_KEY);
    } catch (e) {
      console.warn('Config removal failed', e);
    }
  };

  // ==========================================
  // PERFORMANCE PREDICTION (ballistics_500)
  // ==========================================
  const handlePredictPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    setPerfLoading(true);
    setPerfError(null);
    try {
      const res = await api.predictPerformance(perfInput);
      setPerfResult(res);
    } catch (err: any) {
      console.error('Performance prediction error:', err);
      setPerfError(err?.response?.data?.detail || err?.message || 'Failed to predict small arms performance.');
    } finally {
      setPerfLoading(false);
    }
  };

  // Performance Comparison Chart Data (0, 100, 200 yds)
  const perfChartData = useMemo(() => {
    if (!perfResult) return [];
    const pred = perfResult.prediction;

    if (perfActiveMetric === 'velocity') {
      return [
        { distance: 'Muzzle (0 yds)', value: perfInput.V0, unit: 'fps' },
        { distance: '100 yds', value: pred.v100 || 0, unit: 'fps' },
        { distance: '200 yds', value: pred.v200 || 0, unit: 'fps' }
      ];
    } else if (perfActiveMetric === 'energy') {
      // Calculate Muzzle Energy: E0 = (Weight * V0^2) / 450240 in ft-lbs
      const e0 = Math.round((perfInput.Weight * Math.pow(perfInput.V0, 2)) / 450240);
      return [
        { distance: 'Muzzle (0 yds)', value: e0, unit: 'ft-lbs' },
        { distance: '100 yds', value: pred.e100 || 0, unit: 'ft-lbs' },
        { distance: '200 yds', value: pred.e200 || 0, unit: 'ft-lbs' }
      ];
    } else {
      return [
        { distance: 'Muzzle (0 yds)', value: 0, unit: 'in' },
        { distance: '100 yds', value: pred.bd100 || 0, unit: 'in' },
        { distance: '200 yds', value: pred.bd200 || 0, unit: 'in' }
      ];
    }
  }, [perfResult, perfInput, perfActiveMetric]);

  // ==========================================
  // V50 MATERIAL RESEARCH PREDICTION
  // ==========================================
  const handlePredictV50 = async (e: React.FormEvent) => {
    e.preventDefault();
    setV50Loading(true);
    setV50Error(null);
    try {
      const res = await api.predictV50(v50Input);
      setV50Result(res);
    } catch (err: any) {
      console.error('V50 prediction error:', err);
      setV50Error(err?.response?.data?.detail || err?.message || 'Failed to predict V50 ballistic limit.');
    } finally {
      setV50Loading(false);
    }
  };

  // Generate Sigmoid S-Curve for V50 Material Perforation Probability
  const v50CurveData = useMemo(() => {
    if (!v50Result) return [];
    const v50 = v50Result.prediction.v50 || 700;
    const slope = 0.035; // typical ballistic limit transition steepness

    const points = [];
    const minV = Math.max(100, Math.round(v50 - 200));
    const maxV = Math.round(v50 + 200);

    for (let v = minV; v <= maxV; v += 10) {
      // Logistic sigmoid: P = 1 / (1 + exp(-k * (v - v50)))
      const prob = 1 / (1 + Math.exp(-slope * (v - v50)));
      points.push({
        velocity: v,
        Probability: Math.round(prob * 1000) / 10 // Percentage (0 - 100%)
      });
    }

    return points;
  }, [v50Result]);

  const rangeVal = predictionResult?.prediction.range_actual || 0;
  const heightVal = predictionResult?.prediction.max_height_actual || 0;

  return (
    <div className="space-y-8 pb-16 font-sans">
      <AcademicDisclaimer />

      {/* Hero Header with Academic Context */}
      <div className="relative rounded-2xl glass-panel p-6 sm:p-8 overflow-hidden border border-slate-800 bg-grid-pattern">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Dataset Ballistic Prediction & Educational Graph Workspace</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              BALLISTIC CALCULATOR LAB
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Explore trajectory, aerodynamic velocity decay, and terminal armor penetration predictions backed by real pre-trained Random Forest pipelines.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 gap-1.5 shrink-0 self-start md:self-center">
            <button
              onClick={() => setCalculatorMode('trajectory')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                calculatorMode === 'trajectory'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Trajectory (Range/Height)</span>
            </button>

            <button
              onClick={() => setCalculatorMode('performance')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                calculatorMode === 'performance'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Small Arms (V/E/Drop)</span>
            </button>

            <button
              onClick={() => setCalculatorMode('v50')}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                calculatorMode === 'v50'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>V50 Penetration</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TRAJECTORY CALCULATOR (Panel A, B, and C)                         */}
      {/* ========================================================================= */}
      {calculatorMode === 'trajectory' && (
        <div className="space-y-6">
          {/* Sub-navigation for Panels on Desktop / Mobile */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Workspace Panels:</span>
              <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActivePanelTab('single')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePanelTab === 'single'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Panel A: Single Trajectory</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanelTab('multiple')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePanelTab === 'multiple'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Panel B: Multi-Trajectory ({seriesList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanelTab('customize')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePanelTab === 'customize'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Panel C: Chart Customization</span>
                </button>
              </div>
            </div>

            <span className="hidden md:inline-flex text-[11px] font-mono text-slate-500">
              accurate_ballastic.csv &bull; Random Forest Models
            </span>
          </div>

          {/* MAIN 3-PANEL RESPONSIVE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ----------------------------------------------------------- */}
            {/* LEFT COLUMN: Input Form & Preset Manager (4 Cols on LG)     */}
            {/* ----------------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Inputs & Presets</span>
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    3 Features
                  </span>
                </div>

                {/* Preset Selector Dropdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <label htmlFor="preset-select" className="flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Load Configuration Preset:</span>
                    </label>
                    {selectedPresetId && !allPresets.find((p) => p.id === selectedPresetId)?.isBuiltIn && (
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(selectedPresetId)}
                        className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Delete this custom preset"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                  <select
                    id="preset-select"
                    value={selectedPresetId}
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose Built-In or Saved Preset --</option>
                    <optgroup label="Standard Built-in Presets">
                      {BUILT_IN_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                    {userPresets.length > 0 && (
                      <optgroup label="My Saved Custom Presets">
                        {userPresets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.velocity}m/s, {p.angleDeg}°)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Input Parameters Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePredict();
                  }}
                  className="space-y-4 text-xs font-mono"
                >
                  {/* Feature 1: Velocity */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="calc-velocity" className="font-semibold text-slate-200">
                        Initial Velocity (<code className="text-cyan-300">velocity</code>)
                      </label>
                      <span className="text-cyan-400 font-bold">{velocity} m/s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="calc-velocity"
                        type="number"
                        min="1"
                        max="3000"
                        step="1"
                        value={velocity}
                        onChange={(e) => setVelocity(Number(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                        required
                      />
                      <input
                        type="range"
                        min="50"
                        max="1500"
                        step="5"
                        value={Math.min(velocity, 1500)}
                        onChange={(e) => setVelocity(Number(e.target.value) || 0)}
                        className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">Unit: m/s (Standard Earth Atmosphere)</span>
                  </div>

                  {/* Feature 2: Launch Angle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="calc-angle" className="font-semibold text-slate-200">
                        Launch Angle (<code className="text-cyan-300">angle_deg</code>)
                      </label>
                      <span className="text-cyan-400 font-bold">{angleDeg}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="calc-angle"
                        type="number"
                        min="0.1"
                        max="89.9"
                        step="0.1"
                        value={angleDeg}
                        onChange={(e) => setAngleDeg(Number(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                        required
                      />
                      <input
                        type="range"
                        min="1"
                        max="89"
                        step="0.5"
                        value={angleDeg}
                        onChange={(e) => setAngleDeg(Number(e.target.value) || 0)}
                        className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">Unit: Degrees (0.1° – 89.9°)</span>
                  </div>

                  {/* Feature 3: Gravity */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="calc-gravity" className="font-semibold text-slate-200">
                        Gravity (<code className="text-cyan-300">gravity</code>)
                      </label>
                      <span className="text-cyan-400 font-bold">{gravity} m/s²</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="calc-gravity"
                        type="number"
                        min="0.1"
                        max="30"
                        step="0.01"
                        value={gravity}
                        onChange={(e) => setGravity(Number(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                        required
                      />
                      <input
                        type="range"
                        min="1"
                        max="25"
                        step="0.1"
                        value={Math.min(gravity, 25)}
                        onChange={(e) => setGravity(Number(e.target.value) || 0)}
                        className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">Standard Earth: 9.81 m/s²</span>
                  </div>

                  {/* Validation Warning */}
                  {validationWarning && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validationWarning}</span>
                    </div>
                  )}

                  {/* API Error Message */}
                  {error && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Primary Predict Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-glow-cyan flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Calculating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Create Graph / Predict</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      title="Reset Inputs"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Save Current as New Preset Form */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider flex items-center justify-between">
                    <span>Save Current as Preset</span>
                    {presetSavedFeedback && (
                      <span className="text-emerald-400 flex items-center gap-1 normal-case font-normal">
                        <CheckCircle2 className="w-3 h-3" /> Saved!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Preset name (e.g. 7.62mm Flat Arc)"
                      value={presetNameInput}
                      onChange={(e) => setPresetNameInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleSavePreset}
                      disabled={!presetNameInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 text-xs font-mono border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                {/* Quick Add to Multi-Series Action */}
                <div className="pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleAddCurrentAsSeries}
                    disabled={!predictionResult || isAddingSeries}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-mono border border-indigo-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Panel B Comparison Series</span>
                  </button>
                </div>

              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* RIGHT COLUMN: Tabbed Workspace (8 Cols on LG)               */}
            {/* ----------------------------------------------------------- */}
            <div className="lg:col-span-8 space-y-6">

              {/* Top Result Cards (Range & Max Height) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Predicted Range Card */}
                <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span>PREDICTED ACTUAL RANGE</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px]">
                      ML Output: range_actual
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight my-2">
                    {loading ? (
                      <span className="text-slate-600 animate-pulse">---.--</span>
                    ) : (
                      <>
                        {rangeVal.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        <span className="text-lg font-normal text-cyan-400 ml-2">m</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <span>≈ {(rangeVal / 1000).toFixed(2)} km</span>
                    <span>•</span>
                    <span>≈ {(rangeVal * 1.09361).toFixed(0)} yards</span>
                    <span>•</span>
                    <span>≈ {(rangeVal * 3.28084).toFixed(0)} ft</span>
                  </div>
                </div>

                {/* Predicted Max Height Card */}
                <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-400" />
                      <span>PREDICTED APEX ALTITUDE</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px]">
                      ML Output: max_height_actual
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight my-2">
                    {loading ? (
                      <span className="text-slate-600 animate-pulse">---.--</span>
                    ) : (
                      <>
                        {heightVal.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        <span className="text-lg font-normal text-indigo-400 ml-2">m</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <span>Apex Altitude</span>
                    <span>•</span>
                    <span>≈ {(heightVal / 1000).toFixed(2)} km</span>
                    <span>•</span>
                    <span>≈ {(heightVal * 3.28084).toFixed(0)} ft</span>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* TAB CONTENT: Panel A — Single Trajectory Graph & Table       */}
              {/* ------------------------------------------------------------- */}
              {activePanelTab === 'single' && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                        {chartConfig.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTable(!showTable)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{showTable ? 'Hide Table' : 'Show Position Table'}</span>
                    </button>
                  </div>

                  {/* Recharts Area Chart */}
                  <div style={{ width: '100%', height: `${chartConfig.height}px` }}>
                    {plotData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                        No trajectory points available. Click "Create Graph / Predict".
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={plotData} margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
                          <defs>
                            <linearGradient id="singleTrajectoryGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartConfig.primaryColor} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={chartConfig.primaryColor} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>

                          {chartConfig.showGrid && (
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          )}

                          <XAxis
                            dataKey="x"
                            stroke="#64748b"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            label={{
                              value: chartConfig.xAxisLabel,
                              position: 'insideBottom',
                              offset: -15,
                              fill: '#cbd5e1',
                              fontSize: 11,
                              fontFamily: 'monospace'
                            }}
                          />

                          <YAxis
                            stroke="#64748b"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            label={{
                              value: chartConfig.yAxisLabel,
                              angle: -90,
                              position: 'insideLeft',
                              fill: '#cbd5e1',
                              fontSize: 11,
                              fontFamily: 'monospace'
                            }}
                          />

                          {chartConfig.showTooltip && (
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '0.75rem',
                                color: '#f8fafc',
                                fontSize: '12px',
                                fontFamily: 'monospace'
                              }}
                              formatter={(val: any, name: string) => {
                                if (name === 'Reference Flight Profile (m)') return [`${val} m`, 'Height'];
                                return [val, name];
                              }}
                              labelFormatter={(label) => `Distance: ${label} m`}
                            />
                          )}

                          {chartConfig.showLegend && (
                            <Legend
                              verticalAlign="top"
                              height={36}
                              wrapperStyle={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}
                            />
                          )}

                          <Area
                            type="monotone"
                            dataKey="y"
                            name="Reference Flight Profile (m)"
                            stroke={chartConfig.primaryColor}
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill={chartConfig.showFillGradient ? 'url(#singleTrajectoryGrad)' : 'transparent'}
                          />

                          {chartConfig.showApexDot && heightVal > 0 && (
                            <ReferenceDot
                              x={plotData[Math.floor(plotData.length / 2)]?.x || 0}
                              y={heightVal}
                              r={6}
                              fill="#818cf8"
                              stroke="#ffffff"
                              strokeWidth={2}
                              label={{
                                value: `Apex ML: ${heightVal.toFixed(0)}m`,
                                position: 'top',
                                fill: '#a5b4fc',
                                fontSize: 11,
                                fontFamily: 'monospace'
                              }}
                            />
                          )}

                          {chartConfig.showImpactDot && rangeVal > 0 && (
                            <ReferenceDot
                              x={rangeVal}
                              y={0}
                              r={6}
                              fill={chartConfig.primaryColor}
                              stroke="#ffffff"
                              strokeWidth={2}
                              label={{
                                value: `Impact ML: ${rangeVal.toFixed(0)}m`,
                                position: 'top',
                                fill: '#67e8f9',
                                fontSize: 11,
                                fontFamily: 'monospace'
                              }}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Informational Disclaimer */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-200">Scientific Distinction:</strong> The trained Random Forest model predicts discrete scalar outputs (<code className="text-cyan-300">range_actual</code> and <code className="text-indigo-300">max_height_actual</code>). The continuous line above is an educational kinematic flight path scaled to the model predictions.
                    </span>
                  </div>

                  {/* Collapsible Sampled Position Table */}
                  {showTable && plotData.length > 0 && (
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                        Sampled Trajectory Telemetry (Downrange Positions)
                      </h4>
                      <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-800">
                        <table className="w-full text-left text-xs font-mono text-slate-300">
                          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                            <tr>
                              <th className="px-3 py-2">Step</th>
                              <th className="px-3 py-2">Distance (m)</th>
                              <th className="px-3 py-2">Altitude (m)</th>
                              <th className="px-3 py-2">Flight Time (s)</th>
                              <th className="px-3 py-2">Speed (m/s)</th>
                              <th className="px-3 py-2">Phase</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                            {plotData.filter((_, idx) => idx % 5 === 0 || idx === plotData.length - 1).map((pt, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/50">
                                <td className="px-3 py-2 text-slate-500">#{idx + 1}</td>
                                <td className="px-3 py-2 text-cyan-300 font-semibold">{pt.x.toLocaleString()} m</td>
                                <td className="px-3 py-2 text-indigo-300 font-semibold">{pt.y.toLocaleString()} m</td>
                                <td className="px-3 py-2 text-slate-300">{pt.time} s</td>
                                <td className="px-3 py-2 text-slate-300">{pt.velocity} m/s</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                                    pt.phase === 'Launch' ? 'bg-cyan-500/20 text-cyan-300' :
                                    pt.phase === 'Apex' ? 'bg-indigo-500/20 text-indigo-300' :
                                    pt.phase === 'Impact' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {pt.phase}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB CONTENT: Panel B — Multiple Trajectory Comparison         */}
              {/* ------------------------------------------------------------- */}
              {activePanelTab === 'multiple' && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span>Multi-Trajectory Comparison Graph</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Overlay multiple educational flight curves to compare trajectory envelopes across velocities & angles.
                      </p>
                    </div>

                    {seriesList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSeries}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-mono border border-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>

                  {/* Series Comparison Graph */}
                  <div style={{ width: '100%', height: `${chartConfig.height}px` }}>
                    {seriesList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-3 p-6 text-center border border-dashed border-slate-800 rounded-xl">
                        <Layers className="w-8 h-8 text-slate-600" />
                        <span>No comparison series added yet.</span>
                        <button
                          type="button"
                          onClick={handleAddCurrentAsSeries}
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Current Trajectory as Series 1</span>
                        </button>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={multiSeriesPlotData} margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="x"
                            stroke="#64748b"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            label={{
                              value: 'Downrange Distance (m)',
                              position: 'insideBottom',
                              offset: -15,
                              fill: '#cbd5e1',
                              fontSize: 11,
                              fontFamily: 'monospace'
                            }}
                          />
                          <YAxis
                            stroke="#64748b"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            label={{
                              value: 'Altitude / Height (m)',
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
                              color: '#f8fafc',
                              fontSize: '11px',
                              fontFamily: 'monospace'
                            }}
                            labelFormatter={(val) => `Distance: ${val} m`}
                          />
                          <Legend
                            verticalAlign="top"
                            height={36}
                            wrapperStyle={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}
                          />

                          {seriesList.map((series) =>
                            series.visible ? (
                              <Line
                                key={series.id}
                                type="monotone"
                                dataKey={series.id}
                                name={series.name}
                                stroke={series.color}
                                strokeWidth={2.5}
                                dot={false}
                                isAnimationActive={false}
                              />
                            ) : null
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Series List & Management Table */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                        Active Graph Series ({seriesList.length})
                      </h4>
                      <div className="flex items-center gap-2">
                        <select
                          value={newSeriesColor}
                          onChange={(e) => setNewSeriesColor(e.target.value)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200"
                        >
                          {COLOR_OPTIONS.map((c) => (
                            <option key={c.hex} value={c.hex}>
                              Color: {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddCurrentAsSeries}
                          disabled={!predictionResult}
                          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Current Form</span>
                        </button>
                      </div>
                    </div>

                    {seriesList.length > 0 && (
                      <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-900/40">
                        {seriesList.map((series) => (
                          <div key={series.id} className="p-3 flex items-center justify-between text-xs font-mono gap-3">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleSeriesVisibility(series.id)}
                                className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                                title={series.visible ? 'Hide from graph' : 'Show on graph'}
                              >
                                {series.visible ? (
                                  <Eye className="w-4 h-4 text-cyan-400" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-slate-600" />
                                )}
                              </button>

                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: series.color }}
                              />

                              <div>
                                <span className={`font-semibold ${series.visible ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                                  {series.name}
                                </span>
                                <div className="text-[10px] text-slate-500 flex gap-2">
                                  <span>V: {series.velocity}m/s</span>
                                  <span>&bull;</span>
                                  <span>Angle: {series.angleDeg}°</span>
                                  <span>&bull;</span>
                                  <span>Range: {series.predictedRange.toFixed(1)}m</span>
                                  <span>&bull;</span>
                                  <span>Apex: {series.predictedHeight.toFixed(1)}m</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSeries(series.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                              title="Remove series"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB CONTENT: Panel C — Chart Customization & Visual Styling   */}
              {/* ------------------------------------------------------------- */}
              {activePanelTab === 'customize' && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                        <Settings className="w-4 h-4 text-cyan-400" />
                        <span>Chart Customization & Visual Options</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Adjust titles, axis labels, canvas height, and toggle visual telemetry elements.
                      </p>
                    </div>

                    {configSavedFeedback && (
                      <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
                    {/* Title & Labels Customization */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Chart Title:</label>
                        <input
                          type="text"
                          value={chartConfig.title}
                          onChange={(e) => setChartConfig({ ...chartConfig, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">X-Axis Label:</label>
                        <input
                          type="text"
                          value={chartConfig.xAxisLabel}
                          onChange={(e) => setChartConfig({ ...chartConfig, xAxisLabel: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Y-Axis Label:</label>
                        <input
                          type="text"
                          value={chartConfig.yAxisLabel}
                          onChange={(e) => setChartConfig({ ...chartConfig, yAxisLabel: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Canvas Height (px):</label>
                        <div className="flex gap-2">
                          {[300, 380, 480].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setChartConfig({ ...chartConfig, height: h })}
                              className={`flex-1 py-1.5 rounded-lg border text-xs cursor-pointer ${
                                chartConfig.height === h
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                                  : 'bg-slate-900 border-slate-700 text-slate-400'
                              }`}
                            >
                              {h}px {h === 380 ? '(Standard)' : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Visual Elements Toggles */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-slate-300 mb-1">Primary Curve Accent Color:</label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setChartConfig({ ...chartConfig, primaryColor: c.hex })}
                              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer ${
                                chartConfig.primaryColor === c.hex
                                  ? 'bg-slate-800 border-slate-400 text-white font-bold'
                                  : 'bg-slate-900 border-slate-700 text-slate-400'
                              }`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                              <span>{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <label className="block text-slate-300 mb-1">Display Features:</label>
                        
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={chartConfig.showGrid}
                            onChange={(e) => setChartConfig({ ...chartConfig, showGrid: e.target.checked })}
                            className="rounded accent-cyan-500"
                          />
                          <span>Show Scientific Gridlines</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={chartConfig.showTooltip}
                            onChange={(e) => setChartConfig({ ...chartConfig, showTooltip: e.target.checked })}
                            className="rounded accent-cyan-500"
                          />
                          <span>Show Hover Telemetry Tooltips</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={chartConfig.showApexDot}
                            onChange={(e) => setChartConfig({ ...chartConfig, showApexDot: e.target.checked })}
                            className="rounded accent-cyan-500"
                          />
                          <span>Show Highlighted Apex ML Marker</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={chartConfig.showImpactDot}
                            onChange={(e) => setChartConfig({ ...chartConfig, showImpactDot: e.target.checked })}
                            className="rounded accent-cyan-500"
                          />
                          <span>Show Highlighted Impact ML Marker</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={chartConfig.showFillGradient}
                            onChange={(e) => setChartConfig({ ...chartConfig, showFillGradient: e.target.checked })}
                            className="rounded accent-cyan-500"
                          />
                          <span>Render Sub-Trajectory Shaded Gradient</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={chartConfig.showLegend}
                            onChange={(e) => setChartConfig({ ...chartConfig, showLegend: e.target.checked })}
                            className="rounded accent-cyan-500"
                          />
                          <span>Show Graph Legend</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Config Persistence Actions */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleResetChartConfig}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono border border-slate-800 cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChartConfig}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save as Default Configuration</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SMALL ARMS PERFORMANCE CALCULATOR (ballistics_500.csv)            */}
      {/* ========================================================================= */}
      {calculatorMode === 'performance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Small Arms Exterior Performance Calculator</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Multi-target regression: V100, V200, E100, E200, BD100, BD200 &bull; ballistics_500.csv
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Cartridge Parameters</span>
              </h3>

              <form onSubmit={handlePredictPerformance} className="space-y-4">
                <div>
                  <label className="block text-slate-300 mb-1">Cartridge Name:</label>
                  <select
                    value={perfInput.Cartridge}
                    onChange={(e) => setPerfInput({ ...perfInput, Cartridge: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value=".308 WINCHESTER">.308 WINCHESTER</option>
                    <option value=".30-06 SPRINGFIELD">.30-06 SPRINGFIELD</option>
                    <option value=".223 REMINGTON">.223 REMINGTON</option>
                    <option value="460 WEATHERBY MAGNUM">460 WEATHERBY MAGNUM</option>
                    <option value="300 WINCHESTER MAGNUM">300 WINCHESTER MAGNUM</option>
                    <option value="9MM LUGER">9MM LUGER</option>
                    <option value=".45 ACP">.45 ACP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Firearm Platform Type:</label>
                  <select
                    value={perfInput.Type}
                    onChange={(e) => setPerfInput({ ...perfInput, Type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Rifle">Rifle</option>
                    <option value="Handgun">Handgun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Bullet Weight (grains):</label>
                  <input
                    type="number"
                    step="1"
                    value={perfInput.Weight}
                    onChange={(e) => setPerfInput({ ...perfInput, Weight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Ballistic Coefficient (G1 BC):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={perfInput.BC}
                    onChange={(e) => setPerfInput({ ...perfInput, BC: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Muzzle Velocity V0 (fps):</label>
                  <input
                    type="number"
                    step="10"
                    value={perfInput.V0}
                    onChange={(e) => setPerfInput({ ...perfInput, V0: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                {perfError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {perfError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={perfLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{perfLoading ? 'Evaluating Multi-Target Models...' : 'Predict Performance Outputs'}</span>
                </button>
              </form>
            </div>

            {/* Results & Comparative Decay Charts */}
            <div className="lg:col-span-8 space-y-6">
              {perfResult ? (
                <div className="space-y-6">
                  {/* Results Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="glass-card p-4 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase">V100 (100 yds)</span>
                      <div className="text-xl font-bold text-amber-300 mt-1">
                        {perfResult.prediction.v100?.toFixed(1)} <span className="text-xs text-slate-400">fps</span>
                      </div>
                    </div>

                    <div className="glass-card p-4 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase">V200 (200 yds)</span>
                      <div className="text-xl font-bold text-amber-300 mt-1">
                        {perfResult.prediction.v200?.toFixed(1)} <span className="text-xs text-slate-400">fps</span>
                      </div>
                    </div>

                    <div className="glass-card p-4 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase">E100 (100 yds)</span>
                      <div className="text-xl font-bold text-cyan-300 mt-1">
                        {perfResult.prediction.e100?.toFixed(0)} <span className="text-xs text-slate-400">ft-lbs</span>
                      </div>
                    </div>

                    <div className="glass-card p-4 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase">E200 (200 yds)</span>
                      <div className="text-xl font-bold text-cyan-300 mt-1">
                        {perfResult.prediction.e200?.toFixed(0)} <span className="text-xs text-slate-400">ft-lbs</span>
                      </div>
                    </div>

                    <div className="glass-card p-4 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase">Bullet Drop 100 yds</span>
                      <div className="text-xl font-bold text-rose-300 mt-1">
                        {perfResult.prediction.bd100?.toFixed(2)} <span className="text-xs text-slate-400">in</span>
                      </div>
                    </div>

                    <div className="glass-card p-4 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase">Bullet Drop 200 yds</span>
                      <div className="text-xl font-bold text-rose-300 mt-1">
                        {perfResult.prediction.bd200?.toFixed(2)} <span className="text-xs text-slate-400">in</span>
                      </div>
                    </div>
                  </div>

                  {/* Metric Comparison Chart */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                        Fixed-Distance Comparison Chart
                      </h4>
                      <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                        {(['velocity', 'energy', 'drop'] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPerfActiveMetric(m)}
                            className={`px-3 py-1 rounded capitalize cursor-pointer ${
                              perfActiveMetric === m
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={perfChartData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="distance" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '0.75rem',
                              color: '#f8fafc',
                              fontSize: '11px',
                              fontFamily: 'monospace'
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name={perfActiveMetric.toUpperCase()}
                            fill={perfActiveMetric === 'velocity' ? '#f59e0b' : perfActiveMetric === 'energy' ? '#06b6d4' : '#f43f5e'}
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400">
                      <span className="text-slate-200 font-semibold">Note:</span> Results display actual multi-target ML estimations at specific milestone distances (100 & 200 yds), matching the structure of <code className="text-amber-300">ballistics_500.csv</code> without fabricating intermediate points.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center font-mono text-xs text-slate-500 space-y-3">
                  <Zap className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                  <p>Choose cartridge parameters on the left and click "Predict Performance Outputs" to view model predictions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: V50 TERMINAL MATERIAL PENETRATION CALCULATOR                     */}
      {/* ========================================================================= */}
      {calculatorMode === 'v50' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>V50 Ballistic Limit Velocity & Perforation Probability Calculator</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                ColumnTransformer Pipeline &bull; REL_v50_database_20230527(1).csv (Dataset 3)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
            {/* Form Inputs */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Projectile & Plate Specimen Attributes</span>
              </h3>

              <form onSubmit={handlePredictV50} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Projectile Type:</label>
                    <select
                      value={v50Input.proj_type}
                      onChange={(e) => setV50Input({ ...v50Input, proj_type: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                    >
                      <option value="AP">Armor Piercing (AP)</option>
                      <option value="FSP">Fragment Simulating (FSP)</option>
                      <option value="Ball">Ball Core</option>
                      <option value="Steel Core">Steel Core</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Target Material:</label>
                    <select
                      value={v50Input.Material}
                      onChange={(e) => setV50Input({ ...v50Input, Material: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                    >
                      <option value="Steel">Steel</option>
                      <option value="Aluminum">Aluminum</option>
                      <option value="Titanium">Titanium</option>
                      <option value="Composite">Composite</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Calibre (mm):</label>
                    <input
                      type="number" step="0.01"
                      value={v50Input.calibre}
                      onChange={(e) => setV50Input({ ...v50Input, calibre: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Projectile Mass (g):</label>
                    <input
                      type="number" step="0.1"
                      value={v50Input.proj_mass}
                      onChange={(e) => setV50Input({ ...v50Input, proj_mass: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Plate Thickness (mm):</label>
                    <input
                      type="number" step="0.1"
                      value={v50Input.thickness}
                      onChange={(e) => setV50Input({ ...v50Input, thickness: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Yield Strength (MPa):</label>
                    <input
                      type="number" step="1"
                      value={v50Input.yield}
                      onChange={(e) => setV50Input({ ...v50Input, yield: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">UTS Strength (MPa):</label>
                    <input
                      type="number" step="1"
                      value={v50Input.UTS}
                      onChange={(e) => setV50Input({ ...v50Input, UTS: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Obliquity Angle (°):</label>
                    <input
                      type="number" step="1"
                      value={v50Input.angle}
                      onChange={(e) => setV50Input({ ...v50Input, angle: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>

                {v50Error && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                    {v50Error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={v50Loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{v50Loading ? 'Evaluating Material Limits...' : 'Predict V50 Ballistic Limit'}</span>
                </button>
              </form>
            </div>

            {/* V50 Prediction & Perforation Probability S-Curve */}
            <div className="lg:col-span-7 space-y-6">
              {v50Result ? (
                <div className="space-y-6">
                  {/* Result Card */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-800 text-center relative overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30 mb-2">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Predicted V50 Ballistic Limit Velocity</div>
                    <div className="text-4xl font-extrabold text-indigo-300 mt-1">
                      {v50Result.prediction.v50?.toFixed(1)} <span className="text-lg text-slate-400">m/s</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Domain Coverage: <strong className="text-indigo-300">{Math.round(v50Result.domain_score * 100)}%</strong>
                    </div>
                  </div>

                  {/* Sigmoid Probability S-Curve */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Material Perforation Probability vs Impact Velocity
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Sigmoid Logistic Model
                      </span>
                    </div>

                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={v50CurveData} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
                          <defs>
                            <linearGradient id="v50Grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="velocity"
                            stroke="#64748b"
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            label={{ value: 'Impact Velocity (m/s)', position: 'insideBottom', offset: -15, fill: '#cbd5e1', fontSize: 11 }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            stroke="#64748b"
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            label={{ value: 'Perforation Prob (%)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '0.75rem',
                              fontSize: '11px'
                            }}
                            formatter={(val: any) => [`${val}%`, 'Perforation Probability']}
                            labelFormatter={(label) => `Velocity: ${label} m/s`}
                          />
                          <Area
                            type="monotone"
                            dataKey="Probability"
                            stroke="#818cf8"
                            strokeWidth={2.5}
                            fill="url(#v50Grad)"
                          />
                          <ReferenceDot
                            x={Math.round(v50Result.prediction.v50)}
                            y={50}
                            r={6}
                            fill="#f43f5e"
                            stroke="#ffffff"
                            strokeWidth={2}
                            label={{
                              value: `V50: ${v50Result.prediction.v50.toFixed(1)}m/s (50%)`,
                              position: 'top',
                              fill: '#fda4af',
                              fontSize: 11
                            }}
                          />
                          <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400">
                      <span className="text-slate-200 font-semibold">Material Science Note:</span> The V50 ballistic limit corresponds to the 50% perforation probability threshold velocity under specified target obliquity and armor plate thickness.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-500 space-y-3">
                  <ShieldCheck className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                  <p>Input projectile mass, calibre, plate thickness, and material strength to evaluate V50 velocity.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
