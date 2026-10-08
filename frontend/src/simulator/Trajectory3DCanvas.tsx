import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TrajectoryPoint } from '../types';

interface Props {
  points: TrajectoryPoint[];
  maxRange: number;
  maxHeight: number;
}

export const Trajectory3DCanvas: React.FC<Props> = ({ points, maxRange, maxHeight }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || points.length === 0) return;

    const width = container.clientWidth || 600;
    const height = 360;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x22d3ee, 1.2);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);

    // 3. Ground Grid Helper
    const gridHelper = new THREE.GridHelper(span * 2, 20, 0x334155, 0x1e293b);
    gridHelper.position.set(span * 0.5, 0, 0);
    scene.add(gridHelper);

    // 4. Create 3D Curve from points
    const curveVectors = points.map(pt => new THREE.Vector3(pt.x, pt.y, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(curveVectors);

    const material = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 3 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    // 5. Add Apex Marker Sphere
    const apexPt = [...points].sort((a, b) => b.y - a.y)[0];
    if (apexPt) {
      const sphereGeo = new THREE.SphereGeometry(span * 0.02, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const apexMesh = new THREE.Mesh(sphereGeo, sphereMat);
      apexMesh.position.set(apexPt.x, apexPt.y, 0);
      scene.add(apexMesh);
    }

    // 6. Add Projectile End Marker Sphere
    const lastPt = points[points.length - 1];
    if (lastPt) {
      const sphereGeo2 = new THREE.SphereGeometry(span * 0.025, 16, 16);
      const sphereMat2 = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
      const lastMesh = new THREE.Mesh(sphereGeo2, sphereMat2);
      lastMesh.position.set(lastPt.x, lastPt.y, 0);
      scene.add(lastMesh);
    }

    // Gentle slow rotation around scene for dynamic view
    let animId: number;
    let angle = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      angle += 0.003;
      const radius = span * 1.3;
      camera.position.x = span * 0.4 + Math.sin(angle) * radius * 0.5;
      camera.position.z = Math.cos(angle) * radius * 0.8;
      camera.lookAt(span * 0.4, span * 0.2, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container) container.innerHTML = '';
      renderer.dispose();
    };
  }, [points, maxRange, maxHeight]);

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800">
      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
        Three.js 3D Orbital Scene View
      </h3>
      <div ref={mountRef} className="w-full h-[360px] rounded-lg overflow-hidden border border-slate-900 bg-slate-950" />
    </div>
  );
};
