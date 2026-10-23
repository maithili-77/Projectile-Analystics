import React, { useState, useEffect, useRef } from 'react';
import { X, FastForward, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const ANIMATION_DURATION = 3.6; // 3.6s active sequence + 0.4s fade = exactly 4.0s total intro
const FADE_OUT_DURATION = 0.4;

export const IntroAnimation: React.FC<Props> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [hasFinished, setHasFinished] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Safely mark completed and fade out
  const handleFinish = () => {
    if (hasFinished) return;
    setHasFinished(true);
    setIsFadingOut(true);

    try {
      sessionStorage.setItem('ballistic_analyst_intro_seen', 'true');
    } catch {
      // Ignore storage errors if disabled/restricted
    }

    // Allow smooth fade-out transition before unmounting
    setTimeout(() => {
      onComplete();
    }, FADE_OUT_DURATION * 1000);
  };

  // Keyboard shortcut listener (Escape or Space to skip immediately)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasFinished]);

  // Main animation lifecycle & prefers-reduced-motion check
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Direct subtle reveal and quick dismiss without rapid motion
      timerRef.current = setTimeout(() => {
        handleFinish();
      }, 800);
      return;
    }

    // Sequence timing: 3.6s of cinematic animation + 0.4s smooth fade = exactly 4.0s total duration
    timerRef.current = setTimeout(() => {
      handleFinish();
    }, ANIMATION_DURATION * 1000);

    // Fail-safe safety timer: under no circumstances stay stuck after 4.6s
    safetyTimerRef.current = setTimeout(() => {
      handleFinish();
    }, 4600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {!hasFinished || isFadingOut ? (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isFadingOut ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_OUT_DURATION, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[120] w-screen h-screen flex flex-col items-center justify-center bg-white text-slate-900 select-none overflow-hidden"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {/* Subtle tactical grid background with light royal-blue ambience */}
          <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/[0.035] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-orange-500/[0.025] rounded-full blur-2xl pointer-events-none" />

          {/* Top-Right Skip Intro Button */}
          <button
            onClick={handleFinish}
            id="skip-intro-btn"
            className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 px-3.5 sm:px-4 py-2 rounded-full bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-blue-700 border border-slate-200/90 shadow-sm hover:shadow-md text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md active:scale-95 group"
            title="Skip Intro (Escape or Space)"
          >
            <span className="tracking-wider font-semibold">SKIP INTRO</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 group-hover:text-blue-600 border border-slate-200">
              ESC
            </span>
            <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>

          {/* Main Cinematic SVG Animation Stage */}
          <div className="relative w-full max-w-4xl px-4 sm:px-8 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 900 480"
              className="w-full h-auto max-h-[75vh] overflow-visible drop-shadow-[0_8px_24px_rgba(29,78,216,0.06)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Royal blue & navy gradients */}
                <linearGradient id="rifleMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0B132B" />
                  <stop offset="50%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                <linearGradient id="scopeGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.4" />
                </linearGradient>

                {/* Bullet copper to vibrant orange gradient */}
                <linearGradient id="bulletGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EA580C" />
                  <stop offset="60%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#FDBA74" />
                </linearGradient>

                {/* Orange speed & motion trail gradient */}
                <linearGradient id="motionTrail" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0" />
                  <stop offset="35%" stopColor="#EA580C" stopOpacity="0.25" />
                  <stop offset="75%" stopColor="#F97316" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#FB923C" stopOpacity="0.95" />
                </linearGradient>

                {/* Orange speed lines gradient */}
                <linearGradient id="speedLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FB923C" stopOpacity="0" />
                  <stop offset="50%" stopColor="#F97316" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
                </linearGradient>

                {/* Blue reticle glow filter */}
                <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Orange muzzle flash glow filter */}
                <filter id="orangeFlashGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Targeting Circle & Crosshairs (Center: x=450, y=190) */}
              <motion.g
                initial={{ scale: 0.5, rotate: -35, opacity: 0 }}
                animate={{
                  scale: [0.5, 1, 1, 1],
                  rotate: [-35, 0, 0, 0],
                  opacity: [0, 1, 1, 1],
                }}
                transition={{
                  duration: ANIMATION_DURATION,
                  times: [0, 0.22, 0.85, 1],
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ transformOrigin: '450px 190px' }}
              >
                {/* Outer thin blue targeting circle */}
                <circle
                  cx="450"
                  cy="190"
                  r="125"
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="1.75"
                  className="opacity-80"
                />

                {/* Concentric dashed ring */}
                <circle
                  cx="450"
                  cy="190"
                  r="85"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="1.2"
                  strokeDasharray="6 4"
                  className="opacity-60"
                />

                {/* Inner reticle */}
                <circle
                  cx="450"
                  cy="190"
                  r="35"
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="opacity-50"
                />
                <circle cx="450" cy="190" r="2.5" fill="#1D4ED8" />

                {/* Horizontal crosshair lines */}
                <line
                  x1="300"
                  y1="190"
                  x2="415"
                  y2="190"
                  stroke="#1D4ED8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="485"
                  y1="190"
                  x2="600"
                  y2="190"
                  stroke="#1D4ED8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Vertical crosshair lines */}
                <line
                  x1="450"
                  y1="50"
                  x2="450"
                  y2="155"
                  stroke="#1D4ED8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="450"
                  y1="225"
                  x2="450"
                  y2="330"
                  stroke="#1D4ED8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Precision Hash Marks */}
                {/* Horizontal ticks */}
                <line x1="340" y1="184" x2="340" y2="196" stroke="#2563EB" strokeWidth="1" />
                <line x1="380" y1="186" x2="380" y2="194" stroke="#2563EB" strokeWidth="1" />
                <line x1="520" y1="186" x2="520" y2="194" stroke="#2563EB" strokeWidth="1" />
                <line x1="560" y1="184" x2="560" y2="196" stroke="#2563EB" strokeWidth="1" />

                {/* Vertical ticks */}
                <line x1="444" y1="80" x2="456" y2="80" stroke="#2563EB" strokeWidth="1" />
                <line x1="446" y1="120" x2="454" y2="120" stroke="#2563EB" strokeWidth="1" />
                <line x1="446" y1="260" x2="454" y2="260" stroke="#2563EB" strokeWidth="1" />
                <line x1="444" y1="300" x2="456" y2="300" stroke="#2563EB" strokeWidth="1" />

                {/* High-tech telemetry labels */}
                <text
                  x="450"
                  y="42"
                  textAnchor="middle"
                  fill="#1D4ED8"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                >
                  CALIBRATION 000° MIL
                </text>
                <text
                  x="610"
                  y="193"
                  textAnchor="start"
                  fill="#2563EB"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  RANGE 100M
                </text>
                <text
                  x="290"
                  y="193"
                  textAnchor="end"
                  fill="#2563EB"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  ELEV 0.0 MOA
                </text>
              </motion.g>

              {/* 2. Orange Speed-Lines darting across background */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0, 1, 0.4, 0],
                }}
                transition={{
                  duration: ANIMATION_DURATION,
                  times: [0, 0.24, 0.32, 0.52, 1],
                  ease: 'easeOut',
                }}
              >
                <line x1="150" y1="172" x2="420" y2="172" stroke="url(#speedLineGrad)" strokeWidth="1.5" />
                <line x1="500" y1="176" x2="780" y2="176" stroke="url(#speedLineGrad)" strokeWidth="2.5" />
                <line x1="220" y1="190" x2="680" y2="190" stroke="url(#speedLineGrad)" strokeWidth="2" />
                <line x1="460" y1="204" x2="740" y2="204" stroke="url(#speedLineGrad)" strokeWidth="1.5" />
                <line x1="180" y1="212" x2="520" y2="212" stroke="url(#speedLineGrad)" strokeWidth="1" />
              </motion.g>

              {/* 3. Sleek Stylized Rifle Silhouette with Recoil Physics */}
              {/* Slides smoothly into center from left, then kicks back on shot */}
              <motion.g
                initial={{ x: -220, opacity: 0 }}
                animate={{
                  x: [-220, 0, -12, 0, 0],
                  opacity: [0, 1, 1, 1, 1],
                }}
                transition={{
                  duration: ANIMATION_DURATION,
                  times: [0, 0.22, 0.26, 0.34, 1],
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* Precision Sniper Rifle Body Group */}
                <g id="sniper-rifle">
                  {/* Buttstock & Cheek Riser */}
                  <path
                    d="M 235 186 L 275 186 C 290 186 315 190 325 192 L 325 210 L 295 212 L 270 226 L 235 224 Z"
                    fill="url(#rifleMetal)"
                  />
                  {/* Buttpad */}
                  <rect x="230" y="186" width="6" height="38" rx="2" fill="#0F172A" />

                  {/* Pistol Grip */}
                  <path
                    d="M 330 196 L 342 196 L 332 238 L 318 236 Z"
                    fill="#0F172A"
                  />
                  {/* Trigger & Trigger Guard */}
                  <path
                    d="M 342 200 C 354 200 358 214 345 218 Z"
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="2"
                  />
                  <line x1="344" y1="204" x2="340" y2="212" stroke="#EA580C" strokeWidth="1.5" />

                  {/* Detachable Tactical Magazine */}
                  <path
                    d="M 370 200 L 396 200 L 388 232 L 366 230 Z"
                    fill="#1E293B"
                    stroke="#0F172A"
                    strokeWidth="1"
                  />
                  {/* Magazine grooves */}
                  <line x1="372" y1="208" x2="391" y2="208" stroke="#334155" strokeWidth="1" />
                  <line x1="370" y1="216" x2="388" y2="216" stroke="#334155" strokeWidth="1" />
                  <line x1="368" y1="224" x2="385" y2="224" stroke="#334155" strokeWidth="1" />

                  {/* Main Receiver & Action */}
                  <rect x="325" y="188" width="110" height="15" rx="1.5" fill="url(#rifleMetal)" />
                  {/* Bolt & Ejection Port */}
                  <rect x="360" y="190" width="30" height="5" rx="1" fill="#334155" />
                  <line x1="355" y1="188" x2="345" y2="182" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />

                  {/* Picatinny Rail Mount */}
                  <rect x="338" y="184" width="95" height="4" fill="#1E293B" />

                  {/* High-Precision Tactical Scope */}
                  {/* Scope Mount Rings */}
                  <rect x="350" y="178" width="6" height="7" fill="#0F172A" />
                  <rect x="410" y="178" width="6" height="7" fill="#0F172A" />
                  {/* Scope Tube */}
                  <rect x="335" y="172" width="98" height="8" rx="1.5" fill="url(#rifleMetal)" />
                  {/* Eyepiece (Rear) */}
                  <path d="M 324 169 L 338 172 L 338 180 L 324 183 Z" fill="#0F172A" />
                  <rect x="321" y="169" width="4" height="14" rx="1" fill="#3B82F6" opacity="0.8" />
                  {/* Elevation & Windage Turrets */}
                  <rect x="378" y="166" width="10" height="6" rx="1" fill="#0F172A" />
                  <circle cx="383" cy="169" r="1.5" fill="#F97316" />
                  {/* Objective Lens (Front) */}
                  <path d="M 432 172 L 448 168 L 448 184 L 432 180 Z" fill="#0F172A" />
                  <rect x="448" y="167" width="5" height="18" rx="1" fill="url(#scopeGlass)" />

                  {/* Handguard / Forend */}
                  <polygon
                    points="435,188 535,188 535,200 435,202"
                    fill="url(#rifleMetal)"
                  />
                  {/* M-LOK Cooling Slots */}
                  <rect x="446" y="192" width="16" height="3" rx="1" fill="#FFFFFF" opacity="0.8" />
                  <rect x="472" y="192" width="16" height="3" rx="1" fill="#FFFFFF" opacity="0.8" />
                  <rect x="498" y="192" width="16" height="3" rx="1" fill="#FFFFFF" opacity="0.8" />

                  {/* Folded Bipod under Forend */}
                  <line x1="505" y1="202" x2="540" y2="206" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="505" cy="202" r="2.5" fill="#3B82F6" />

                  {/* Precision Barrel */}
                  <rect x="535" y="189" width="75" height="6" fill="#1E293B" />
                  {/* Fluting on Barrel */}
                  <line x1="545" y1="192" x2="595" y2="192" stroke="#334155" strokeWidth="1" />

                  {/* Tactical Muzzle Brake / Compensator */}
                  <polygon
                    points="610,187 626,187 626,197 610,197"
                    fill="#0F172A"
                  />
                  {/* Port vents */}
                  <line x1="614" y1="188" x2="614" y2="196" stroke="#F97316" strokeWidth="1.2" />
                  <line x1="619" y1="188" x2="619" y2="196" stroke="#F97316" strokeWidth="1.2" />
                </g>
              </motion.g>

              {/* 4. Orange Muzzle Flash Starburst at Muzzle Tip (x=626, y=192) */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 0, 1.4, 0, 0],
                  opacity: [0, 0, 1, 0, 0],
                }}
                transition={{
                  duration: ANIMATION_DURATION,
                  times: [0, 0.23, 0.25, 0.31, 1],
                  ease: 'easeOut',
                }}
                style={{ transformOrigin: '626px 192px' }}
              >
                {/* Radiant Outer Flash Glow */}
                <circle cx="636" cy="192" r="32" fill="#F97316" opacity="0.4" filter="url(#orangeFlashGlow)" />

                {/* Geometric Starburst Blades */}
                <polygon
                  points="626,192 680,192 638,187"
                  fill="#F97316"
                />
                <polygon
                  points="626,192 680,192 638,197"
                  fill="#F97316"
                />
                <polygon
                  points="626,192 645,160 635,185"
                  fill="#FB923C"
                />
                <polygon
                  points="626,192 645,224 635,199"
                  fill="#FB923C"
                />
                {/* Diagonal secondary sparks */}
                <line x1="626" y1="192" x2="665" y2="175" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="626" y1="192" x2="665" y2="209" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" />
                {/* White Hot Core */}
                <circle cx="630" cy="192" r="6" fill="#FFFFFF" />
              </motion.g>

              {/* 5. Stylized Bullet & Fast Orange Motion Trail (Fires Left to Right) */}
              <motion.g
                initial={{ x: 0, opacity: 0 }}
                animate={{
                  x: [0, 0, 60, 260, 320],
                  opacity: [0, 0, 1, 0.95, 0],
                }}
                transition={{
                  duration: ANIMATION_DURATION,
                  times: [0, 0.24, 0.28, 0.52, 0.68],
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* Fast Orange Motion Trail */}
                <path
                  d="M 460 190 L 626 189 C 640 189 655 190 665 190 C 655 194 640 195 626 195 L 460 194 Z"
                  fill="url(#motionTrail)"
                />
                {/* Concentrated horizontal wake */}
                <line x1="500" y1="192" x2="665" y2="192" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />

                {/* Stylized Spitzer Aerodynamic Bullet */}
                <g transform="translate(660, 187)">
                  {/* Bullet Boat-tail and Body */}
                  <path
                    d="M 0 1.5 L 14 1.5 C 20 1.5 24 3.5 28 5 C 24 6.5 20 8.5 14 8.5 L 0 8.5 L 3 5 Z"
                    fill="url(#bulletGrad)"
                  />
                  {/* Copper Jacket Glint */}
                  <path
                    d="M 6 2.5 L 16 2.5 C 20 2.5 22 3.5 24 5 L 6 5 Z"
                    fill="#FFFFFF"
                    opacity="0.5"
                  />
                  {/* Bullet Tip Gleam */}
                  <circle cx="28" cy="5" r="1.5" fill="#FFFFFF" />
                </g>
              </motion.g>

              {/* 6. Typography Reveal: BALLASTIC PREDICTION */}
              {/* Bold Royal Blue "BALLASTIC" revealed as bullet flies across */}
              <g transform="translate(450, 375)">
                {/* "BALLASTIC" in bold royal blue */}
                <motion.g
                  initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                  animate={{
                    opacity: [0, 0, 1, 1, 1],
                    y: [16, 16, 0, 0, 0],
                    filter: ['blur(8px)', 'blur(8px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
                  }}
                  transition={{
                    duration: ANIMATION_DURATION,
                    times: [0, 0.28, 0.42, 0.85, 1],
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill="#1D4ED8"
                    fontSize="46"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight="900"
                    letterSpacing="0.22em"
                    className="drop-shadow-[0_2px_12px_rgba(29,78,216,0.18)]"
                  >
                    BALLASTIC
                  </text>
                </motion.g>

                {/* "PREDICTION" in smaller, widely spaced navy letters */}
                <motion.g
                  initial={{ opacity: 0, letterSpacing: '0.12em' }}
                  animate={{
                    opacity: [0, 0, 1, 1, 1],
                    letterSpacing: ['0.12em', '0.12em', '0.36em', '0.36em', '0.36em'],
                  }}
                  transition={{
                    duration: ANIMATION_DURATION,
                    times: [0, 0.38, 0.52, 0.85, 1],
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <text
                    x="0"
                    y="34"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontSize="15"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight="700"
                    className="tracking-[0.36em]"
                  >
                    PREDICTION
                  </text>
                </motion.g>

                {/* Underline Accents and Framing Crosshair Markers */}
                <motion.g
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{
                    opacity: [0, 0, 0.85, 0.85, 0.85],
                    scaleX: [0, 0, 1, 1, 1],
                  }}
                  transition={{
                    duration: ANIMATION_DURATION,
                    times: [0, 0.46, 0.58, 0.85, 1],
                    ease: 'easeOut',
                  }}
                >
                  {/* Left accent line & dot */}
                  <line x1="-240" y1="28" x2="-152" y2="28" stroke="#EA580C" strokeWidth="1.5" />
                  <circle cx="-148" cy="28" r="2" fill="#F97316" />

                  {/* Right accent line & dot */}
                  <circle cx="148" cy="28" r="2" fill="#F97316" />
                  <line x1="152" y1="28" x2="240" y2="28" stroke="#EA580C" strokeWidth="1.5" />

                  {/* Subtitle technical specs */}
                  <text
                    x="0"
                    y="60"
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="500"
                    letterSpacing="0.25em"
                  >
                    EXTERIOR BALLISTICS & TRAJECTORY COMPUTATION
                  </text>
                </motion.g>
              </g>

              {/* 7. Subtle Holographic Sheen Sweep across completed logo lockup */}
              <motion.g
                initial={{ x: -300, opacity: 0 }}
                animate={{
                  x: [-300, -300, 300, 300],
                  opacity: [0, 0, 0.6, 0],
                }}
                transition={{
                  duration: ANIMATION_DURATION,
                  times: [0, 0.62, 0.84, 1],
                  ease: 'easeInOut',
                }}
              >
                <line
                  x1="450"
                  y1="60"
                  x2="450"
                  y2="440"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="24"
                  filter="url(#blueGlow)"
                />
              </motion.g>
            </svg>

            {/* Bottom Progress Bar Indicator for the 4s Sequence */}
            <div className="w-48 sm:w-64 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden border border-slate-200/60">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: ANIMATION_DURATION, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
