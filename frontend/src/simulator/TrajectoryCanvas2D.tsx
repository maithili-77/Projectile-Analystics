import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Crosshair,
  Flame,
  Layers,
  Repeat
} from 'lucide-react';
import { TrajectoryPoint } from '../types';

interface Props {
  points?: TrajectoryPoint[];
  maxRange: number;
  maxHeight: number;
  velocity?: number;
  angleDeg?: number;
  gravity?: number;
  predictedRange?: number;
  predictedHeight?: number;
  onFire?: () => void;
  loading?: boolean;
  runTrigger?: number;
}

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
  runTrigger = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Single source of truth values for range and height telemetry display
  const v0Comp = Math.max(1, Number(velocity));
  const safeAngleComp = Math.max(0.5, Math.min(89.5, Number(angleDeg)));
  const radComp = (safeAngleComp * Math.PI) / 180;
  const gComp = Number(gravity) > 0 ? Number(gravity) : 9.81;
  const baselineTheoRange = (v0Comp * v0Comp * Math.sin(2 * radComp)) / gComp;
  const baselineTheoHeight = (v0Comp * v0Comp * Math.sin(radComp) * Math.sin(radComp)) / (2 * gComp);

  const displayTargetRange = (predictedRange && predictedRange > 0) ? predictedRange : ((maxRange && maxRange > 0) ? maxRange : baselineTheoRange);
  const displayTargetHeight = (predictedHeight && predictedHeight > 0) ? predictedHeight : ((maxHeight && maxHeight > 0) ? maxHeight : baselineTheoHeight);

  // High-performance animation refs (Zero React re-render overhead during 60 FPS flight)
  const progressRef = useRef<number>(0); // 0 to 1
  const isPlayingRef = useRef<boolean>(false);
  const playbackSpeedRef = useRef<number>(1);
  const loopEnabledRef = useRef<boolean>(false);
  const soundEnabledRef = useRef<boolean>(true);
  const showTrajectoryArcRef = useRef<boolean>(true);
  const prevRunTriggerRef = useRef<number>(0);

  // UI state for button visual active states only
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showTrajectoryArc, setShowTrajectoryArc] = useState<boolean>(true);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);

  // Direct DOM refs for 60fps lag-free telemetry updates without React re-renders
  const liveSpeedDomRef = useRef<HTMLElement | null>(null);
  const liveAltDomRef = useRef<HTMLDivElement | null>(null);
  const liveDownrangeDomRef = useRef<HTMLDivElement | null>(null);

  // FX state refs
  const recoilRef = useRef<number>(0);
  const muzzleFlashRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const hasTriggeredImpactRef = useRef<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);

  // Sync state changes to refs for instant, lag-free closure access
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { showTrajectoryArcRef.current = showTrajectoryArc; }, [showTrajectoryArc]);
  useEffect(() => { loopEnabledRef.current = loopEnabled; }, [loopEnabled]);

  // Web Audio Synthesizer (Zero asset loading lag)
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
    if (!soundEnabledRef.current) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      const now = ctx.currentTime;

      const bufferSize = Math.floor(ctx.sampleRate * 0.18);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1300, now);
      noiseFilter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.75, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);

      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(115, now);
      bassOsc.frequency.exponentialRampToValueAtTime(34, now + 0.32);

      bassGain.gain.setValueAtTime(0.65, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.36);
    } catch {
      // Audio fallback
    }
  }, []);

  const playImpactSound = useCallback(() => {
    if (!soundEnabledRef.current) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      const now = ctx.currentTime;

      const impOsc = ctx.createOscillator();
      const impGain = ctx.createGain();
      impOsc.type = 'sawtooth';
      impOsc.frequency.setValueAtTime(170, now);
      impOsc.frequency.exponentialRampToValueAtTime(45, now + 0.14);

      impGain.gain.setValueAtTime(0.65, now);
      impGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      impOsc.connect(impGain);
      impGain.connect(ctx.destination);
      impOsc.start(now);
      impOsc.stop(now + 0.18);
    } catch {
      // Audio fallback
    }
  }, []);

  // Trigger firing action
  const triggerFire = useCallback(() => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    progressRef.current = 0;
    isPlayingRef.current = true;
    setIsPlaying(true);
    recoilRef.current = 1.0;
    muzzleFlashRef.current = 1.0;
    hasTriggeredImpactRef.current = false;
    particlesRef.current = [];

    const rad = (angleDeg * Math.PI) / 180;
    for (let i = 0; i < 28; i++) {
      const spread = (Math.random() - 0.5) * 0.75;
      const pAngle = rad + spread;
      const speed = 35 + Math.random() * 55;
      particlesRef.current.push({
        x: 0,
        y: 0,
        vx: Math.cos(pAngle) * speed,
        vy: -Math.sin(pAngle) * speed + (Math.random() - 0.5) * 10,
        size: 3 + Math.random() * 6,
        color: Math.random() > 0.35 ? '#f59e0b' : '#38bdf8',
        alpha: 0.95,
        decay: 0.025 + Math.random() * 0.035,
        gravity: 4,
        life: 0
      });
    }

    playGunshotSound();
  }, [angleDeg, playGunshotSound]);

  // STABLE STANDBY MODE: When user adjusts sliders (velocity, angle, gravity),
  // reset to stable standby with gun elevated at the set angle and bullet loaded.
  // DO NOT AUTO-FIRE OR LOOP!
  useEffect(() => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    progressRef.current = 0;
    isPlayingRef.current = false;
    setIsPlaying(false);
    recoilRef.current = 0;
    muzzleFlashRef.current = 0;
    hasTriggeredImpactRef.current = false;
    particlesRef.current = [];

    if (liveDownrangeDomRef.current) liveDownrangeDomRef.current.textContent = '0 m';
    if (liveAltDomRef.current) liveAltDomRef.current.textContent = '0 m';
    if (liveSpeedDomRef.current) liveSpeedDomRef.current.textContent = `${Math.round(velocity)} m/s (Mach ${(velocity / 343).toFixed(1)})`;
  }, [velocity, angleDeg, gravity]);

  // USER RUN TRIGGER: Fires ONLY when user explicitly runs the model or clicks fire
  useEffect(() => {
    if (runTrigger && runTrigger > 0 && runTrigger !== prevRunTriggerRef.current) {
      prevRunTriggerRef.current = runTrigger;
      triggerFire();
    } else if (runTrigger === 0) {
      prevRunTriggerRef.current = 0;
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      progressRef.current = 0;
      isPlayingRef.current = false;
      setIsPlaying(false);
      recoilRef.current = 0;
      muzzleFlashRef.current = 0;
      hasTriggeredImpactRef.current = false;
    }
  }, [runTrigger, triggerFire]);

  // Butter-smooth 60fps animation frame loop (Zero React re-render lag)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;

      if (recoilRef.current > 0) {
        recoilRef.current = Math.max(0, recoilRef.current - dt * 4.5);
      }

      if (muzzleFlashRef.current > 0) {
        muzzleFlashRef.current = Math.max(0, muzzleFlashRef.current - dt * 6.0);
      }

      // In-place particle updates (No GC churn)
      const pArr = particlesRef.current;
      for (let i = pArr.length - 1; i >= 0; i--) {
        const p = pArr[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.alpha -= p.decay * (dt * 30);
        p.size += dt * 3;
        p.life += dt;
        if (p.alpha <= 0.02) {
          pArr.splice(i, 1);
        }
      }

      // Advance bullet progress ONLY when isPlayingRef is active
      if (isPlayingRef.current) {
        const safeAngle = Math.max(1, Math.min(89, Number(angleDeg)));
        const flightDuration = Math.max(1.8, Math.min(5.5, 1.8 + (safeAngle / 90) * 3.2));
        const normalizedSpeed = (1.0 / flightDuration) * playbackSpeedRef.current;

        progressRef.current += dt * normalizedSpeed;

        if (progressRef.current >= 1.0) {
          progressRef.current = 1.0;

          if (!hasTriggeredImpactRef.current) {
            hasTriggeredImpactRef.current = true;
            playImpactSound();

            for (let i = 0; i < 35; i++) {
              const angle = Math.random() * Math.PI;
              const speed = 25 + Math.random() * 65;
              pArr.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
                vy: -Math.sin(angle) * speed,
                size: 2.5 + Math.random() * 5,
                color: ['#ef4444', '#f59e0b', '#fbbf24', '#38bdf8', '#ffffff'][Math.floor(Math.random() * 5)],
                alpha: 1.0,
                decay: 0.025 + Math.random() * 0.04,
                gravity: 90,
                life: 0
              });
            }
          }

          if (loopEnabledRef.current) {
            if (!loopTimeoutRef.current) {
              loopTimeoutRef.current = window.setTimeout(() => {
                loopTimeoutRef.current = null;
                triggerFire();
              }, 1400);
            }
          } else {
            isPlayingRef.current = false;
            setIsPlaying(false);
          }
        }
      }

      // Draw canvas frame at native 60fps
      drawCanvas();
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
    };
  }, [playImpactSound, triggerFire]);

  // Hardware-accelerated canvas rendering routine
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const padLeft = 85;
    const padRight = 80;
    const padBottom = 65;
    const padTop = 65;

    const groundY = height - padBottom;
    const originX = padLeft;

    // Ballistic physics constants and user inputs
    const v0 = Math.max(1, Number(velocity));
    const safeAngle = Math.max(0.5, Math.min(89.5, Number(angleDeg)));
    const rad = (safeAngle * Math.PI) / 180;
    const g = Number(gravity) > 0 ? Number(gravity) : 9.81;

    // Theoretical vacuum ballistic bounds
    const theoRange = (v0 * v0 * Math.sin(2 * rad)) / g;
    const theoHeight = (v0 * v0 * Math.sin(rad) * Math.sin(rad)) / (2 * g);
    const totalFlightTime = (2 * v0 * Math.sin(rad)) / g;

    // Model prediction response is the single source of truth for range and height
    const targetDistance = (predictedRange && predictedRange > 0) ? predictedRange : ((maxRange && maxRange > 0) ? maxRange : theoRange);
    const targetMaxHeight = (predictedHeight && predictedHeight > 0) ? predictedHeight : ((maxHeight && maxHeight > 0) ? maxHeight : theoHeight);

    // Maximum theoretical physical bounds across all angles for this launch velocity (45 deg for max range, 90 deg for max height)
    const maxPossibleRange = (v0 * v0) / g;
    const maxPossibleHeight = (v0 * v0) / (2 * g);

    // Stable coordinate reference envelope:
    // Guarantees that as launch angle changes:
    // - Apex height VISIBLY RISES up to the top of the canvas at high angles (70-85 deg) and stays low at shallow angles (10-25 deg)!
    // - Landing distance VISIBLY SHIFTS downrange, reaching the far right target at 45 deg and retracting closer at steeper/shallower angles!
    const effectiveMaxRange = Math.max(100, targetDistance * 1.08, maxPossibleRange * 1.10);
    const effectiveMaxHeight = Math.max(50, targetMaxHeight * 1.15, maxPossibleHeight * 1.18);

    const scaleX = (width - padLeft - padRight) / effectiveMaxRange;
    const scaleY = (groundY - padTop) / effectiveMaxHeight;

    // Aim gun barrel in canvas coordinates to align with trajectory takeoff
    const screenAngleRad = Math.atan2(Math.sin(rad) * scaleY, Math.cos(rad) * scaleX);

    // Gun placement & muzzle position
    const gunBaseX = originX;
    const gunBaseY = groundY;
    const pivotX = gunBaseX;
    const pivotY = gunBaseY - 22;

    const barrelLength = 54;
    const muzzleTipDist = 8 + barrelLength + 10; // 72px
    const muzzleScreenX = pivotX + muzzleTipDist * Math.cos(screenAngleRad);
    const muzzleScreenY = pivotY - muzzleTipDist * Math.sin(screenAngleRad);

    // Target Stand & Bullseye placement: moves dynamically according to PREDICTED LANDING!
    const targetSx = Math.max(muzzleScreenX + 30, originX + targetDistance * scaleX);
    const targetSy = groundY;
    const targetCenterY = targetSy - 34;

    // Apex marker placement: dynamically computed from actual targetMaxHeight
    const apexSx = (muzzleScreenX + targetSx) / 2;
    const apexSy = Math.min(groundY - 14, groundY - targetMaxHeight * scaleY);

    // Smooth model-driven trajectory path formula connecting muzzle directly to target bullseye
    const yMid = (muzzleScreenY + targetCenterY) / 2;
    const getXAt = (u: number) => muzzleScreenX + u * (targetSx - muzzleScreenX);
    const getYAt = (u: number) => (1 - u) * muzzleScreenY + u * targetCenterY - 4 * (yMid - apexSy) * u * (1 - u);

    // 1. Theme-Harmonized Aerospace Testing Backdrop (Warm navy-slate, not pitch black)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#101c2e');
    skyGrad.addColorStop(0.35, '#162740');
    skyGrad.addColorStop(0.75, '#1e3352');
    skyGrad.addColorStop(1, '#253e63');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Apex elevation soft ambient illumination
    const apexGlow = ctx.createRadialGradient(apexSx, apexSy, 15, apexSx, apexSy, Math.max(140, width * 0.35));
    apexGlow.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
    apexGlow.addColorStop(0.5, 'rgba(34, 211, 238, 0.05)');
    apexGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = apexGlow;
    ctx.fillRect(0, 0, width, groundY);

    // Grid ticks
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';

    const rangeStep = effectiveMaxRange > 50000 ? 10000 : effectiveMaxRange > 20000 ? 5000 : effectiveMaxRange > 5000 ? 2000 : effectiveMaxRange > 1000 ? 500 : 100;
    for (let rx = rangeStep; rx <= effectiveMaxRange; rx += rangeStep) {
      const gx = originX + rx * scaleX;
      if (gx < width - padRight + 20) {
        ctx.beginPath();
        ctx.setLineDash([3, 5]);
        ctx.moveTo(gx, padTop);
        ctx.lineTo(gx, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${(rx / 1000).toFixed(rx >= 10000 ? 0 : 1)}km`, gx, groundY + 18);
      }
    }

    const heightStep = effectiveMaxHeight > 20000 ? 5000 : effectiveMaxHeight > 5000 ? 2000 : effectiveMaxHeight > 1000 ? 500 : effectiveMaxHeight > 200 ? 100 : 25;
    for (let ry = heightStep; ry <= effectiveMaxHeight; ry += heightStep) {
      const gy = groundY - ry * scaleY;
      if (gy > padTop) {
        ctx.beginPath();
        ctx.setLineDash([2, 5]);
        ctx.moveTo(originX, gy);
        ctx.lineTo(width - padRight, gy);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${(ry / 1000).toFixed(ry >= 10000 ? 0 : 1)}km`, originX - 8, gy + 3.5);
      }
    }

    // 2. Ground Runway & Baseline
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#1e293b');
    groundGrad.addColorStop(0.3, '#172436');
    groundGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(originX - 30, groundY);
    ctx.lineTo(width - padRight + 30, groundY);
    ctx.stroke();

    for (let rx = 0; rx <= effectiveMaxRange; rx += rangeStep / 2) {
      const gx = originX + rx * scaleX;
      if (gx < width - padRight + 20) {
        ctx.beginPath();
        ctx.moveTo(gx, groundY);
        ctx.lineTo(gx, groundY + 5);
        ctx.stroke();
      }
    }

    // 3. Projected Trajectory Curve & Area
    if (showTrajectoryArcRef.current) {
      const numSteps = 120;
      const areaGrad = ctx.createLinearGradient(0, padTop, 0, groundY);
      areaGrad.addColorStop(0, 'rgba(34, 211, 238, 0.18)');
      areaGrad.addColorStop(0.65, 'rgba(34, 211, 238, 0.05)');
      areaGrad.addColorStop(1, 'rgba(34, 211, 238, 0.0)');

      ctx.fillStyle = areaGrad;
      ctx.beginPath();
      ctx.moveTo(muzzleScreenX, groundY);
      for (let i = 0; i <= numSteps; i++) {
        const u = i / numSteps;
        ctx.lineTo(getXAt(u), getYAt(u));
      }
      ctx.lineTo(targetSx, groundY);
      ctx.closePath();
      ctx.fill();

      // Dashed full trajectory guide from muzzle to target
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i <= numSteps; i++) {
        const u = i / numSteps;
        const px = getXAt(u);
        const py = getYAt(u);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Read current flight progress directly from progressRef
    const curProg = progressRef.current;
    const isStandby = curProg === 0 && !isPlayingRef.current;
    const isImpacted = curProg >= 1.0;

    // Active illuminated tracer path up to bullet
    if (showTrajectoryArcRef.current && curProg > 0) {
      const curSteps = Math.max(1, Math.floor(curProg * 120));
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i <= curSteps; i++) {
        const u = (i / curSteps) * curProg;
        const px = getXAt(u);
        const py = getYAt(u);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 4. Prominent Apex (Max Height) Indicator
    if (targetMaxHeight > 0) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(apexSx, apexSy + 6);
      ctx.lineTo(apexSx, groundY);
      ctx.stroke();
      ctx.setLineDash([]);

      const pulse = Math.sin(performance.now() * 0.006) * 3;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(apexSx, apexSy, 8 + pulse, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(apexSx, apexSy, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(apexSx - 80, apexSy - 34, 160, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`▲ APEX: ${targetMaxHeight.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m`, apexSx, apexSy - 20);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`at ${(targetDistance / 2000).toFixed(1)} km downrange`, apexSx, apexSy - 10);
    }

    // 5A. Stationary Target Stand & Bullseye at Fixed Range Station (DOES NOT MOVE with user input)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(targetSx - 14, targetSy);
    ctx.lineTo(targetSx, targetSy - 38);
    ctx.lineTo(targetSx + 14, targetSy);
    ctx.moveTo(targetSx - 9, targetSy - 14);
    ctx.lineTo(targetSx + 9, targetSy - 14);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(targetSx, targetSy - 38);
    ctx.lineTo(targetSx, targetSy - 62);
    ctx.stroke();

    const flagWave = Math.sin(performance.now() * 0.005) * 3;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(targetSx, targetSy - 62);
    ctx.lineTo(targetSx + 18, targetSy - 56 + flagWave);
    ctx.lineTo(targetSx, targetSy - 50);
    ctx.closePath();
    ctx.fill();

    const targetRadius = 16;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(targetSx, targetCenterY, targetRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(targetSx, targetCenterY, targetRadius * 0.75, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(targetSx, targetCenterY, targetRadius * 0.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(targetSx, targetCenterY, targetRadius * 0.3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(targetSx, targetCenterY, targetRadius * 0.15, 0, 2 * Math.PI);
    ctx.fill();

    // Target Plaque at Predicted Landing Distance
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(targetSx - 74, targetSy + 8, 148, 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`🎯 PREDICTED LANDING`, targetSx, targetSy + 22);

    ctx.fillStyle = '#a5f3fc';
    ctx.font = 'bold 10.5px monospace';
    ctx.fillText(`${targetDistance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m`, targetSx, targetSy + 32);

    // Glowing impact touchdown rings beneath target stand
    const landingPulse = Math.sin(performance.now() * 0.007) * 2;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(targetSx, groundY, 16 + landingPulse, 5 + landingPulse * 0.3, 0, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(targetSx, groundY, 4, 0, 2 * Math.PI);
    ctx.fill();

    // 6. Artillery Cannon at Origin - Pointed at exact angle set by user
    ctx.fillStyle = '#334155';
    ctx.fillRect(gunBaseX - 35, gunBaseY - 6, 70, 6);
    ctx.fillStyle = '#eab308';
    for (let sx = -30; sx < 30; sx += 14) {
      ctx.beginPath();
      ctx.moveTo(gunBaseX + sx, gunBaseY - 6);
      ctx.lineTo(gunBaseX + sx + 6, gunBaseY - 6);
      ctx.lineTo(gunBaseX + sx + 3, gunBaseY);
      ctx.lineTo(gunBaseX + sx - 3, gunBaseY);
      ctx.fill();
    }

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

    // Angle protractor arc showing user-selected angle
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 28, 0, -screenAngleRad, true);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${angleDeg.toFixed(1)}°`, pivotX + 32, pivotY - 8);

    const recoilDist = recoilRef.current * 14;

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(-screenAngleRad);
    ctx.translate(-recoilDist, 0);

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

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(8 + barrelLength - 2, -7.5, 12, 15, 2);
    ctx.fill();
    ctx.stroke();

    const tipX = 8 + barrelLength + 10;
    const tipY = 0;

    // Gunfire Muzzle Flash Flare
    if (muzzleFlashRef.current > 0.05) {
      const flashScale = muzzleFlashRef.current;

      ctx.strokeStyle = `rgba(56, 189, 248, ${flashScale * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 18 + (1 - flashScale) * 35, 0, 2 * Math.PI);
      ctx.stroke();

      const flameGrad = ctx.createRadialGradient(tipX, tipY, 2, tipX + 16, tipY, 42 * flashScale);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.2, '#fef08a');
      flameGrad.addColorStop(0.6, '#f97316');
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(tipX, -4);
      ctx.lineTo(tipX + 48 * flashScale, -16 * flashScale);
      ctx.lineTo(tipX + 64 * flashScale, 0);
      ctx.lineTo(tipX + 48 * flashScale, 16 * flashScale);
      ctx.lineTo(tipX, 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 7. Blast & Impact Particles
    for (const p of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc((isImpacted ? targetSx : muzzleScreenX) + p.x, (isImpacted ? targetCenterY : muzzleScreenY) + p.y, Math.max(1, p.size), 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // -------------------------------------------------------------
    // 8. BOLD & UNMISTAKABLY VISIBLE BULLET SHOT (ZERO-LAG RENDER)
    // Scaled to 52px length x 18px height with bright flame flare,
    // motion light ribbon, Mach wings, and glowing targeting brackets
    // -------------------------------------------------------------
    const bulletScreenX = isImpacted ? targetSx : isStandby ? muzzleScreenX : getXAt(curProg);
    const bulletScreenY = isImpacted ? targetCenterY : isStandby ? muzzleScreenY : getYAt(curProg);

    let flyAngle = -screenAngleRad;
    if (isImpacted) {
      flyAngle = Math.atan2(targetCenterY - getYAt(0.98), targetSx - getXAt(0.98));
    } else if (!isStandby) {
      const uNext = Math.min(1.0, curProg + 0.005);
      flyAngle = Math.atan2(getYAt(uNext) - bulletScreenY, getXAt(uNext) - bulletScreenX);
    }

    // Live Telemetry Physical Values
    const interpX = curProg * targetDistance;
    const interpY = Math.max(0, 4 * targetMaxHeight * curProg * (1 - curProg));
    const tElapsed = curProg * totalFlightTime;
    const vx = v0 * Math.cos(rad);
    const vy = v0 * Math.sin(rad) - g * tElapsed;
    const interpSpeed = isImpacted ? Math.sqrt(vx * vx + vy * vy) : isStandby ? v0 : Math.sqrt(vx * vx + vy * vy);

    // Instant lag-free telemetry update directly into DOM elements
    if (liveDownrangeDomRef.current) {
      liveDownrangeDomRef.current.textContent = isImpacted
        ? `${targetDistance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m`
        : `${Math.round(interpX).toLocaleString()} m`;
    }
    if (liveAltDomRef.current) {
      liveAltDomRef.current.textContent = isImpacted
        ? '0.0 m'
        : `${Math.round(interpY).toLocaleString()} m`;
    }
    if (liveSpeedDomRef.current) {
      liveSpeedDomRef.current.textContent = `${Math.round(interpSpeed)} m/s (Mach ${(interpSpeed / 343).toFixed(1)})`;
    }

    // Glowing motion tracer ribbon trailing behind bullet in flight
    if (!isStandby && !isImpacted && curProg > 0.01) {
      ctx.save();
      const trailCount = 14;
      for (let i = 0; i < trailCount; i++) {
        const uA = Math.max(0, curProg - (i / 120));
        const uB = Math.max(0, curProg - ((i + 1) / 120));
        const ax = getXAt(uA);
        const ay = getYAt(uA);
        const bx = getXAt(uB);
        const by = getYAt(uB);

        const trailRatio = 1 - i / trailCount;
        ctx.strokeStyle = `rgba(251, 191, 36, ${trailRatio * 0.85})`;
        ctx.lineWidth = trailRatio * 6 + 1.2;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render the Bullet Model
    ctx.save();
    ctx.translate(bulletScreenX, bulletScreenY);
    ctx.rotate(flyAngle);

    // Mach Cone Shockwave Wings
    if (!isStandby && !isImpacted && interpSpeed > 280) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(-42, -26);
      ctx.moveTo(26, 0);
      ctx.lineTo(-42, 26);
      ctx.stroke();
    }

    // High-Intensity Rocket / Incendiary Exhaust Flare
    if (!isStandby && !isImpacted) {
      const flicker = 1 + (Math.sin(performance.now() * 0.03) * 0.2);

      // Layer 1: Radiant Outer Flame Glow
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.beginPath();
      ctx.arc(-18, 0, 28 * flicker, 0, 2 * Math.PI);
      ctx.fill();

      // Layer 2: Multi-stop Core Exhaust Jet
      const flameGrad = ctx.createRadialGradient(-14, 0, 2, -28, 0, 36 * flicker);
      flameGrad.addColorStop(0, '#ffffff'); // White-hot plasma core
      flameGrad.addColorStop(0.2, '#fef08a'); // Brilliant yellow
      flameGrad.addColorStop(0.5, '#f59e0b'); // Blazing amber
      flameGrad.addColorStop(0.8, '#ea580c'); // Deep fire orange
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(-16, 0, 22 * flicker, 0, 2 * Math.PI);
      ctx.fill();

      // Exhaust cone jet
      ctx.beginPath();
      ctx.moveTo(-12, -7);
      ctx.lineTo(-48 * flicker, 0);
      ctx.lineTo(-12, 7);
      ctx.closePath();
      ctx.fill();
    }

    // Bullet Metallic Spitzer Body (Large & Ultra-Visible: 50px length x 18px height)
    const bulletGrad = ctx.createLinearGradient(0, -9, 0, 9);
    bulletGrad.addColorStop(0, '#ffffff'); // High-contrast metallic reflection
    bulletGrad.addColorStop(0.18, '#fef08a'); // Gleaming gold
    bulletGrad.addColorStop(0.45, '#f59e0b'); // Polished brass
    bulletGrad.addColorStop(0.75, '#b45309'); // Rich copper jacket
    bulletGrad.addColorStop(1, '#451a03'); // Shadow underside

    ctx.fillStyle = bulletGrad;
    ctx.strokeStyle = '#291102';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    // Boat-tail base
    ctx.moveTo(-16, -5.5);
    // Cylindrical shank
    ctx.lineTo(-3, -8.5);
    // Ogive curved pointed tip
    ctx.quadraticCurveTo(14, -8, 28, 0);
    ctx.quadraticCurveTo(14, 8, -3, 8.5);
    // Underside boat-tail
    ctx.lineTo(-16, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Copper driving band (rifling groove)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-8, -7.5);
    ctx.lineTo(-8, 7.5);
    ctx.stroke();

    // Top metallic gleam streak
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-5, -5.5);
    ctx.quadraticCurveTo(10, -5, 22, -0.8);
    ctx.stroke();

    ctx.restore();

    // Tactical Pulsing Targeting Reticle & Brackets Around Bullet
    if (!isStandby && !isImpacted) {
      const pulseRing = Math.sin(performance.now() * 0.008) * 4;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
      ctx.lineWidth = 1.8;

      // Dashed tracking circle
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.arc(bulletScreenX, bulletScreenY, 30 + pulseRing, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4 Tactical corner crosshair brackets
      const bDist = 34 + pulseRing;
      const bLen = 9;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      // Top-Left
      ctx.moveTo(bulletScreenX - bDist, bulletScreenY - bDist + bLen);
      ctx.lineTo(bulletScreenX - bDist, bulletScreenY - bDist);
      ctx.lineTo(bulletScreenX - bDist + bLen, bulletScreenY - bDist);
      // Top-Right
      ctx.moveTo(bulletScreenX + bDist - bLen, bulletScreenY - bDist);
      ctx.lineTo(bulletScreenX + bDist, bulletScreenY - bDist);
      ctx.lineTo(bulletScreenX + bDist, bulletScreenY - bDist + bLen);
      // Bottom-Left
      ctx.moveTo(bulletScreenX - bDist, bulletScreenY + bDist - bLen);
      ctx.lineTo(bulletScreenX - bDist, bulletScreenY + bDist);
      ctx.lineTo(bulletScreenX - bDist + bLen, bulletScreenY + bDist);
      // Bottom-Right
      ctx.moveTo(bulletScreenX + bDist - bLen, bulletScreenY + bDist);
      ctx.lineTo(bulletScreenX + bDist, bulletScreenY + bDist);
      ctx.lineTo(bulletScreenX + bDist, bulletScreenY + bDist - bLen);
      ctx.stroke();

      // High-contrast floating Telemetry HUD Tag above bullet
      const hudY = Math.max(padTop + 5, bulletScreenY - 44);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bulletScreenX + 22, hudY, 150, 34, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 10.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`● BULLET: ${Math.round(interpSpeed)} m/s`, bulletScreenX + 28, hudY + 14);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9.5px monospace';
      ctx.fillText(`Alt: ${Math.round(interpY).toLocaleString()}m | ${(interpX / 1000).toFixed(1)}km`, bulletScreenX + 28, hudY + 27);
    } else if (isStandby) {
      // Clean Standby Pill Indicator: Shows gun is locked, loaded and ready to fire at set angle
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(muzzleScreenX + 18, muzzleScreenY - 38, 175, 34, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`● READY • ELEVATION: ${angleDeg.toFixed(1)}°`, muzzleScreenX + 26, muzzleScreenY - 22);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText('Click RUN MODEL PREDICTION', muzzleScreenX + 26, muzzleScreenY - 10);
    }

    // 9. Terminal Impact Banner
    if (hasTriggeredImpactRef.current) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.beginPath();
      ctx.arc(targetSx, targetCenterY, 38, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;

      const bannerWidth = 320;
      const bannerX = width / 2 - bannerWidth / 2;
      const bannerY = padTop + 8;

      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerWidth, 44, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎯 DIRECT TARGET IMPACT!', width / 2, bannerY + 18);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px monospace';
      ctx.fillText(
        `Range: ${targetDistance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m  •  Flight: ${(totalFlightTime || 0).toFixed(1)}s`,
        width / 2,
        bannerY + 34
      );
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-700/60 shadow-lg space-y-3">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Crosshair className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <span>Dynamic Firing Range Simulation</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`}></span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Gun aimed at user angle ({angleDeg.toFixed(1)}°) &bull; Bullet follows trained model trajectory &bull; Stable standby
            </p>
          </div>
        </div>

        {/* Audio, Path & Loop Options */}
        <div className="flex items-center gap-2">
          {/* Continuous Loop Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !loopEnabled;
              setLoopEnabled(nextVal);
              loopEnabledRef.current = nextVal;
            }}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all ${
              loopEnabled
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={loopEnabled ? 'Auto-Loop Firing Active' : 'Single Shot Mode (Stable)'}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{loopEnabled ? 'LOOP ON' : 'LOOP OFF'}</span>
          </button>

          {/* Audio SFX Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !soundEnabled;
              setSoundEnabled(nextVal);
              soundEnabledRef.current = nextVal;
            }}
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

          {/* Path Arc Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !showTrajectoryArc;
              setShowTrajectoryArc(nextVal);
              showTrajectoryArcRef.current = nextVal;
            }}
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

      {/* Main Canvas Container (Refined aerospace testing viewport) */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={820}
          height={400}
          className="w-full h-auto block select-none"
        />

        {/* Top-Right Telemetry Badges (Instant updates without React re-render) */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1 items-end pointer-events-none">
          <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-slate-950/85 border border-cyan-500/40 text-[9px] sm:text-[10px] font-mono text-cyan-300 backdrop-blur-sm shadow-md">
            SPEED: <strong ref={liveSpeedDomRef}>{Math.round(velocity)} m/s</strong>
          </div>
          <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-slate-950/85 border border-amber-500/40 text-[9px] sm:text-[10px] font-mono text-amber-300 backdrop-blur-sm shadow-md">
            HEIGHT: <strong>{displayTargetHeight.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m</strong>
          </div>
          <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-slate-950/85 border border-emerald-500/40 text-[9px] sm:text-[10px] font-mono text-emerald-300 backdrop-blur-sm shadow-md">
            RANGE: <strong>{displayTargetRange.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m</strong>
          </div>
        </div>
      </div>

      {/* Interactive Firing & Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerFire();
              if (onFire) onFire();
            }}
            disabled={loading}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-amber-900/30 border border-amber-400/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Flame className="w-4 h-4 text-yellow-200 fill-yellow-300 animate-pulse" />
            <span>FIRE BULLET</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextVal = !isPlaying;
              setIsPlaying(nextVal);
              isPlayingRef.current = nextVal;
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={triggerFire}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-all"
            title="Replay Shot"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-mono">
          <span className="text-[10px] text-slate-400 px-2 font-bold uppercase">Speed:</span>
          {[0.25, 0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => {
                setPlaybackSpeed(spd);
                playbackSpeedRef.current = spd;
              }}
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

      {/* Telemetry Readout Grid (Live lag-free DOM updates) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Bullet Downrange</div>
          <div ref={liveDownrangeDomRef} className="text-sm font-bold text-cyan-300 mt-0.5">
            0 m
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Bullet Altitude</div>
          <div ref={liveAltDomRef} className="text-sm font-bold text-emerald-300 mt-0.5">
            0 m
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Apex Max Height</div>
          <div className="text-sm font-bold text-amber-300 mt-0.5">
            {displayTargetHeight.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Target Max Range</div>
          <div className="text-sm font-bold text-rose-300 mt-0.5">
            {displayTargetRange.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m
          </div>
        </div>
      </div>
    </div>
  );
};
