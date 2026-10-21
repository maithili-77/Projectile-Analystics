import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  TrendingDown,
  Layers,
  Activity,
  Target,
  Crosshair,
  Gauge,
  Grid,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot
} from 'recharts';

interface PerformanceProps {
  v0: number;
  v100?: number;
  v200?: number;
  e0?: number;
  e100?: number;
  e200?: number;
  bd100?: number;
  bd200?: number;
  cartridgeName?: string;
  firearmType?: string;
  weightGrains?: number;
  bc?: number;
  onFire?: () => void;
  loading?: boolean;
  runTrigger?: number;
}

export const PerformanceVisualizer: React.FC<PerformanceProps> = ({
  v0,
  v100 = 0,
  v200 = 0,
  e0 = 0,
  e100 = 0,
  e200 = 0,
  bd100 = 0,
  bd200 = 0,
  cartridgeName = '.308 WINCHESTER',
  firearmType = 'Rifle',
  weightGrains = 150,
  bc = 0.45,
  onFire,
  loading = false,
  runTrigger = 0
}) => {
  // Realistic Fallbacks if ML predictions are pending or zero
  const safeV0 = v0 > 0 ? v0 : 2800;
  const safeV100 = v100 > 0 ? v100 : Math.round(safeV0 * 0.91);
  const safeV200 = v200 > 0 ? v200 : Math.round(safeV0 * 0.83);

  const safeE0 = e0 > 0 ? e0 : Math.round((0.5 * (weightGrains / 7000) * (safeV0 ** 2)) / 32.174);
  const safeE100 = e100 > 0 ? e100 : Math.round(safeE0 * 0.83);
  const safeE200 = e200 > 0 ? e200 : Math.round(safeE0 * 0.69);

  // Ballistic Drop is typically negative (below sightline zero)
  const safeBd100 = bd100 !== 0 ? bd100 : -1.85;
  const safeBd200 = bd200 !== 0 ? bd200 : -7.60;

  // View & Playback States
  const [animationMode, setAnimationMode] = useState<'all' | 'velocity' | 'energy' | 'drop'>('all');
  const [graphsLayout, setGraphsLayout] = useState<'grid' | 'velocity' | 'energy' | 'drop'>('grid');
  const [progress, setProgress] = useState<number>(0); // 0 to 200 yards
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [muzzleFlashActive, setMuzzleFlashActive] = useState<boolean>(false);
  const [target1HitActive, setTarget1HitActive] = useState<boolean>(false);
  const [target2HitActive, setTarget2HitActive] = useState<boolean>(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('performance-graphs-slot');
    if (el) {
      setPortalTarget(el);
    }
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const hasTriggered100Sfx = useRef<boolean>(false);
  const hasTriggered200Sfx = useRef<boolean>(false);

  // --- Sound Effects Synthesizer (Web Audio API) ---
  const playSound = useCallback((type: 'gunshot' | 'transonic' | 'gong') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'gunshot') {
        // Deep sub-bass boom
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        oscGain.gain.setValueAtTime(1.0, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);

        // Filtered explosive muzzle blast noise
        const bufferSize = ctx.sampleRate * 0.35;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        whiteNoise.start(now);
      } else if (type === 'transonic') {
        // Checkpoint supersonic whip / crack
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'gong') {
        // Metallic steel gong ring on 200yd impact
        const freqs = [520, 840, 1260];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          osc.frequency.exponentialRampToValueAtTime(f * 0.98, now + 0.8);
          gain.gain.setValueAtTime(0.3 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.85);
        });
      }
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }, [soundEnabled]);

  // --- Exact Lagrange Quadratic Interpolation ---
  // Guaranteed exact match at 0, 100, and 200 yards
  const lagrange = useCallback((x: number, y0: number, y1: number, y2: number) => {
    const l0 = ((x - 100) * (x - 200)) / 20000;
    const l1 = ((x - 0) * (x - 200)) / -10000;
    const l2 = ((x - 0) * (x - 100)) / 20000;
    return y0 * l0 + y1 * l1 + y2 * l2;
  }, []);

  // Current Instantaneous Telemetry Values
  const currV = useMemo(() => lagrange(progress, safeV0, safeV100, safeV200), [progress, safeV0, safeV100, safeV200, lagrange]);
  const currE = useMemo(() => Math.max(0, lagrange(progress, safeE0, safeE100, safeE200)), [progress, safeE0, safeE100, safeE200, lagrange]);
  const currDrop = useMemo(() => lagrange(progress, 0, safeBd100, safeBd200), [progress, safeBd100, safeBd200, lagrange]);
  const currMach = useMemo(() => currV / 1125, [currV]);
  const retainedPctV = useMemo(() => Math.max(0, Math.min(100, (currV / safeV0) * 100)), [currV, safeV0]);
  const retainedPctE = useMemo(() => safeE0 > 0 ? Math.max(0, Math.min(100, (currE / safeE0) * 100)) : 0, [currE, safeE0]);

  // High-Resolution Smooth Chart Data Sets (0 to 200 yards)
  const chartPoints = useMemo(() => {
    const pts = [];
    for (let d = 0; d <= 200; d += 10) {
      const v = Math.round(lagrange(d, safeV0, safeV100, safeV200));
      const e = Math.round(lagrange(d, safeE0, safeE100, safeE200));
      const drop = Number(lagrange(d, 0, safeBd100, safeBd200).toFixed(2));
      pts.push({
        distance: `${d}y`,
        distNum: d,
        v,
        e,
        drop
      });
    }
    return pts;
  }, [safeV0, safeV100, safeV200, safeE0, safeE100, safeE200, safeBd100, safeBd200, lagrange]);

  // Trigger New Shot
  const triggerFire = useCallback(() => {
    setProgress(0);
    setIsPlaying(true);
    setMuzzleFlashActive(true);
    setTarget1HitActive(false);
    setTarget2HitActive(false);
    hasTriggered100Sfx.current = false;
    hasTriggered200Sfx.current = false;
    playSound('gunshot');

    setTimeout(() => {
      setMuzzleFlashActive(false);
    }, 180);
  }, [playSound]);

  const handleManualFire = useCallback(() => {
    triggerFire();
    if (onFire) {
      onFire();
    }
  }, [triggerFire, onFire]);

  // Run animation only when model is triggered by user
  useEffect(() => {
    if (runTrigger && runTrigger > 0) {
      triggerFire();
    }
  }, [runTrigger, triggerFire]);

  // Reset to stable resting position when input values change
  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    hasTriggered100Sfx.current = false;
    hasTriggered200Sfx.current = false;
    setTarget1HitActive(false);
    setTarget2HitActive(false);
    setMuzzleFlashActive(false);
  }, [v0, v100, v200, e100, e200, bd100, bd200, cartridgeName, firearmType, weightGrains, bc]);

  // --- Animation Frame Loop ---
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setProgress((prev) => {
        // Base rate: traverse 200 yards in ~2.8 seconds at 1x
        const advance = delta * 70 * speed;
        const next = prev + advance;

        // Sound & visual triggers at checkpoints
        if (next >= 100 && !hasTriggered100Sfx.current) {
          hasTriggered100Sfx.current = true;
          setTarget1HitActive(true);
          playSound('transonic');
          setTimeout(() => setTarget1HitActive(false), 350);
        }

        if (next >= 200) {
          if (!hasTriggered200Sfx.current) {
            hasTriggered200Sfx.current = true;
            setTarget2HitActive(true);
            playSound('gong');
            setTimeout(() => setTarget2HitActive(false), 500);
          }
          // Complete shot and stay stable at 200 yards (do NOT loop continuously)
          setIsPlaying(false);
          return 200;
        }

        return next;
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speed, playSound]);

  // --- Realistic HTML5 Canvas Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Coordinate Setup
    const startX = 85;     // Muzzle location
    const endX = width - 90; // 200 yards target location
    const rangePx = endX - startX;
    const midX = startX + rangePx * 0.5; // 100 yards target location

    const zeroY = 150;     // Optical zero bore sightline
    const dropScale = 11.5; // Pixels per inch of ballistic drop

    // Current projectile coordinates
    const normDist = Math.min(1, Math.max(0, progress / 200));
    const bulletX = startX + normDist * rangePx;
    const bulletDropInches = currDrop;
    // Ballistic drop is negative, so adding abs value moves bullet down below bore zero
    const bulletY = zeroY + Math.abs(bulletDropInches) * dropScale;

    // Clear Canvas with Atmospheric Deep Slate Sky
    ctx.clearRect(0, 0, width, height);

    // 1. Sky & Wind Tunnel Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#030712'); // Rich deep slate
    bgGrad.addColorStop(0.65, '#0b1120');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Tactical Measurement Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(x, 20);
      ctx.lineTo(x, height - 40);
      ctx.stroke();
    }
    for (let y = 30; y < height - 30; y += 30) {
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(30, y);
      ctx.lineTo(width - 30, y);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset dash

    // 3. Firing Range Ground Berm
    const groundY = height - 45;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, groundY, width, 45);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // 4. Distance Flags & Range Line Markers
    const drawRangeMarker = (xPos: number, label: string, isMajor: boolean) => {
      ctx.strokeStyle = isMajor ? '#0ea5e9' : '#475569';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(xPos, groundY - (isMajor ? 20 : 10));
      ctx.lineTo(xPos, groundY);
      ctx.stroke();

      ctx.fillStyle = isMajor ? '#38bdf8' : '#64748b';
      ctx.font = isMajor ? 'bold 10px monospace' : '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, xPos, groundY + 16);
    };

    drawRangeMarker(startX, '0 YDS (MUZZLE)', true);
    drawRangeMarker(startX + rangePx * 0.25, '50 YDS', false);
    drawRangeMarker(midX, '100 YDS (STAGE 1)', true);
    drawRangeMarker(startX + rangePx * 0.75, '150 YDS', false);
    drawRangeMarker(endX, '200 YDS (STAGE 2)', true);

    // 5. Rifle Muzzle Profile (at 0 yds)
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    // Barrel block
    ctx.fillRect(startX - 55, zeroY - 7, 50, 14);
    ctx.strokeRect(startX - 55, zeroY - 7, 50, 14);
    // Muzzle brake compensator slots
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(startX - 18, zeroY - 8, 4, 16);
    ctx.fillRect(startX - 10, zeroY - 8, 4, 16);
    // Benchrest base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(startX - 65, zeroY + 7, 25, groundY - (zeroY + 7));
    ctx.restore();

    // 6. Bore Sightline (Zero Elevation Datum)
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; // Cyan dashed line
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, zeroY);
    ctx.lineTo(endX + 40, zeroY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('OPTICAL BORE ZERO (0.0 INCHES)', startX + 10, zeroY - 6);
    ctx.restore();

    // 7. Full Ballistic Drop Trajectory Curve Path
    ctx.save();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)'; // Purple curve
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let d = 0; d <= 200; d += 2) {
      const px = startX + (d / 200) * rangePx;
      const dropInches = lagrange(d, 0, safeBd100, safeBd200);
      const py = zeroY + Math.abs(dropInches) * dropScale;
      if (d === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // 8. TARGET 1 STAND (at 100 YARDS)
    ctx.save();
    const t1DropInches = Math.abs(safeBd100);
    const t1ImpactY = zeroY + t1DropInches * dropScale;

    // Target post
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(midX, t1ImpactY - 35);
    ctx.lineTo(midX, groundY);
    ctx.stroke();

    // Silhouette Target Face
    ctx.fillStyle = target1HitActive ? '#22d3ee' : '#1e293b';
    ctx.strokeStyle = target1HitActive ? '#67e8f9' : '#0ea5e9';
    ctx.lineWidth = target1HitActive ? 2.5 : 1.5;

    // Target Torso
    ctx.beginPath();
    ctx.roundRect(midX - 12, t1ImpactY - 26, 24, 38, 4);
    ctx.fill();
    ctx.stroke();

    // Bullseye Ring on Target 1
    ctx.strokeStyle = target1HitActive ? '#ffffff' : '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(midX, t1ImpactY - 7, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Target 1 Sensor Data Readout Badge
    ctx.fillStyle = target1HitActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = target1HitActive ? '#22d3ee' : '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(midX - 58, 28, 116, 52, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET 1 (100 YDS)', midX, 42);

    ctx.font = '8.5px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`V100: ${safeV100} fps`, midX, 54);
    ctx.fillText(`E100: ${safeE100} ft·lbs`, midX, 64);
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`BD100: ${safeBd100}" drop`, midX, 74);

    // Target 1 Hit Pulse Shockwave
    if (target1HitActive) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(midX, t1ImpactY - 7, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 9. TARGET 2 STAND & STEEL GONG (at 200 YARDS)
    ctx.save();
    const t2DropInches = Math.abs(safeBd200);
    const t2ImpactY = zeroY + t2DropInches * dropScale;

    // Stand Legs
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(endX - 18, groundY);
    ctx.lineTo(endX, t2ImpactY - 32);
    ctx.lineTo(endX + 18, groundY);
    ctx.stroke();

    // Chains hanging the gong
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(endX - 10, t2ImpactY - 30);
    ctx.lineTo(endX - 7, t2ImpactY - 14);
    ctx.moveTo(endX + 10, t2ImpactY - 30);
    ctx.lineTo(endX + 7, t2ImpactY - 14);
    ctx.stroke();

    // Circular Steel Gong
    ctx.fillStyle = target2HitActive ? '#f59e0b' : '#334155';
    ctx.strokeStyle = target2HitActive ? '#fbbf24' : '#64748b';
    ctx.lineWidth = target2HitActive ? 3 : 2;
    ctx.beginPath();
    ctx.arc(endX, t2ImpactY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gong Center Dot
    ctx.fillStyle = target2HitActive ? '#ffffff' : '#ef4444';
    ctx.beginPath();
    ctx.arc(endX, t2ImpactY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Target 2 Sensor Data Readout Badge
    ctx.fillStyle = target2HitActive ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = target2HitActive ? '#f59e0b' : '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(endX - 58, 28, 116, 52, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET 2 (200 YDS)', endX, 42);

    ctx.font = '8.5px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`V200: ${safeV200} fps`, endX, 54);
    ctx.fillText(`E200: ${safeE200} ft·lbs`, endX, 64);
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`BD200: ${safeBd200}" drop`, endX, 74);

    // Target 2 Hit Sparks FX
    if (target2HitActive) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(endX, t2ImpactY, 24, 0, Math.PI * 2);
      ctx.stroke();

      // Radiating impact sparks
      for (let s = 0; s < 8; s++) {
        const ang = (s * Math.PI) / 4 + Math.random() * 0.2;
        const sparkDist = 18 + Math.random() * 14;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(endX + Math.cos(ang) * 10, t2ImpactY + Math.sin(ang) * 10);
        ctx.lineTo(endX + Math.cos(ang) * sparkDist, t2ImpactY + Math.sin(ang) * sparkDist);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 10. Muzzle Blast Flash & Flame FX (at 0 yds)
    if (muzzleFlashActive || progress < 4) {
      ctx.save();
      const flashGrad = ctx.createRadialGradient(startX + 4, zeroY, 2, startX + 16, zeroY, 32);
      flashGrad.addColorStop(0, '#ffffff');
      flashGrad.addColorStop(0.3, '#fbbf24');
      flashGrad.addColorStop(0.7, '#ea580c');
      flashGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.ellipse(startX + 12, zeroY, 26, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flaring fire spikes
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      for (let i = -3; i <= 3; i++) {
        const spikeY = zeroY + i * 5;
        const spikeX = startX + 18 + Math.abs(i) * 3 + Math.random() * 12;
        ctx.beginPath();
        ctx.moveTo(startX, zeroY);
        ctx.lineTo(spikeX, spikeY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 11. TRAJECTORY TRACER TRAIL BEHIND BULLET
    if (progress > 2) {
      ctx.save();
      const tracerLengthPx = Math.min(bulletX - startX, 85);
      const tracerGrad = ctx.createLinearGradient(bulletX - tracerLengthPx, bulletY, bulletX, bulletY);
      tracerGrad.addColorStop(0, 'rgba(249, 115, 22, 0)');
      tracerGrad.addColorStop(0.6, 'rgba(251, 146, 60, 0.4)');
      tracerGrad.addColorStop(1, 'rgba(254, 215, 170, 0.9)');

      ctx.strokeStyle = tracerGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bulletX - tracerLengthPx, bulletY);
      ctx.lineTo(bulletX, bulletY);
      ctx.stroke();
      ctx.restore();
    }

    // 12. AERODYNAMIC SUPERSONIC MACH SHOCKWAVE CONE
    if (currMach >= 1.05) {
      ctx.save();
      // Mach angle: mu = arcsin(1 / M)
      const machAngle = Math.asin(1 / Math.max(1.05, currMach));
      const coneLength = 55;
      const coneWidth = Math.tan(machAngle) * coneLength;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'; // Supersonic cyan glow
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Upper shock line
      ctx.moveTo(bulletX + 10, bulletY);
      ctx.lineTo(bulletX - coneLength, bulletY - coneWidth);
      // Lower shock line
      ctx.moveTo(bulletX + 10, bulletY);
      ctx.lineTo(bulletX - coneLength, bulletY + coneWidth);
      ctx.stroke();

      // Expansion fan at projectile shoulder
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bulletX - 4, bulletY);
      ctx.lineTo(bulletX - coneLength - 8, bulletY - coneWidth * 0.9);
      ctx.moveTo(bulletX - 4, bulletY);
      ctx.lineTo(bulletX - coneLength - 8, bulletY + coneWidth * 0.9);
      ctx.stroke();

      // Turbulent base wake lines
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(bulletX - 12, bulletY - 3);
      ctx.lineTo(bulletX - 35, bulletY - 5);
      ctx.moveTo(bulletX - 12, bulletY + 3);
      ctx.lineTo(bulletX - 35, bulletY + 5);
      ctx.stroke();
      ctx.restore();
    }

    // 13. REALISTIC SPITZER BOAT-TAIL BULLET
    ctx.save();
    // Compute trajectory tangent angle
    const deltaDist = 1;
    const nextDrop = lagrange(Math.min(200, progress + deltaDist), 0, safeBd100, safeBd200);
    const angleRad = Math.atan2((Math.abs(nextDrop) - Math.abs(bulletDropInches)) * dropScale, (rangePx / 200) * deltaDist);

    ctx.translate(bulletX, bulletY);
    ctx.rotate(angleRad);

    // Copper Jacket Bullet Body
    ctx.fillStyle = '#d97706'; // Rich copper amber
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;

    // Realistic pointed bullet path (nose to boat tail)
    ctx.beginPath();
    ctx.moveTo(10, 0);                 // Sharp ogive tip
    ctx.quadraticCurveTo(4, -4, -4, -4); // Upper ogive curve
    ctx.lineTo(-10, -3.5);              // Cylindrical bearing surface
    ctx.lineTo(-14, -2);                // Tapered boat-tail
    ctx.lineTo(-14, 2);                 // Bullet base
    ctx.lineTo(-10, 3.5);               // Lower boat-tail
    ctx.lineTo(-4, 4);                  // Lower bearing surface
    ctx.quadraticCurveTo(4, 4, 10, 0);  // Lower ogive curve
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Metallic Specular Highlight
    ctx.fillStyle = 'rgba(254, 243, 199, 0.65)';
    ctx.beginPath();
    ctx.moveTo(8, -0.5);
    ctx.lineTo(-7, -2.5);
    ctx.lineTo(-7, -1);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();

    // Driving Band Grooves
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(-6, 4);
    ctx.moveTo(-8, -3.8);
    ctx.lineTo(-8, 3.8);
    ctx.stroke();

    ctx.restore();

    // 14. TOP-RIGHT TACTICAL CANVAS HUD
    ctx.save();
    const hudX = width - 185;
    const hudY = 16;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, 170, 72, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`VELOCITY : ${Math.round(currV)} fps (M ${currMach.toFixed(2)})`, hudX + 10, hudY + 18);

    ctx.fillStyle = '#34d399';
    ctx.fillText(`ENERGY   : ${Math.round(currE)} ft·lbs (${retainedPctE.toFixed(0)}%)`, hudX + 10, hudY + 34);

    ctx.fillStyle = '#c084fc';
    ctx.fillText(`DROP     : ${currDrop.toFixed(2)} in (${(currDrop * 2.54).toFixed(1)} cm)`, hudX + 10, hudY + 50);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`RANGE    : ${Math.round(progress)} / 200 YARDS`, hudX + 10, hudY + 66);
    ctx.restore();

  }, [progress, currV, currE, currDrop, currMach, retainedPctE, safeV0, safeV100, safeV200, safeE0, safeE100, safeE200, safeBd100, safeBd200, lagrange, muzzleFlashActive, target1HitActive, target2HitActive]);

  return (
    <>
      {/* ========================================================================= */}
      {/* UPPER BOX: RANGE FLIGHT SIMULATOR CANVAS, TELEMETRY & FIRING CONTROLS     */}
      {/* ========================================================================= */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col justify-between h-full space-y-4 shadow-2xl font-mono text-xs">
        {/* Header Info Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-sans flex items-center gap-2">
                <span>Ballistic Flight & Aerodynamic Visualizer</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                <strong className="text-slate-200">{cartridgeName}</strong> &bull; {firearmType} &bull; {weightGrains} gr &bull; BC: {bc}
              </p>
            </div>
          </div>

          {/* Tactical Badges & Audio SFX Control */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isPlaying && progress === 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>STABLE • READY</span>
              </span>
            )}
            {isPlaying && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 animate-pulse font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span>IN-FLIGHT ({Math.round(progress)}y)</span>
              </span>
            )}
            {!isPlaying && progress >= 200 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>STAGE 2 COMPLETE (200y)</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? 'Synthesized Gunshot SFX Active' : 'Sound Muted'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'SFX ON' : 'MUTED'}</span>
            </button>

            <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
              V100/V200
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              E100/E200
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
              BD100/BD200
            </span>
          </div>
        </div>

        {/* Main Tactical Animation Canvas */}
        <div className="space-y-3 flex-1 flex flex-col justify-center">
          {/* Canvas Display Container */}
          <div className="relative w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-900 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={840}
              height={360}
              className="w-full h-auto block select-none"
            />
          </div>

          {/* Playback & Firing Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
            {/* Action Buttons: Big Fire + Pause + Replay */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualFire}
                disabled={loading}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-amber-900/30 border border-amber-400/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Flame className="w-4 h-4 text-yellow-200 fill-yellow-300 animate-pulse" />
                <span>{progress >= 200 ? 'RELOAD & FIRE' : 'FIRE TEST ROUND'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProgress(0);
                  setIsPlaying(false);
                  hasTriggered100Sfx.current = false;
                  hasTriggered200Sfx.current = false;
                  setTarget1HitActive(false);
                  setTarget2HitActive(false);
                }}
                className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono flex items-center justify-center transition-all cursor-pointer"
                title="Reset to Muzzle"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Range Scrubber */}
            <div className="flex-1 min-w-[150px] max-w-xs h-9 flex items-center gap-2 px-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Yard:</span>
              <input
                type="range"
                min={0}
                max={200}
                step={1}
                value={progress}
                onChange={(e) => {
                  setProgress(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-cyan-300 w-10 text-right">
                {Math.round(progress)}y
              </span>
            </div>

            {/* Speed Controls */}
            <div className="h-9 flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-[9px] text-slate-500 px-1.5 font-bold uppercase">Speed:</span>
              {[0.25, 0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeed(spd)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] transition-colors cursor-pointer ${
                    speed === spd
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd === 0.25 ? '0.25x' : `${spd}x`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex flex-col justify-between h-full">
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>Current Velocity</span>
            </div>
            <div className="text-lg font-extrabold text-cyan-300 my-1 font-mono">
              {Math.round(currV)} <span className="text-xs font-normal text-slate-400">fps</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              Mach {currMach.toFixed(2)} &bull; {retainedPctV.toFixed(1)}% V0
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/30 transition-all flex flex-col justify-between h-full">
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Kinetic Energy</span>
            </div>
            <div className="text-lg font-extrabold text-emerald-300 my-1 font-mono">
              {Math.round(currE)} <span className="text-xs font-normal text-slate-400">ft·lbs</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              {retainedPctE.toFixed(1)}% Retained
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/30 transition-all flex flex-col justify-between h-full">
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-purple-400" />
              <span>Bullet Drop</span>
            </div>
            <div className="text-lg font-extrabold text-purple-300 my-1 font-mono">
              {currDrop.toFixed(2)} <span className="text-xs font-normal text-slate-400">in</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              {(currDrop * 2.54).toFixed(1)} cm below zero
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/30 transition-all flex flex-col justify-between h-full">
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-amber-400" />
              <span>Checkpoints</span>
            </div>
            <div className="my-1 flex items-center justify-between text-xs font-bold text-amber-300 font-mono">
              <span>100y: {safeV100}</span>
              <span>200y: {safeV200}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Drop: {safeBd100}"</span>
              <span>Drop: {safeBd200}"</span>
            </div>
          </div>
        </div>

        {/* Physics & Dataset Notes Footer */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px]">
              ML Random Forest predictions computed on <code className="text-cyan-300">ballistics_500.csv</code>.
            </span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            Aerodynamic Drag &bull; Gravity Drop &bull; Kinetic Work
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED LOWER BOX: THREE SYNCHRONIZED TARGET PREDICTION GRAPHS          */}
      {/* PORTALED INTO FULL-WIDTH SLOT BELOW MODEL INPUT FEATURES & WORKSPACE      */}
      {/* ========================================================================= */}
      {(() => {
        const graphsContent = (
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5 shadow-2xl bg-slate-950/80 w-full backdrop-blur-md font-mono text-xs">
            {/* Box Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">
                    SYNCHRONIZED PREDICTION GRAPHS (VELOCITY, ENERGY & DROP)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Real-time synchronized playhead markers track across all 3 aerodynamic curves as the bullet travels downrange (0 &rarr; 100 &rarr; 200 yards).
                  </p>
                </div>
              </div>

              {/* Layout Mode Selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setGraphsLayout('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    graphsLayout === 'grid'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>All 3 Graphs (Grid)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGraphsLayout('velocity')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    graphsLayout === 'velocity'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Velocity
                </button>
                <button
                  type="button"
                  onClick={() => setGraphsLayout('energy')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    graphsLayout === 'energy'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Energy
                </button>
                <button
                  type="button"
                  onClick={() => setGraphsLayout('drop')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    graphsLayout === 'drop'
                      ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Drop
                </button>
              </div>
            </div>

            {/* Graphs Body */}
            {graphsLayout === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                {/* Graph 1: Velocity Decay */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between h-full space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-cyan-400" />
                      <span>1. Velocity Decay</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold font-mono">
                      {Math.round(currV)} fps
                    </span>
                  </div>

                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartPoints} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="distNum" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} unit="y" />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['dataMin - 150', 'dataMax + 100']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
                          formatter={(val: any) => [`${val} fps`, 'Velocity']}
                        />
                        <Line type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                        {/* Synchronized Live Playhead Marker */}
                        <ReferenceDot x={Math.round(progress)} y={Math.round(currV)} r={6} fill="#06b6d4" stroke="#ffffff" strokeWidth={2} />
                        <ReferenceLine x={Math.round(progress)} stroke="#22d3ee" strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-slate-900 text-[10px] text-center">
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <div className="text-slate-500 text-[9px] uppercase font-mono">V0 (0y)</div>
                      <div className="font-bold text-cyan-400 font-mono">{safeV0}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <div className="text-slate-500 text-[9px] uppercase font-mono">V100 (100y)</div>
                      <div className="font-bold text-cyan-300 font-mono">{safeV100}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <div className="text-slate-500 text-[9px] uppercase font-mono">V200 (200y)</div>
                      <div className="font-bold text-cyan-200 font-mono">{safeV200}</div>
                    </div>
                  </div>
                </div>

                {/* Graph 2: Kinetic Energy Drop */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 hover:border-emerald-500/40 transition-all flex flex-col justify-between h-full space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>2. Kinetic Energy</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold font-mono">
                      {Math.round(currE)} ft·lbs
                    </span>
                  </div>

                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartPoints} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="energyGradBox" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="distNum" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} unit="y" />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['dataMin - 150', 'dataMax + 100']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
                          formatter={(val: any) => [`${val} ft·lbs`, 'Kinetic Energy']}
                        />
                        <Area type="monotone" dataKey="e" stroke="#10b981" strokeWidth={2.5} fill="url(#energyGradBox)" isAnimationActive={false} />
                        {/* Synchronized Live Playhead Marker */}
                        <ReferenceDot x={Math.round(progress)} y={Math.round(currE)} r={6} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
                        <ReferenceLine x={Math.round(progress)} stroke="#10b981" strokeDasharray="3 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-slate-900 text-[10px] text-center">
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <div className="text-slate-500 text-[9px] uppercase font-mono">E0 (0y)</div>
                      <div className="font-bold text-emerald-400 font-mono">{safeE0}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <div className="text-slate-500 text-[9px] uppercase font-mono">E100 (100y)</div>
                      <div className="font-bold text-emerald-300 font-mono">{safeE100}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <div className="text-slate-500 text-[9px] uppercase font-mono">E200 (200y)</div>
                      <div className="font-bold text-emerald-200 font-mono">{safeE200}</div>
                    </div>
                  </div>
                </div>

                {/* Graph 3: Ballistic Bullet Drop */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 hover:border-purple-500/40 transition-all flex flex-col justify-between h-full space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-purple-400" />
                      <span>3. Bullet Drop</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-300 font-bold font-mono">
                      {currDrop.toFixed(2)} in
                    </span>
                  </div>

                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartPoints} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="distNum" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} unit="y" />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} unit=" in" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
                          formatter={(val: any) => [`${val} inches`, 'Drop below zero']}
                        />
                        <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" label={{ value: 'Sight Zero', fill: '#64748b', fontSize: 10 }} />
                        <Line type="monotone" dataKey="drop" stroke="#c084fc" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                        {/* Synchronized Live Playhead Marker */}
                        <ReferenceDot x={Math.round(progress)} y={Number(currDrop.toFixed(2))} r={6} fill="#a855f7" stroke="#ffffff" strokeWidth={2} />
                        <ReferenceLine x={Math.round(progress)} stroke="#c084fc" strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-slate-900 text-[10px] text-center">
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <div className="text-slate-500 text-[9px] uppercase font-mono">Muzzle (0y)</div>
                      <div className="font-bold text-slate-300 font-mono">0.00"</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <div className="text-slate-500 text-[9px] uppercase font-mono">BD100 (100y)</div>
                      <div className="font-bold text-purple-300 font-mono">{safeBd100}"</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <div className="text-slate-500 text-[9px] uppercase font-mono">BD200 (200y)</div>
                      <div className="font-bold text-purple-200 font-mono">{safeBd200}"</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
        /* Focused Single Graph Expanded View */
        <div className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {graphsLayout === 'velocity' ? (
                <>
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Velocity Decay Curve (V0 &rarr; V100 &rarr; V200)</span>
                </>
              ) : graphsLayout === 'energy' ? (
                <>
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Kinetic Energy Drop Curve (E0 &rarr; E100 &rarr; E200)</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-purple-400" />
                  <span>Ballistic Bullet Drop Trajectory Curve (0 &rarr; BD100 &rarr; BD200)</span>
                </>
              )}
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-cyan-300">
              Live at {Math.round(progress)}y: {graphsLayout === 'velocity' ? `${Math.round(currV)} fps` :
                                          graphsLayout === 'energy' ? `${Math.round(currE)} ft·lbs` :
                                          `${currDrop.toFixed(2)} in`}
            </span>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              {graphsLayout === 'velocity' ? (
                <LineChart data={chartPoints} margin={{ top: 15, right: 25, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="distNum" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" yds" />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" fps" domain={['dataMin - 150', 'dataMax + 100']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(val: any) => [`${val} fps`, 'Velocity']}
                  />
                  <Line type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} isAnimationActive={false} />
                  <ReferenceDot x={Math.round(progress)} y={Math.round(currV)} r={7} fill="#06b6d4" stroke="#ffffff" strokeWidth={2.5} />
                  <ReferenceLine x={Math.round(progress)} stroke="#22d3ee" strokeDasharray="3 3" />
                </LineChart>
              ) : graphsLayout === 'energy' ? (
                <AreaChart data={chartPoints} margin={{ top: 15, right: 25, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="energyGradExpandedBox" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="distNum" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" yds" />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" ft·lbs" domain={['dataMin - 150', 'dataMax + 100']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(val: any) => [`${val} ft·lbs`, 'Kinetic Energy']}
                  />
                  <Area type="monotone" dataKey="e" stroke="#10b981" strokeWidth={3} fill="url(#energyGradExpandedBox)" isAnimationActive={false} />
                  <ReferenceDot x={Math.round(progress)} y={Math.round(currE)} r={7} fill="#10b981" stroke="#ffffff" strokeWidth={2.5} />
                  <ReferenceLine x={Math.round(progress)} stroke="#10b981" strokeDasharray="3 3" />
                </AreaChart>
              ) : (
                <LineChart data={chartPoints} margin={{ top: 15, right: 25, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="distNum" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" yds" />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" in" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(val: any) => [`${val} inches`, 'Drop below zero']}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'Sight Zero Line', fill: '#64748b', fontSize: 11 }} />
                  <Line type="monotone" dataKey="drop" stroke="#c084fc" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} isAnimationActive={false} />
                  <ReferenceDot x={Math.round(progress)} y={Number(currDrop.toFixed(2))} r={7} fill="#a855f7" stroke="#ffffff" strokeWidth={2.5} />
                  <ReferenceLine x={Math.round(progress)} stroke="#c084fc" strokeDasharray="3 3" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  return portalTarget ? createPortal(graphsContent, portalTarget) : graphsContent;
})()}
</>
  );
};
