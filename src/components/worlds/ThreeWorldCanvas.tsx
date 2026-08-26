import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ForestSceneBuilder, InteractiveFlora } from './forest3DBuilder';
import { FOREST_TIERS, calculateForestVitality, PlantedTreeRecord } from './forestData';

interface ThreeWorldCanvasProps {
  learnedCount: number;
  streakDays: number;
  daysSinceLastStudy?: number;
  vitalityOverride?: number;
  isMini?: boolean;
  onSelectFlora?: (flora: InteractiveFlora) => void;
  selectedFloraId?: string | null;
  targetFocusFloraId?: string | null;
  plantedTrees?: PlantedTreeRecord[];
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
}

export const ThreeWorldCanvas: React.FC<ThreeWorldCanvasProps> = ({
  learnedCount,
  streakDays,
  daysSinceLastStudy = 0,
  vitalityOverride,
  isMini = false,
  onSelectFlora,
  selectedFloraId,
  targetFocusFloraId,
  plantedTrees = [],
  timeframe = 'all',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const reqIdRef = useRef<number | null>(null);

  const [isNight, setIsNight] = useState(false);
  const [autoRotate, setAutoRotate] = useState(isMini);
  const [floraList, setFloraList] = useState<InteractiveFlora[]>([]);

  // Camera target interpolation state
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  // Active Forest Tier
  const currentTier =
    FOREST_TIERS.slice().reverse().find((t) => learnedCount >= t.minWords) || FOREST_TIERS[0];
  const nextTier = FOREST_TIERS.find((t) => learnedCount < t.minWords);
  const wordsToNext = nextTier ? nextTier.minWords - learnedCount : 0;
  const vitality = calculateForestVitality(daysSinceLastStudy);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    // 1. Three.js Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Atmospheric Fog
    const fogColor = isNight ? 0x090d16 : 0x0f172a;
    scene.fog = new THREE.FogExp2(fogColor, 0.015);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 250);
    camera.position.set(0, 24, 32);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig
    if (isNight) {
      const ambientNight = new THREE.AmbientLight(0x38bdf8, 0.65);
      scene.add(ambientNight);

      const moonLight = new THREE.DirectionalLight(0x818cf8, 1.2);
      moonLight.position.set(20, 35, 15);
      moonLight.castShadow = true;
      scene.add(moonLight);
    } else {
      // Warm Sunlight & Skylight
      const ambientDay = new THREE.AmbientLight(0xfffbeb, 0.85);
      scene.add(ambientDay);

      const sunLight = new THREE.DirectionalLight(0xfef08a, 1.4);
      sunLight.position.set(25, 40, 20);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      scene.add(sunLight);

      // Soft Blue Sky fill from opposite side
      const skyFill = new THREE.DirectionalLight(0x67e8f9, 0.4);
      skyFill.position.set(-20, 20, -20);
      scene.add(skyFill);
    }

    // 5. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.minDistance = 8;
    controls.maxDistance = 65;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.target.set(0, 1.8, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = isMini ? 1.1 : 0.6;
    controlsRef.current = controls;

    // 6. Build the 3D Forest with Planted Trees
    const forestBuilder = new ForestSceneBuilder(scene, {
      learnedCount,
      streakDays,
      daysSinceLastStudy,
      vitalityOverride,
      isNight,
      plantedTrees,
      timeframe: timeframe as 'day' | 'week' | 'month' | 'year' | 'all',
    });
    const buildResult = forestBuilder.build();
    setFloraList(buildResult.interactiveList);

    // 7. Click / Raycast Inspection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      if (!renderer.domElement || !cameraRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        let closestFlora: InteractiveFlora | null = null;
        let minDist = 4.5;

        buildResult.interactiveList.forEach((flora) => {
          const d = flora.position.distanceTo(hitPoint);
          if (d < minDist) {
            minDist = d;
            closestFlora = flora;
          }
        });

        if (closestFlora && onSelectFlora) {
          flyToFlora(closestFlora);
          onSelectFlora(closestFlora);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // 8. Render & Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation
      if (targetCamPosRef.current && targetLookAtRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.06);
        controlsRef.current.target.lerp(targetLookAtRef.current, 0.06);
        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 0.1) {
          targetCamPosRef.current = null;
          targetLookAtRef.current = null;
        }
      }

      forestBuilder.update(elapsedTime);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !rendererRef.current || !cameraRef.current) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0) {
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('click', handleClick);
      }
      renderer.dispose();
    };
  }, [learnedCount, streakDays, daysSinceLastStudy, vitalityOverride, isNight, plantedTrees, timeframe]);

  // Update auto rotate when state changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  const flyToFlora = (flora: InteractiveFlora) => {
    targetLookAtRef.current = new THREE.Vector3(flora.position.x, flora.position.y - 0.5, flora.position.z);
    targetCamPosRef.current = new THREE.Vector3(
      flora.position.x + 3.5,
      flora.position.y + 4.0,
      flora.position.z + 7.5
    );
  };

  const handleZoomIn = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(0.82);
    controlsRef.current.update();
  };

  const handleZoomOut = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(1.18);
    controlsRef.current.update();
  };

  const handleResetCamera = () => {
    targetLookAtRef.current = new THREE.Vector3(0, 1.8, 0);
    targetCamPosRef.current = new THREE.Vector3(0, 24, 32);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden group">
      {/* Three.js Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Badge watermark */}
      {!isMini && (
        <div className="absolute top-3 left-3 bg-[#0F172A]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-[11.5px] font-semibold flex items-center gap-2 pointer-events-none shadow-xl z-20">
          <i className="fa-solid fa-tree text-emerald-400"></i>
          <span>El Bosque de Vocabulario • Lebendige 3D-Wiese</span>
        </div>
      )}

      {/* Next Step Micro-Tracker HUD */}
      {!isMini && nextTier && (
        <div className="absolute top-12 left-3 bg-[#0F172A]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#F59E0B]/30 text-white text-[11px] flex items-center gap-2 shadow-xl z-20 pointer-events-none">
          <i className="fa-solid fa-seedling text-[#F59E0B]"></i>
          <span>
            Nächste Baumart: <strong className="text-[#F59E0B]">{nextTier.nameEs}</strong> in{' '}
            <strong className="text-white">{wordsToNext} Vokabeln</strong>
          </span>
        </div>
      )}

      {/* On-screen 3D Controls HUD */}
      {!isMini && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            title="Heranzoomen"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-[#0F172A]/85 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i>
          </button>

          <button
            type="button"
            title="Herauszoomen"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-[#0F172A]/85 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-minus"></i>
          </button>

          <button
            type="button"
            title="Kamera-Übersicht"
            onClick={handleResetCamera}
            className="w-8 h-8 rounded-xl bg-[#0F172A]/85 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-arrows-rotate"></i>
          </button>

          <button
            type="button"
            title={isNight ? 'Tag-Modus' : 'Nacht-Modus (Glühwürmchen)'}
            onClick={() => setIsNight(!isNight)}
            className="w-8 h-8 rounded-xl bg-[#0F172A]/85 backdrop-blur-md border border-white/10 text-amber-300 hover:bg-white/20 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i className={`fa-solid ${isNight ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          <button
            type="button"
            title="Auto-Rotation an/aus"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`w-8 h-8 rounded-xl bg-[#0F172A]/85 backdrop-blur-md border border-white/10 flex items-center justify-center text-xs transition-colors cursor-pointer ${
              autoRotate ? 'text-[#38BDF8] border-[#38BDF8]/40' : 'text-white/60'
            }`}
          >
            <i className="fa-solid fa-rotate"></i>
          </button>
        </div>
      )}

      {/* Mini Quick Flora Jump Bar at bottom */}
      {!isMini && floraList.length > 0 && (
        <div className="absolute bottom-3 inset-x-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none z-20">
          {floraList.map((flora) => {
            const isSelected = selectedFloraId === flora.id;
            return (
              <button
                key={flora.id}
                type="button"
                onClick={() => {
                  flyToFlora(flora);
                  if (onSelectFlora) onSelectFlora(flora);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500 text-white border-white/30 shadow-lg scale-105'
                    : 'bg-[#0F172A]/85 text-white/90 border-white/10 hover:bg-[#1E293B]'
                }`}
              >
                <i
                  className={`fa-solid ${
                    flora.type === 'tree'
                      ? 'fa-tree text-emerald-400'
                      : flora.type === 'flower'
                      ? 'fa-spa text-pink-400'
                      : flora.type === 'pond'
                      ? 'fa-water text-sky-400'
                      : flora.type === 'withered'
                      ? 'fa-skull-crossbones text-amber-500'
                      : 'fa-seedling text-amber-400'
                  } text-[10px]`}
                ></i>
                <span>{flora.nameEs.split(' ')[0]}</span>
                {flora.sessionMeta && <span className="text-[9.5px] opacity-60">({flora.sessionMeta.durationMin}m)</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
