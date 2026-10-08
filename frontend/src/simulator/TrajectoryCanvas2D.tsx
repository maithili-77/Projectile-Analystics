import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { TrajectoryPoint } from '../types';

interface Props {
  points: TrajectoryPoint[];
  maxRange: number;
  maxHeight: number;
}

export const TrajectoryCanvas2D: React.FC<Props> = ({ points, maxRange, maxHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(true);
  }, [points]);

  useEffect(() => {
    let animationFrameId: number;
    if (isPlaying && points.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= points.length - 1) {
            setIsPlaying(false);
            return points.length - 1;
          }
          return prev + 1;
        });
      }, 30 / playbackSpeed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, points, playbackSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;

    ctx.clearRect(0, 0, width, height);

    // Grid lines & Background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (let x = padding; x < width - padding; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    for (let y = padding; y < height - padding; y += 40) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Baseline Ground
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Scale calculation
    const effectiveRange = Math.max(10, maxRange * 1.1);
    const effectiveHeight = Math.max(5, maxHeight * 1.25);
    const scaleX = (width - 2 * padding) / effectiveRange;
    const scaleY = (height - 2 * padding) / effectiveHeight;

    // Draw trajectory path line up to currentIndex
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.beginPath();

    for (let i = 0; i <= currentIndex; i++) {
      const pt = points[i];
      const px = padding + pt.x * scaleX;
      const py = height - padding - pt.y * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Start Point Marker
    if (points.length > 0) {
      const startPt = points[0];
      const startPx = padding + startPt.x * scaleX;
      const startPy = height - padding - startPt.y * scaleY;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(startPx, startPy, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#34d399';
      ctx.font = '10px Fira Code';
      ctx.fillText(`Start (0m)`, startPx - 15, startPy + 18);
    }

    // Draw Apex (Maximum-Height) Marker
    if (points.length > 0) {
      const apexPt = [...points].sort((a, b) => b.y - a.y)[0];
      const apexPx = padding + apexPt.x * scaleX;
      const apexPy = height - padding - apexPt.y * scaleY;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(apexPx, apexPy, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.font = '10px Fira Code';
      ctx.fillText(`Max Height: ${apexPt.y}m`, apexPx - 35, apexPy - 10);
    }

    // Draw End Point Marker
    if (points.length > 0) {
      const endPt = points[points.length - 1];
      const endPx = padding + endPt.x * scaleX;
      const endPy = height - padding - endPt.y * scaleY;

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(endPx, endPy, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fb7185';
      ctx.font = '10px Fira Code';
      ctx.fillText(`End Point (${endPt.x}m)`, endPx - 40, endPy + 18);
    }

    // Draw Animated Projectile head
    if (currentIndex < points.length) {
      const curr = points[currentIndex];
      const cx = padding + curr.x * scaleX;
      const cy = height - padding - curr.y * scaleY;

      ctx.fillStyle = '#6366f1';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Stats overlay on head
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px Fira Code';
      ctx.fillText(`t=${curr.t}s | v=${curr.v}m/s`, cx + 10, cy - 10);
    }
  }, [points, currentIndex, maxRange, maxHeight]);

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          2D Real-Time Animated Canvas
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 font-mono"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => setCurrentIndex(0)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono"
            title="Reset Animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPlaybackSpeed((sp) => (sp >= 4 ? 1 : sp * 2))}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg bg-slate-950 border border-slate-900">
        <canvas ref={canvasRef} width={750} height={360} className="w-full h-auto block" />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Distance: <strong className="text-cyan-400">{points[currentIndex]?.x ?? 0}m</strong></span>
        <span>Height: <strong className="text-emerald-400">{points[currentIndex]?.y ?? 0}m</strong></span>
        <span>Simulation Time: <strong className="text-amber-400">{points[currentIndex]?.t ?? 0}s</strong></span>
      </div>
    </div>
  );
};

