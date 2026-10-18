import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TrajectoryPoint } from '../types';

interface Props {
  points: TrajectoryPoint[];
  maxRange: number;
  maxHeight: number;
  angleDeg?: number;
  predictedRange?: number;
}

export const Trajectory3DCanvas: React.FC<Props> = ({
  points,
  maxRange,
  maxHeight,
  angleDeg = 45,
  predictedRange
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || points.length === 0) return;

    const width = container.clientWidth || 600;
    const height = 360;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    
    // Position camera based on trajectory dimensions
    const span = Math.max(maxRange, maxHeight, 50);
    camera.position.set(span * 0.6, span * 0.5, span * 1.2);
    camera.lookAt(span * 0.4, span * 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(span * 0.5, span * 1.0, span * 0.8);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf59e0b, 1.2, span * 1.5);
    pointLight.position.set(0, span * 0.2, 0);
    scene.add(pointLight);

    // 3. Ground Grid Helper
    const gridHelper = new THREE.GridHelper(span * 2.2, 24, 0x0284c7, 0x1e293b);
    gridHelper.position.set(span * 0.5, 0, 0);
    scene.add(gridHelper);

    // 4. Create 3D Artillery / Gun at Origin (0,0,0)
    const gunGroup = new THREE.Group();
    const gunBaseGeo = new THREE.CylinderGeometry(span * 0.04, span * 0.05, span * 0.02, 16);
    const gunBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const gunBase = new THREE.Mesh(gunBaseGeo, gunBaseMat);
    gunBase.position.y = span * 0.01;
    gunGroup.add(gunBase);

    // Mount trunnion
    const trunnionGeo = new THREE.BoxGeometry(span * 0.025, span * 0.035, span * 0.035);
    const trunnionMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const trunnion = new THREE.Mesh(trunnionGeo, trunnionMat);
    trunnion.position.y = span * 0.03;
    gunGroup.add(trunnion);

    // Cannon Barrel tilted by angleDeg
    const barrelLength = span * 0.12;
    const barrelGeo = new THREE.CylinderGeometry(span * 0.008, span * 0.012, barrelLength, 16);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.1 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);

    // Pivot and rotate barrel
    const rad = (angleDeg * Math.PI) / 180;
    barrel.position.set(0, barrelLength / 2, 0);

    const barrelPivot = new THREE.Group();
    barrelPivot.position.set(0, span * 0.03, 0);
    barrelPivot.add(barrel);
    // Rotate barrel in XY plane (Z rotation in Three.js where +X is forward, +Y is up)
    barrelPivot.rotation.z = -Math.PI / 2 + rad;
    gunGroup.add(barrelPivot);

    scene.add(gunGroup);

    // 5. Create 3D Target Stand at Landing Distance
    const lastPt = points[points.length - 1];
    const targetDist = predictedRange || (lastPt ? lastPt.x : span);
    const targetGroup = new THREE.Group();
    targetGroup.position.set(targetDist, 0, 0);

    // Target legs
    const legGeo = new THREE.CylinderGeometry(span * 0.005, span * 0.005, span * 0.1, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(0, span * 0.05, -span * 0.025);
    leg1.rotation.x = 0.2;
    targetGroup.add(leg1);

    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(0, span * 0.05, span * 0.025);
    leg2.rotation.x = -0.2;
    targetGroup.add(leg2);

    // Target board disc
    const targetDiscGeo = new THREE.CylinderGeometry(span * 0.035, span * 0.035, span * 0.005, 24);
    const targetDiscMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
    const targetDisc = new THREE.Mesh(targetDiscGeo, targetDiscMat);
    targetDisc.position.set(0, span * 0.09, 0);
    targetDisc.rotation.z = Math.PI / 2;
    targetGroup.add(targetDisc);

    // Red bullseye
    const bullseyeGeo = new THREE.CylinderGeometry(span * 0.015, span * 0.015, span * 0.006, 24);
    const bullseyeMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const bullseye = new THREE.Mesh(bullseyeGeo, bullseyeMat);
    bullseye.position.set(0, span * 0.09, 0);
    bullseye.rotation.z = Math.PI / 2;
    targetGroup.add(bullseye);

    scene.add(targetGroup);

    // 6. Create 3D Curve from points
    const curveVectors = points.map(pt => new THREE.Vector3(pt.x, pt.y, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(curveVectors);
    const material = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 3 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    // 7. Add Apex Marker Sphere
    const apexPt = [...points].sort((a, b) => b.y - a.y)[0];
    if (apexPt) {
      const sphereGeo = new THREE.SphereGeometry(span * 0.015, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 });
      const apexMesh = new THREE.Mesh(sphereGeo, sphereMat);
      apexMesh.position.set(apexPt.x, apexPt.y, 0);
      scene.add(apexMesh);
    }

    // 8. Add Animated Flying Projectile Mesh
    const bulletGeo = new THREE.ConeGeometry(span * 0.01, span * 0.03, 16);
    const bulletMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
    bulletMesh.rotation.z = -Math.PI / 2;
    scene.add(bulletMesh);

    // Tracer flare light on projectile
    const tracerLight = new THREE.PointLight(0xf59e0b, 1.5, span * 0.3);
    scene.add(tracerLight);

    // Animation loop
    let animId: number;
    let angle = 0;
    let projProgress = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Camera gentle orbit
      angle += 0.0025;
      const radius = span * 1.35;
      camera.position.x = span * 0.45 + Math.sin(angle) * radius * 0.5;
      camera.position.z = Math.cos(angle) * radius * 0.8;
      camera.lookAt(span * 0.45, span * 0.2, 0);

      // Animate projectile along trajectory
      projProgress = (projProgress + 0.004) % 1.0;
      const ptIdx = Math.floor(projProgress * (points.length - 1));
      const currPt = points[ptIdx] || points[0];
      const nextPt = points[Math.min(points.length - 1, ptIdx + 1)] || currPt;

      bulletMesh.position.set(currPt.x, currPt.y, 0);
      tracerLight.position.set(currPt.x, currPt.y, 0);

      // Orient projectile towards next point
      const dx = nextPt.x - currPt.x;
      const dy = nextPt.y - currPt.y;
      bulletMesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container) container.innerHTML = '';
      renderer.dispose();
    };
  }, [points, maxRange, maxHeight, angleDeg, predictedRange]);

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>Three.js 3D Orbital Firing Range View</span>
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
          Gun Angle: {angleDeg.toFixed(1)}°
        </span>
      </div>
      <div ref={mountRef} className="w-full h-[360px] rounded-lg overflow-hidden border border-slate-900 bg-slate-950 shadow-inner" />
    </div>
  );
};
