import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Crosshair,
  Flame,
  Camera,
  Layers,
  Sparkles
} from 'lucide-react';
import { TrajectoryPoint } from '../types';

interface Props {
  points: TrajectoryPoint[];
  maxRange: number;
  maxHeight: number;
  velocity?: number;
  angleDeg?: number;
  gravity?: number;
  predictedRange?: number;
  predictedHeight?: number;
  onFire?: () => void;
  loading?: boolean;
}

// Particle interface for smoke, sparks, and impact debris
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  life: number;
}

// Impact explosion state
interface ImpactEvent {
  x: number;
  y: number;
  active: boolean;
  time: number;
}

export const TrajectoryCanvas2D: React.FC<Props> = ({
  points,
  maxRange,
  maxHeight,
  velocity = 600,
  angleDeg = 45,
  gravity = 9.81,
  predictedRange,
  predictedHeight,
  onFire,
  loading = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation playback state
  const [currentProgress, setCurrentProgress] = useState<number>(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'overview' | 'follow'>('overview');
  const [showTrajectoryArc, setShowTrajectoryArc] = useState<boolean>(true);

  // Recoil & blast state
  const recoilRef = useRef<number>(0); // 0 (idle) to 1 (full kick)
  const muzzleFlashRef = useRef<number>(0); // 0 (none) to 1 (full flash)
  const particlesRef = useRef<Particle[]>([]);
  const impactRef = useRef<ImpactEvent | null>(null);
  const hasTriggeredImpactRef = useRef<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevPointsRef = useRef<TrajectoryPoint[]>(points);

  // Sound Synthesizer via Web Audio API (zero external assets needed)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playGunshotSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Sharp mechanical crack & muzzle blast noise
      const bufferSize = ctx.sampleRate * 0.2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400, now);
      noiseFilter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(1.0, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);

      // 2. Heavy sub-bass boom (80Hz dropping to 30Hz)
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(110, now);
      bassOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

      bassGain.gain.setValueAtTime(0.9, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.4);

      // 3. Outdoor atmospheric echo / low rumbling tail
      const tailOsc = ctx.createOscillator();
      const tailGain = ctx.createGain();
      tailOsc.type = 'sine';
      tailOsc.frequency.setValueAtTime(55, now);
      tailOsc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

      tailGain.gain.setValueAtTime(0.5, now + 0.05);
      tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      tailOsc.connect(tailGain);
      tailGain.connect(ctx.destination);
      tailOsc.start(now);
      tailOsc.stop(now + 0.7);
    } catch (e) {
      console.warn('Audio synthesis notice:', e);
    }
  }, [soundEnabled]);

  const playImpactSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Heavy metal / dirt impact thud
      const impOsc = ctx.createOscillator();
      const impGain = ctx.createGain();
      impOsc.type = 'sawtooth';
      impOsc.frequency.setValueAtTime(160, now);
      impOsc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

      impGain.gain.setValueAtTime(0.8, now);
      impGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      impOsc.connect(impGain);
      impGain.connect(ctx.destination);
      impOsc.start(now);
      impOsc.stop(now + 0.2);

      // Impact crunch noise
      const bufferSize = ctx.sampleRate * 0.1;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noiseSource.start(now);
    } catch (e) {
      console.warn('Audio synthesis notice:', e);
    }
  }, [soundEnabled]);

  // Compute fallback trajectory points if backend simulation points are not yet populated
  const effectivePoints = React.useMemo(() => {
    if (points && points.length > 1) {
      return points;
    }
    // High-precision kinematic fallback trajectory
    const v0 = velocity;
    const rad = (angleDeg * Math.PI) / 180;
    const g = gravity;
    const totalTime = (2 * v0 * Math.sin(rad)) / g;
    const count = 100;
    const pts: TrajectoryPoint[] = [];
    const maxT = Math.max(0.1, totalTime);
    for (let i = 0; i <= count; i++) {
      const t = (i / count) * maxT;
      const x = v0 * Math.cos(rad) * t;
      const y = Math.max(0, v0 * Math.sin(rad) * t - 0.5 * g * t * t);
      const vx = v0 * Math.cos(rad);
      const vy = v0 * Math.sin(rad) - g * t;
      pts.push({
        t: Math.round(t * 100) / 100,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        vx: Math.round(vx * 10) / 10,
        vy: Math.round(vy * 10) / 10,
        v: Math.round(Math.sqrt(vx * vx + vy * vy) * 10) / 10
      });
    }
    return pts;
  }, [points, velocity, angleDeg, gravity]);

  // Trigger firing action
  const triggerFire = useCallback(() => {
    setCurrentProgress(0);
    setIsPlaying(true);
    recoilRef.current = 1.0;
    muzzleFlashRef.current = 1.0;
    hasTriggeredImpactRef.current = false;
    impactRef.current = null;
    particlesRef.current = [];

    // Spawn initial muzzle blast smoke particles
    const rad = (angleDeg * Math.PI) / 180;
    const muzzleX = 65 * Math.cos(rad);
    const muzzleY = 65 * Math.sin(rad);

    for (let i = 0; i < 24; i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const pAngle = rad + spread;
      const speed = 20 + Math.random() * 45;
      particlesRef.current.push({
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(pAngle) * speed,
        vy: -Math.sin(pAngle) * speed + (Math.random() - 0.5) * 10,
        size: 4 + Math.random() * 8,
        color: Math.random() > 0.4 ? '#f59e0b' : '#94a3b8',
        alpha: 0.9,
        decay: 0.025 + Math.random() * 0.035,
        gravity: -2,
        life: 0
      });
    }

    playGunshotSound();
    if (onFire) {
      onFire();
    }
  }, [angleDeg, onFire, playGunshotSound]);

  // When input parameters or points change, trigger shot
  useEffect(() => {
    if (points !== prevPointsRef.current) {
      prevPointsRef.current = points;
      triggerFire();
    }
  }, [points, triggerFire]);

  // Animation frame loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Update gun recoil recovery (damped spring return)
      if (recoilRef.current > 0) {
        recoilRef.current = Math.max(0, recoilRef.current - dt * 4.5);
      }

      // Update muzzle flash fadeout
      if (muzzleFlashRef.current > 0) {
        muzzleFlashRef.current = Math.max(0, muzzleFlashRef.current - dt * 6.0);
      }

      // Update particles
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          vy: p.vy + p.gravity * dt,
          alpha: p.alpha - p.decay * (dt * 30),
          size: p.size + dt * 4,
          life: p.life + dt
        }))
        .filter((p) => p.alpha > 0.02);

      // Update flight progress
      if (isPlaying && effectivePoints.length > 1) {
        // Total flight duration represented
        const totalDuration = effectivePoints[effectivePoints.length - 1].t || 5.0;
        const normalizedSpeed = (1.0 / Math.max(1.5, Math.min(6.0, totalDuration * 0.8))) * playbackSpeed;

        setCurrentProgress((prev) => {
          const next = prev + dt * normalizedSpeed;
          if (next >= 1.0) {
            // Trigger target impact once
            if (!hasTriggeredImpactRef.current) {
              hasTriggeredImpactRef.current = true;
              playImpactSound();

              // Spawn target impact explosion particles
              const lastPt = effectivePoints[effectivePoints.length - 1];
              impactRef.current = {
                x: lastPt.x,
                y: lastPt.y,
                active: true,
                time: performance.now()
              };

              for (let i = 0; i < 35; i++) {
                const angle = Math.random() * Math.PI; // Upward hemisphere
                const speed = 15 + Math.random() * 55;
                particlesRef.current.push({
                  x: 0, // relative to impact target center
                  y: 0,
                  vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
                  vy: -Math.sin(angle) * speed,
                  size: 2 + Math.random() * 5,
                  color: ['#ef4444', '#f59e0b', '#fbbf24', '#e2e8f0', '#78350f'][Math.floor(Math.random() * 5)],
                  alpha: 1.0,
                  decay: 0.03 + Math.random() * 0.04,
                  gravity: 95,
                  life: 0
                });
              }
            }
            setIsPlaying(false);
            return 1.0;
          }
          return next;
        });
      }

      // Draw canvas frame
      drawCanvas();
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, effectivePoints, playImpactSound]);

  // Main Canvas Rendering Routine
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Tactical view margins
    const padLeft = 85;
    const padRight = 75;
    const padBottom = 65;
    const padTop = 50;

    const groundY = height - padBottom;
    const originX = padLeft;

    // Range scaling
    const pts = effectivePoints;
    const lastPt = pts[pts.length - 1];
    const apexPt = [...pts].sort((a, b) => b.y - a.y)[0] || { x: 1, y: 1 };

    const effectiveMaxRange = Math.max(15, (predictedRange || maxRange || lastPt.x) * 1.12);
    const effectiveMaxHeight = Math.max(10, (predictedHeight || maxHeight || apexPt.y) * 1.3);

    const scaleX = (width - padLeft - padRight) / effectiveMaxRange;
    const scaleY = (groundY - padTop) / effectiveMaxHeight;

    // Clear with tactical dark gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#030712'); // Deep obsidian
    skyGrad.addColorStop(0.5, '#0b1329'); // Night navy
    skyGrad.addColorStop(1, '#0f172a'); // Horizon twilight
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle tactical range grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';

    // Vertical range interval grid ticks
    const rangeStep = effectiveMaxRange > 5000 ? 2000 : effectiveMaxRange > 2000 ? 1000 : effectiveMaxRange > 500 ? 200 : 50;
    for (let rx = rangeStep; rx <= effectiveMaxRange; rx += rangeStep) {
      const gx = originX + rx * scaleX;
      if (gx < width - padRight + 20) {
        ctx.beginPath();
        ctx.setLineDash([3, 5]);
        ctx.moveTo(gx, padTop);
        ctx.lineTo(gx, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label downrange meters
        ctx.fillStyle = 'rgba(100, 116, 139, 0.7)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${rx}m`, gx, groundY + 18);
      }
    }

    // Horizontal altitude grid lines
    const heightStep = effectiveMaxHeight > 2000 ? 1000 : effectiveMaxHeight > 500 ? 200 : effectiveMaxHeight > 100 ? 50 : 20;
    for (let ry = heightStep; ry <= effectiveMaxHeight; ry += heightStep) {
      const gy = groundY - ry * scaleY;
      if (gy > padTop) {
        ctx.beginPath();
        ctx.setLineDash([2, 6]);
        ctx.moveTo(originX, gy);
        ctx.lineTo(width - padRight, gy);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(100, 116, 139, 0.7)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${ry}m`, originX - 10, gy + 3);
      }
    }

    // Reinforced ground terrain
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#1e293b');
    groundGrad.addColorStop(0.15, '#0f172a');
    groundGrad.addColorStop(1, '#020617');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Heavy tactical ground baseline
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(originX - 30, groundY);
    ctx.lineTo(width - padRight + 30, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Current projectile index based on progress
    const floatIdx = currentProgress * (pts.length - 1);
    const currIdx = Math.min(pts.length - 1, Math.floor(floatIdx));
    const nextIdx = Math.min(pts.length - 1, currIdx + 1);
    const frac = floatIdx - currIdx;

    const currPt = pts[currIdx] || pts[0];
    const nextPt = pts[nextIdx] || currPt;

    // Interpolated world coordinates
    const interpX = currPt.x + (nextPt.x - currPt.x) * frac;
    const interpY = currPt.y + (nextPt.y - currPt.y) * frac;
    const interpVx = currPt.vx + (nextPt.vx - currPt.vx) * frac;
    const interpVy = currPt.vy + (nextPt.vy - currPt.vy) * frac;
    const interpSpeed = Math.sqrt(interpVx * interpVx + interpVy * interpVy);

    // Screen coordinates
    const projScreenX = originX + interpX * scaleX;
    const projScreenY = groundY - interpY * scaleY;

    // -------------------------------------------------------------
    // 1. PROJECTED TRAJECTORY PATH & TRACER ARC
    // -------------------------------------------------------------
    if (showTrajectoryArc && pts.length > 1) {
      // Background full projected arc (faint dashed path)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const px = originX + pts[i].x * scaleX;
        const py = groundY - pts[i].y * scaleY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Active illuminated tracer path up to current projectile position
      if (currentProgress > 0) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i <= currIdx; i++) {
          const px = originX + pts[i].x * scaleX;
          const py = groundY - pts[i].y * scaleY;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.lineTo(projScreenX, projScreenY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // -------------------------------------------------------------
    // 2. APEX (MAX HEIGHT) INDICATOR
    // -------------------------------------------------------------
    if (apexPt && apexPt.y > 0) {
      const apexSx = originX + apexPt.x * scaleX;
      const apexSy = groundY - apexPt.y * scaleY;

      // Vertical guideline to ground
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(apexSx, apexSy);
      ctx.lineTo(apexSx, groundY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Apex Marker Dot
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(apexSx, apexSy, 4.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Apex Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(apexSx - 55, apexSy - 24, 110, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Apex: ${Math.round(apexPt.y)}m`, apexSx, apexSy - 11);
    }

    // -------------------------------------------------------------
    // 3. TARGET STAND & BULLSEYE AT LANDING POINT
    // -------------------------------------------------------------
    const targetDistance = predictedRange || lastPt.x;
    const targetSx = originX + targetDistance * scaleX;
    const targetSy = groundY;

    // Draw Target A-Frame Stand
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Left leg
    ctx.moveTo(targetSx - 14, targetSy);
    ctx.lineTo(targetSx, targetSy - 38);
    // Right leg
    ctx.lineTo(targetSx + 14, targetSy);
    // Crossbar
    ctx.moveTo(targetSx - 9, targetSy - 14);
    ctx.lineTo(targetSx + 9, targetSy - 14);
    ctx.stroke();

    // Target Pole
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(targetSx, targetSy - 38);
    ctx.lineTo(targetSx, targetSy - 62);
    ctx.stroke();

    // Fluttering Tactical Range Flag
    const flagWave = Math.sin(performance.now() * 0.005) * 3;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(targetSx, targetSy - 62);
    ctx.lineTo(targetSx + 18, targetSy - 56 + flagWave);
    ctx.lineTo(targetSx, targetSy - 50);
    ctx.closePath();
    ctx.fill();

    // Circular Target Board Face (Concentric Bullseye Rings)
    const targetCenterY = targetSy - 34;
    const targetRadius = 14;

    // Outer ring (white)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(targetSx, targetCenterY, targetRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ring 2 (black)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(targetSx, targetCenterY, targetRadius * 0.75, 0, 2 * Math.PI);
    ctx.fill();

    // Ring 3 (red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(targetSx, targetCenterY, targetRadius * 0.5, 0, 2 * Math.PI);
    ctx.fill();

    // Bullseye center (gold / yellow)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(targetSx, targetCenterY, targetRadius * 0.25, 0, 2 * Math.PI);
    ctx.fill();

    // Target distance plaque beneath
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(targetSx - 42, targetSy + 8, 84, 18, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`TARGET: ${Math.round(targetDistance)}m`, targetSx, targetSy + 20);

    // Bullet hole in target if reached impact
    if (hasTriggeredImpactRef.current) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(targetSx + 1, targetCenterY - 1, 3.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // -------------------------------------------------------------
    // 4. REALISTIC ARTILLERY / CANNON GUN AT ORIGIN
    // -------------------------------------------------------------
    const gunBaseX = originX;
    const gunBaseY = groundY;

    // Firing platform concrete pad
    ctx.fillStyle = '#334155';
    ctx.fillRect(gunBaseX - 35, gunBaseY - 6, 70, 6);
    // Caution hazard stripes on pad
    ctx.fillStyle = '#eab308';
    for (let sx = -30; sx < 30; sx += 14) {
      ctx.beginPath();
      ctx.moveTo(gunBaseX + sx, gunBaseY - 6);
      ctx.lineTo(gunBaseX + sx + 6, gunBaseY - 6);
      ctx.lineTo(gunBaseX + sx + 3, gunBaseY);
      ctx.lineTo(gunBaseX + sx - 3, gunBaseY);
      ctx.fill();
    }

    // Heavy Gun Carriage / Turret Mount
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gunBaseX - 18, gunBaseY - 6);
    ctx.lineTo(gunBaseX - 12, gunBaseY - 22);
    ctx.lineTo(gunBaseX + 12, gunBaseY - 22);
    ctx.lineTo(gunBaseX + 18, gunBaseY - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Elevation Pivot Trunnion (Center of rotation)
    const pivotX = gunBaseX;
    const pivotY = gunBaseY - 22;

    // Elevation Angle Arc / Dial
    const radAngle = (angleDeg * Math.PI) / 180;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 26, 0, -radAngle, true);
    ctx.stroke();

    // Elevation Degree Label
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${angleDeg.toFixed(1)}°`, pivotX + 28, pivotY - 8);

    // Dynamic Recoil displacement along barrel axis (moves backwards on shot)
    const recoilDist = recoilRef.current * 14;

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(-radAngle); // Canvas Y is inverted, so negative angle rotates upward

    // Slide barrel backwards along X axis for recoil kick
    ctx.translate(-recoilDist, 0);

    // 1. Cannon Breech Mechanism (heavy rectangular receiver)
    const breechGrad = ctx.createLinearGradient(0, -9, 0, 9);
    breechGrad.addColorStop(0, '#64748b');
    breechGrad.addColorStop(0.5, '#334155');
    breechGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = breechGrad;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-16, -9, 24, 18, 3);
    ctx.fill();
    ctx.stroke();

    // 2. Long Rifled Steel Barrel
    const barrelLength = 54;
    const barrelGrad = ctx.createLinearGradient(0, -6, 0, 6);
    barrelGrad.addColorStop(0, '#94a3b8');
    barrelGrad.addColorStop(0.3, '#cbd5e1');
    barrelGrad.addColorStop(0.7, '#475569');
    barrelGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = barrelGrad;
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(8 + barrelLength, -4.5);
    ctx.lineTo(8 + barrelLength, 4.5);
    ctx.lineTo(8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Heavy Double-Baffle Muzzle Brake at barrel tip
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(8 + barrelLength - 2, -7.5, 12, 15, 2);
    ctx.fill();
    ctx.stroke();

    // Brake vents
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8 + barrelLength + 1, -6.5, 2.5, 13);
    ctx.fillRect(8 + barrelLength + 5.5, -6.5, 2.5, 13);

    // Muzzle tip position for flash calculation
    const tipX = 8 + barrelLength + 10;
    const tipY = 0;

    // 4. Muzzle Flash & Expanding Plasma Shockwave on Firing!
    if (muzzleFlashRef.current > 0.05) {
      const flashScale = muzzleFlashRef.current;

      // Layer A: Expanding spherical blast shockwave
      ctx.strokeStyle = `rgba(56, 189, 248, ${flashScale * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 18 + (1 - flashScale) * 35, 0, 2 * Math.PI);
      ctx.stroke();

      // Layer B: Violent conical flame burst
      const flameGrad = ctx.createRadialGradient(tipX, tipY, 2, tipX + 16, tipY, 40 * flashScale);
      flameGrad.addColorStop(0, '#ffffff'); // White-hot core
      flameGrad.addColorStop(0.2, '#fef08a'); // Brilliant yellow
      flameGrad.addColorStop(0.6, '#f97316'); // Blazing orange
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)'); // Fading flame

      ctx.fillStyle = flameGrad;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.moveTo(tipX, -4);
      // Main forward blast petal
      ctx.lineTo(tipX + 45 * flashScale, -15 * flashScale);
      ctx.lineTo(tipX + 60 * flashScale, 0);
      ctx.lineTo(tipX + 45 * flashScale, 15 * flashScale);
      ctx.lineTo(tipX, 4);
      ctx.closePath();
      ctx.fill();

      // Side brake vent jet bursts (90° side flame spikes)
      ctx.beginPath();
      ctx.moveTo(tipX - 6, -8);
      ctx.lineTo(tipX - 2, -26 * flashScale);
      ctx.lineTo(tipX + 4, -8);
      ctx.moveTo(tipX - 6, 8);
      ctx.lineTo(tipX - 2, 26 * flashScale);
      ctx.lineTo(tipX + 4, 8);
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Pivot cap hub on mount
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // -------------------------------------------------------------
    // 5. SMOKE PARTICLES & IMPACT DEBRIS
    // -------------------------------------------------------------
    for (const p of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(originX + p.x, groundY + p.y, Math.max(1, p.size), 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // -------------------------------------------------------------
    // 6. REALISTIC SPITZER BULLET & TRACER IN FLIGHT
    // -------------------------------------------------------------
    if (currentProgress < 1.0 && currentProgress > 0) {
      // Compute flight tangent angle
      const flyAngle = Math.atan2(-interpVy * scaleY, interpVx * scaleX);

      ctx.save();
      ctx.translate(projScreenX, projScreenY);
      ctx.rotate(flyAngle);

      // Supersonic Mach Cone Envelope (if speed > 343 m/s)
      if (interpSpeed > 343) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-24, -14);
        ctx.moveTo(12, 0);
        ctx.lineTo(-24, 14);
        ctx.stroke();
      }

      // Incendiary Tracer Base Flare (bright burning glow at rear)
      const tracerGrad = ctx.createRadialGradient(-7, 0, 1, -12, 0, 14);
      tracerGrad.addColorStop(0, '#ffffff');
      tracerGrad.addColorStop(0.3, '#fbbf24');
      tracerGrad.addColorStop(0.7, '#f97316');
      tracerGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = tracerGrad;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(-7, 0, 10, 0, 2 * Math.PI);
      ctx.fill();

      // Aerodynamic Spitzer Bullet Body (Pointed ogive, copper jacket)
      const bulletGrad = ctx.createLinearGradient(0, -4, 0, 4);
      bulletGrad.addColorStop(0, '#fbbf24'); // Copper highlight
      bulletGrad.addColorStop(0.3, '#f59e0b'); // Warm brass
      bulletGrad.addColorStop(0.7, '#d97706'); // Copper base
      bulletGrad.addColorStop(1, '#78350f'); // Shadow underside

      ctx.fillStyle = bulletGrad;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      // Boat-tail rear
      ctx.moveTo(-7, -2.5);
      // Cylindrical shank
      ctx.lineTo(-1, -3.5);
      // Ogive curved nose
      ctx.quadraticCurveTo(7, -3, 11, 0);
      ctx.quadraticCurveTo(7, 3, -1, 3.5);
      // Bottom boat tail
      ctx.lineTo(-7, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bullet Driving Band Groove
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, -3.2);
      ctx.lineTo(-4, 3.2);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.restore();

      // Floating live speed telemetry tag beside projectile
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(projScreenX + 14, projScreenY - 24, 96, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`v=${Math.round(interpSpeed)} m/s`, projScreenX + 19, projScreenY - 10);
    }

    // -------------------------------------------------------------
    // 7. TERMINAL IMPACT EVENT BANNER
    // -------------------------------------------------------------
    if (hasTriggeredImpactRef.current) {
      // Flash halo around target
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.beginPath();
      ctx.arc(targetSx, targetCenterY, 35, 0, 2 * Math.PI);
      ctx.fill();

      // Top-center impact confirmation HUD banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;

      const bannerWidth = 260;
      const bannerX = width / 2 - bannerWidth / 2;
      const bannerY = padTop + 10;

      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerWidth, 42, 8);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DIRECT TARGET IMPACT!', width / 2, bannerY + 18);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(
        `Range: ${Math.round(targetDistance)}m  •  Flight Time: ${lastPt.t || 0}s`,
        width / 2,
        bannerY + 33
      );
    }
  };

  const currPt = effectivePoints[Math.min(effectivePoints.length - 1, Math.floor(currentProgress * (effectivePoints.length - 1)))] || effectivePoints[0];
  const lastPt = effectivePoints[effectivePoints.length - 1] || currPt;

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Crosshair className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <span>Dynamic Firing Range Simulation</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Artillery Muzzle Blast &bull; Supersonic Tracer &bull; Downrange Target Impact
            </p>
          </div>
        </div>

        {/* Audio & Display Options */}
        <div className="flex items-center gap-2">
          {/* Audio SFX Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all ${
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Synthesized Gunshot SFX Active' : 'Sound Muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'SFX ON' : 'MUTED'}</span>
          </button>

          {/* Trace Arc Toggle */}
          <button
            type="button"
            onClick={() => setShowTrajectoryArc(!showTrajectoryArc)}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all ${
              showTrajectoryArc
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle Trajectory Path Arc"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Path</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-900 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={820}
          height={400}
          className="w-full h-auto block select-none"
        />

        {/* Top-Right HUD Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end pointer-events-none">
          <div className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-cyan-300 backdrop-blur-sm">
            VELOCITY: <strong>{Math.round(currPt.v)} m/s</strong> (Mach {(currPt.v / 343).toFixed(1)})
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-emerald-300 backdrop-blur-sm">
            ELEVATION: <strong>{angleDeg.toFixed(1)}°</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-amber-300 backdrop-blur-sm">
            TARGET RANGE: <strong>{Math.round(predictedRange || lastPt.x)} m</strong>
          </div>
        </div>
      </div>

      {/* Interactive Firing & Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* BIG TACTICAL FIRE TRIGGER BUTTON */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerFire}
            disabled={loading}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-amber-900/30 border border-amber-400/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Flame className="w-4 h-4 text-yellow-200 fill-yellow-300 animate-pulse" />
            <span>{currentProgress >= 1.0 ? 'RELOAD & SHOOT' : 'FIRE GUN'}</span>
          </button>

          {/* Pause / Play */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Replay */}
          <button
            type="button"
            onClick={triggerFire}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono transition-all"
            title="Replay Shot"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-[10px] text-slate-500 px-2 font-bold uppercase">Speed:</span>
          {[0.25, 0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-1 rounded-lg transition-colors ${
                playbackSpeed === spd
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd === 0.25 ? '0.25x Slo-Mo' : `${spd}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Telemetry Readout Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Current Downrange</div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5">
            {Math.round(currPt.x)} m
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Current Altitude</div>
          <div className="text-sm font-bold text-emerald-300 mt-0.5">
            {Math.round(currPt.y)} m
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Flight Time</div>
          <div className="text-sm font-bold text-amber-300 mt-0.5">
            {currPt.t.toFixed(2)} s
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Target Distance</div>
          <div className="text-sm font-bold text-rose-300 mt-0.5">
            {Math.round(predictedRange || lastPt.x)} m
          </div>
        </div>
      </div>
    </div>
  );
};
