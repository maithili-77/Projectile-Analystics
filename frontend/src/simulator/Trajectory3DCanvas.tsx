import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
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
  runTrigger?: number;
}

export const Trajectory3DCanvas: React.FC<Props> = ({
  points,
  maxRange,
  maxHeight,
  velocity = 600,
  angleDeg = 45,
  gravity = 9.81,
  predictedRange,
  predictedHeight,
  runTrigger = 0
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Compute clean user-driven trajectory points matching input parameters
  const effectivePoints = useMemo(() => {
    const v0 = Math.max(1, Number(velocity));
    const safeAngle = Math.max(0.5, Math.min(89.5, Number(angleDeg)));
    const rad = (safeAngle * Math.PI) / 180;
    const g = Number(gravity) > 0 ? Number(gravity) : 9.81;

    const theoRange = (v0 * v0 * Math.sin(2 * rad)) / g;
    const theoHeight = (v0 * v0 * Math.sin(rad) * Math.sin(rad)) / (2 * g);
    const totalFlightTime = (2 * v0 * Math.sin(rad)) / g;

    const targetRange = (predictedRange && predictedRange > 0) ? predictedRange : theoRange;
    const targetHeight = (predictedHeight && predictedHeight > 0) ? predictedHeight : theoHeight;

    const scaleX = targetRange / Math.max(0.1, theoRange);
    const scaleY = targetHeight / Math.max(0.1, theoHeight);

    const numPoints = 120;
    const pts: TrajectoryPoint[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const frac = i / numPoints;
      const t = frac * totalFlightTime;
      const x = v0 * Math.cos(rad) * t * scaleX;
      const y = Math.max(0, (v0 * Math.sin(rad) * t - 0.5 * g * t * t) * scaleY);
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
  }, [points, velocity, angleDeg, gravity, predictedRange, predictedHeight]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || effectivePoints.length === 0) return;

    const width = container.clientWidth || 600;
    const height = 360;

    // 1. Scene, Camera, Renderer (Theme-harmonized slate-navy, not pitch black)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121e30);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200000);

    const effectiveSpan = Math.max(
      predictedRange || 1000,
      predictedHeight ? predictedHeight * 2 : 1000,
      maxRange || 1000
    );

    // Position camera to frame the complete trajectory
    camera.position.set(effectiveSpan * 0.55, effectiveSpan * 0.45, effectiveSpan * 1.05);
    camera.lookAt(effectiveSpan * 0.5, effectiveSpan * 0.22, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(effectiveSpan * 0.5, effectiveSpan * 1.0, effectiveSpan * 0.8);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf59e0b, 1.4, effectiveSpan * 1.5);
    pointLight.position.set(0, effectiveSpan * 0.2, 0);
    scene.add(pointLight);

    // 3. Ground Grid Helper
    const gridHelper = new THREE.GridHelper(effectiveSpan * 2.2, 28, 0x0284c7, 0x334155);
    gridHelper.position.set(effectiveSpan * 0.5, 0, 0);
    scene.add(gridHelper);

    // 4. Create 3D Artillery Gun at Origin (0,0,0)
    const gunGroup = new THREE.Group();
    const gunBaseGeo = new THREE.CylinderGeometry(effectiveSpan * 0.035, effectiveSpan * 0.045, effectiveSpan * 0.02, 16);
    const gunBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const gunBase = new THREE.Mesh(gunBaseGeo, gunBaseMat);
    gunBase.position.y = effectiveSpan * 0.01;
    gunGroup.add(gunBase);

    // Mount trunnion
    const trunnionGeo = new THREE.BoxGeometry(effectiveSpan * 0.02, effectiveSpan * 0.03, effectiveSpan * 0.03);
    const trunnionMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const trunnion = new THREE.Mesh(trunnionGeo, trunnionMat);
    trunnion.position.y = effectiveSpan * 0.025;
    gunGroup.add(trunnion);

    // Barrel
    const barrelLength = effectiveSpan * 0.1;
    const barrelGeo = new THREE.CylinderGeometry(effectiveSpan * 0.007, effectiveSpan * 0.01, barrelLength, 16);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);

    const rad = (angleDeg * Math.PI) / 180;
    barrel.position.set(0, barrelLength / 2, 0);

    const barrelPivot = new THREE.Group();
    barrelPivot.position.set(0, effectiveSpan * 0.025, 0);
    barrelPivot.add(barrel);
    barrelPivot.rotation.z = -Math.PI / 2 + rad;
    gunGroup.add(barrelPivot);

    scene.add(gunGroup);

    // 5. Create 3D Target Stand at Landing Distance
    const lastPt = effectivePoints[effectivePoints.length - 1];
    const targetDist = predictedRange || (lastPt ? lastPt.x : effectiveSpan);
    const targetGroup = new THREE.Group();
    targetGroup.position.set(targetDist, 0, 0);

    // Legs
    const legGeo = new THREE.CylinderGeometry(effectiveSpan * 0.004, effectiveSpan * 0.004, effectiveSpan * 0.08, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(0, effectiveSpan * 0.04, -effectiveSpan * 0.02);
    leg1.rotation.x = 0.2;
    targetGroup.add(leg1);

    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(0, effectiveSpan * 0.04, effectiveSpan * 0.02);
    leg2.rotation.x = -0.2;
    targetGroup.add(leg2);

    // Target Disc
    const targetDiscGeo = new THREE.CylinderGeometry(effectiveSpan * 0.028, effectiveSpan * 0.028, effectiveSpan * 0.004, 24);
    const targetDiscMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
    const targetDisc = new THREE.Mesh(targetDiscGeo, targetDiscMat);
    targetDisc.position.set(0, effectiveSpan * 0.075, 0);
    targetDisc.rotation.z = Math.PI / 2;
    targetGroup.add(targetDisc);

    // Bullseye
    const bullseyeGeo = new THREE.CylinderGeometry(effectiveSpan * 0.012, effectiveSpan * 0.012, effectiveSpan * 0.005, 24);
    const bullseyeMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const bullseye = new THREE.Mesh(bullseyeGeo, bullseyeMat);
    bullseye.position.set(0, effectiveSpan * 0.075, 0);
    bullseye.rotation.z = Math.PI / 2;
    targetGroup.add(bullseye);

    scene.add(targetGroup);

    // 6. Create 3D Curve from points
    const curveVectors = effectivePoints.map(pt => new THREE.Vector3(pt.x, pt.y, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(curveVectors);
    const material = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 3 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    // 7. Add Apex Marker Sphere
    const apexPt = [...effectivePoints].sort((a, b) => b.y - a.y)[0];
    if (apexPt) {
      const sphereGeo = new THREE.SphereGeometry(effectiveSpan * 0.012, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.6 });
      const apexMesh = new THREE.Mesh(sphereGeo, sphereMat);
      apexMesh.position.set(apexPt.x, apexPt.y, 0);
      scene.add(apexMesh);
    }

    // 8. Add Highly Visible Animated Flying Projectile Mesh & Tracer
    const bulletGroup = new THREE.Group();

    // Metallic spitzer bullet body
    const bulletBodyGeo = new THREE.CylinderGeometry(effectiveSpan * 0.012, effectiveSpan * 0.012, effectiveSpan * 0.035, 16);
    const bulletBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.25
    });
    const bulletBody = new THREE.Mesh(bulletBodyGeo, bulletBodyMat);
    bulletBody.position.y = -effectiveSpan * 0.01;
    bulletGroup.add(bulletBody);

    // Aerodynamic pointed nose cone
    const bulletNoseGeo = new THREE.ConeGeometry(effectiveSpan * 0.012, effectiveSpan * 0.03, 16);
    const bulletNoseMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.9,
      roughness: 0.2
    });
    const bulletNose = new THREE.Mesh(bulletNoseGeo, bulletNoseMat);
    bulletNose.position.y = effectiveSpan * 0.022;
    bulletGroup.add(bulletNose);

    // Glowing Incandescent Tracer Tail Sphere
    const tracerTailGeo = new THREE.SphereGeometry(effectiveSpan * 0.014, 16, 16);
    const tracerTailMat = new THREE.MeshBasicMaterial({
      color: 0xff8a24
    });
    const tracerTail = new THREE.Mesh(tracerTailGeo, tracerTailMat);
    tracerTail.position.y = -effectiveSpan * 0.028;
    bulletGroup.add(tracerTail);

    scene.add(bulletGroup);

    const tracerLight = new THREE.PointLight(0xf59e0b, 3.5, effectiveSpan * 0.4);
    scene.add(tracerLight);

    // Animation Loop
    let animId: number;
    let angle = 0;
    let projProgress = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Camera gentle orbit
      angle += 0.002;
      const radius = effectiveSpan * 1.35;
      camera.position.x = effectiveSpan * 0.5 + Math.sin(angle) * radius * 0.45;
      camera.position.z = Math.cos(angle) * radius * 0.75;
      camera.lookAt(effectiveSpan * 0.5, effectiveSpan * 0.22, 0);

      // Animate projectile along trajectory only when runTrigger > 0
      if (runTrigger > 0) {
        projProgress = Math.min(1.0, projProgress + 0.0045);
      } else {
        projProgress = 0;
      }
      const ptIdx = Math.floor(projProgress * (effectivePoints.length - 1));
      const currPt = effectivePoints[ptIdx] || effectivePoints[0];
      const nextPt = effectivePoints[Math.min(effectivePoints.length - 1, ptIdx + 1)] || currPt;

      bulletGroup.position.set(currPt.x, currPt.y, 0);
      tracerLight.position.set(currPt.x, currPt.y, 0);

      const dx = nextPt.x - currPt.x;
      const dy = nextPt.y - currPt.y;
      bulletGroup.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container) container.innerHTML = '';
      renderer.dispose();
    };
  }, [effectivePoints, maxRange, maxHeight, angleDeg, predictedRange, predictedHeight, runTrigger]);

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-700/60 shadow-lg space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Three.js 3D Orbital Firing Range View</span>
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
          Elevation: {angleDeg.toFixed(1)}°
        </span>
      </div>
      <div ref={mountRef} className="w-full h-[360px] rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900 shadow-inner" />
    </div>
  );
};
