import React, { useState, useEffect } from 'react';
import {
  Calculator,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Target,
  Info,
  AlertTriangle,
  BarChart2,
  Table as TableIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot
} from 'recharts';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';
import { PageId } from '../components/Sidebar';
import { api } from '../services/api';
import { TrajectoryInput, PredictionResult } from '../types';

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

export const CalculatorPage: React.FC<Props> = ({ setActivePage }) => {
  // Input Form States initialized with realistic defaults
  const [velocity, setVelocity] = useState<number>(600);
  const [angleDeg, setAngleDeg] = useState<number>(45);
  const [gravity, setGravity] = useState<number>(9.81);

  // Status & Prediction Result States
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [plotData, setPlotData] = useState<PlotPoint[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);

  // Client-side validation state
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Validate inputs locally whenever they change
  useEffect(() => {
    if (velocity <= 0 || velocity > 3000) {
      setValidationWarning('Velocity outside typical domain (1 - 3000 m/s)');
    } else if (angleDeg <= 0 || angleDeg >= 90) {
      setValidationWarning('Launch angle must be between 0.1° and 89.9°');
    } else if (gravity <= 0 || gravity > 30) {
      setValidationWarning('Gravity must be a positive acceleration (0.1 - 30 m/s²)');
    } else {
      setValidationWarning(null);
    }
  }, [velocity, angleDeg, gravity]);

  // Initial automatic prediction run on mount
  useEffect(() => {
    handlePredict(600, 45, 9.81);
  }, []);

  const handlePredict = async (v = velocity, a = angleDeg, g = gravity) => {
    if (v <= 0 || a <= 0 || a >= 90 || g <= 0) {
      setError('Please provide valid input values before calculating.');
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

      // Generate reference 2D kinematic plot curve anchored by predicted values
      generatePlotData(v, a, g, result.prediction.range_actual, result.prediction.max_height_actual);
    } catch (err: any) {
      console.error('Prediction error:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to connect to ML prediction backend server.');
      setPredictionResult(null);
      setPlotData([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePlotData = (v0: number, deg: number, g: number, rangePred: number, heightPred: number) => {
    const rad = (deg * Math.PI) / 180;
    const v0x = v0 * Math.cos(rad);
    const v0y = v0 * Math.sin(rad);

    // Total theoretical time of flight based on predicted range or kinematic equation
    const totalTime = v0x > 0 ? rangePred / v0x : (2 * v0y) / g;

    const numPoints = 50;
    const points: PlotPoint[] = [];

    // Vacuum peak altitude for curve normalization
    const theoreticalMaxY = (v0y * v0y) / (2 * g);
    const heightScale = theoreticalMaxY > 0 ? heightPred / theoreticalMaxY : 1;

    for (let i = 0; i <= numPoints; i++) {
      const frac = i / numPoints;
      const x = Math.round(frac * rangePred * 100) / 100;
      const t = Math.round(frac * totalTime * 100) / 100;

      // Kinematic y(x) height profile
      const rawY = Math.max(0, x * Math.tan(rad) - (g * x * x) / (2 * v0x * v0x));
      const y = Math.round(rawY * heightScale * 100) / 100;

      // Velocity magnitude at step t
      const vy = v0y - g * t;
      const vInst = Math.round(Math.sqrt(v0x * v0x + vy * vy) * 100) / 100;

      let phase = 'Flight';
      if (i === 0) phase = 'Launch';
      else if (i === Math.floor(numPoints / 2)) phase = 'Apex';
      else if (i === numPoints) phase = 'Impact';
      else if (i < numPoints / 2) phase = 'Ascent';
      else phase = 'Descent';

      points.push({ x, y, time: t, velocity: vInst, phase });
    }

    setPlotData(points);
  };

  const handleReset = () => {
    setVelocity(600);
    setAngleDeg(45);
    setGravity(9.81);
    setError(null);
    setValidationWarning(null);
    handlePredict(600, 45, 9.81);
  };

  const applyPreset = (presetV: number, presetA: number, presetG: number) => {
    setVelocity(presetV);
    setAngleDeg(presetA);
    setGravity(presetG);
    handlePredict(presetV, presetA, presetG);
  };

  const rangeVal = predictionResult?.prediction.range_actual || 0;
  const heightVal = predictionResult?.prediction.max_height_actual || 0;

  return (
    <div className="space-y-8 pb-12">
      <AcademicDisclaimer />

      {/* Hero / Header Section */}
      <div className="relative rounded-2xl glass-panel p-6 sm:p-8 overflow-hidden border border-slate-800 bg-grid-pattern">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Machine Learning Ballistic Calculator</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              BALLISTIC TRAJECTORY CALCULATOR
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Estimate downrange impact distance and apex altitude using pre-trained Random Forest models trained on computational exterior ballistics dataset <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono">accurate_ballastic.csv</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL A: Input Panel (4 Cols on LG) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Input Parameters</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                3 Features
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
                Quick Presets:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset(800, 30, 9.81)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] font-mono border border-slate-800 transition-colors"
                >
                  Standard Rifle
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(600, 45, 9.81)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] font-mono border border-slate-800 transition-colors"
                >
                  Max Range (45°)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(400, 65, 9.81)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] font-mono border border-slate-800 transition-colors"
                >
                  Mortar (65°)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(340, 15, 9.81)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-[11px] font-mono border border-slate-800 transition-colors"
                >
                  Subsonic Handgun
                </button>
              </div>
            </div>

            {/* Form Controls */}
            <form onSubmit={(e) => { e.preventDefault(); handlePredict(); }} className="space-y-5">
              
              {/* Feature 1: Velocity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="velocity" className="font-semibold text-slate-200 font-mono">
                    Initial Velocity (<code className="text-cyan-300">velocity</code>)
                  </label>
                  <span className="text-cyan-400 font-bold font-mono">{velocity} m/s</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="velocity"
                    type="number"
                    min="1"
                    max="3000"
                    step="1"
                    value={velocity}
                    onChange={(e) => setVelocity(Number(e.target.value))}
                    className="w-28 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <input
                    type="range"
                    min="50"
                    max="1500"
                    step="5"
                    value={Math.min(velocity, 1500)}
                    onChange={(e) => setVelocity(Number(e.target.value))}
                    className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Unit: m/s</span>
                  <span>Dataset Range: ~100 – 1000 m/s</span>
                </div>
              </div>

              {/* Feature 2: Launch Angle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="angleDeg" className="font-semibold text-slate-200 font-mono">
                    Launch Angle (<code className="text-cyan-300">angle_deg</code>)
                  </label>
                  <span className="text-cyan-400 font-bold font-mono">{angleDeg}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="angleDeg"
                    type="number"
                    min="0.1"
                    max="89.9"
                    step="0.1"
                    value={angleDeg}
                    onChange={(e) => setAngleDeg(Number(e.target.value))}
                    className="w-28 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <input
                    type="range"
                    min="1"
                    max="89"
                    step="0.5"
                    value={angleDeg}
                    onChange={(e) => setAngleDeg(Number(e.target.value))}
                    className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Unit: Degrees (°)</span>
                  <span>Dataset Range: 1° – 89°</span>
                </div>
              </div>

              {/* Feature 3: Gravity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="gravity" className="font-semibold text-slate-200 font-mono">
                    Gravity (<code className="text-cyan-300">gravity</code>)
                  </label>
                  <span className="text-cyan-400 font-bold font-mono">{gravity} m/s²</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="gravity"
                    type="number"
                    min="0.1"
                    max="30"
                    step="0.01"
                    value={gravity}
                    onChange={(e) => setGravity(Number(e.target.value))}
                    className="w-28 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.1"
                    value={Math.min(gravity, 20)}
                    onChange={(e) => setGravity(Number(e.target.value))}
                    className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Unit: m/s²</span>
                  <span>Std Earth: 9.81 m/s²</span>
                </div>
              </div>

              {/* Validation Warning Alert */}
              {validationWarning && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationWarning}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-glow-cyan flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Predict Trajectory</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Reset Inputs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* PANEL B & C: Results & Interactive Graph (8 Cols on LG) */}
        <div className="lg:col-span-8 space-y-6">

          {/* PANEL B: Primary Prediction Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: Range Actual */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>PREDICTED ACTUAL RANGE</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px]">
                  range_actual
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-mono tracking-tight my-2">
                {loading ? (
                  <span className="text-slate-600 animate-pulse">---.--</span>
                ) : (
                  <>
                    {rangeVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

            {/* Card 2: Max Height Actual */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <span>PREDICTED MAXIMUM HEIGHT</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px]">
                  max_height_actual
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-mono tracking-tight my-2">
                {loading ? (
                  <span className="text-slate-600 animate-pulse">---.--</span>
                ) : (
                  <>
                    {heightVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          {/* PANEL C: Interactive Trajectory Graph */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Interactive Trajectory Profile
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowTable(!showTable)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showTable ? 'Hide Data Table' : 'Show Position Table'}</span>
              </button>
            </div>

            {/* Recharts Trajectory Graph */}
            <div className="w-full h-80 sm:h-96">
              {plotData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                  No trajectory data available. Click Predict Trajectory.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={plotData} margin={{ top: 20, right: 30, left: 15, bottom: 25 }}>
                    <defs>
                      <linearGradient id="calcTrajectoryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>

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
                        fontSize: 12,
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
                        fontSize: 12,
                        fontFamily: 'monospace'
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                      }}
                      formatter={(val: any, name: string) => {
                        if (name === 'Altitude (m)') return [`${val} m`, 'Height'];
                        return [val, name];
                      }}
                      labelFormatter={(label) => `Distance: ${label} m`}
                    />

                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}
                    />

                    {/* Flight Arc Line & Area */}
                    <Area
                      type="monotone"
                      dataKey="y"
                      name="Reference Flight Profile (m)"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#calcTrajectoryGrad)"
                    />

                    {/* Highlighted ML Apex Dot */}
                    {heightVal > 0 && (
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

                    {/* Highlighted ML Range Target Dot */}
                    {rangeVal > 0 && (
                      <ReferenceDot
                        x={rangeVal}
                        y={0}
                        r={6}
                        fill="#22d3ee"
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

            {/* Visualization Disclaimer */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">Reference Visualization Note:</strong> The continuous flight path above is a 2D reference physics visualization generated for educational spatial inspection. The trained Random Forest ML model specifically predicts scalar target variables: <code className="text-cyan-300 font-bold">range_actual ({rangeVal.toFixed(1)}m)</code> and <code className="text-indigo-300 font-bold">max_height_actual ({heightVal.toFixed(1)}m)</code>.
              </span>
            </div>

            {/* Optional Collapsible Trajectory Position Table */}
            {showTable && plotData.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Sampled Trajectory Positions Table
                </h4>
                <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-800">
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

        </div>

      </div>
    </div>
  );
};
