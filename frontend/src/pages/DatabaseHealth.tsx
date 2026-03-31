import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadObject, type SceneObject } from "../components/js/loader";
import { Curve } from "../components/js/curve";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { Node } from "../components/js/node";
import { useNavigate } from "react-router-dom";
import { Terminal } from "../components/js/Terminal";
import { asciiTable } from "@/components/js/ascii";
// ─── Terminal panel (mobile + desktop) ──────────────────────────────
/**
 * ThreeScene
 * ----------
 * Main 3D visualization scene combining:
 * - Interactive globe with orbiting objects
 * - Server nodes with UI interactions
 * - Dynamic lighting and theming
 * - Overlay UI (server panel + terminal)
 *
 * Responsibilities:
 * - Initializes Three.js renderer, scene, camera, and controls
 * - Loads 3D assets (Earth and plane models)
 * - Renders orbital paths and animations
 * - Displays server metadata fetched from backend APIs
 * - Synchronizes visuals with dark/light theme
 *
 * Rendering:
 * - Animation loop updates orbit, nodes, and renders both layers
 *
 * Interaction:
 * - OrbitControls allow camera movement (zoom, pan, rotate)
 * - Node buttons trigger actions (e.g. fetch server info)
 * - Responsive layout adapts camera position for mobile
 *
 * State:
 * - `serverDetails` — selected server metadata for UI panel
 *
 * @returns React component rendering the 3D scene and UI overlays
 */
export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  const [serverDetails, setServerDetails] = useState<any>(null);
  const setServerDetailsRef = useRef(setServerDetails);
  setServerDetailsRef.current = setServerDetails;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const isDark = () => document.documentElement.classList.contains("dark");
    const isMobile = () => window.innerWidth < 640;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(isDark() ? 0x0a0f1e : 0x20a7db);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(25, 15, isMobile() ? 48 : 40);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.minDistance = 20;
    orbit.maxDistance = 80;
    orbit.update();

    const dLight = new THREE.DirectionalLight(0xffffff, isDark() ? 0.5 : 1);
    dLight.position.set(0, 10, 2);
    scene.add(dLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, isDark() ? 0.2 : 0.5);
    scene.add(ambientLight);

    // Starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(2000 * 3);

    for (let i = 0; i < 2000 * 3; i += 3) {
      const r = 80 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3),
    );

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: isDark() ? 1.0 : 0.15,
    });

    scene.add(new THREE.Points(starsGeometry, starsMaterial));

    // Atmospheric glow
    const glowMeshes: THREE.Mesh[] = [];

    const glowConfigs = [
      { radius: 10.8, lightOpacity: 0.08, darkOpacity: 0.15 },
      { radius: 11.5, lightOpacity: 0.05, darkOpacity: 0.08 },
      { radius: 12.5, lightOpacity: 0.03, darkOpacity: 0.04 },
    ];

    glowConfigs.forEach(({ radius, lightOpacity, darkOpacity }) => {
      const glowGeo = new THREE.SphereGeometry(radius, 64, 64);
      const glowMat = new THREE.MeshBasicMaterial({
        color: isDark() ? 0x1a4aff : 0xffdd44,
        transparent: true,
        opacity: isDark() ? darkOpacity : lightOpacity,
        side: THREE.BackSide,
      });
      const mesh = new THREE.Mesh(glowGeo, glowMat);
      glowMeshes.push(mesh);
      scene.add(mesh);
    });

    let earth: THREE.Object3D | null = null;
    let plane: THREE.Object3D | null = null;

    const earthObject: SceneObject = {
      fileName: "/public/earth.gltf",
      coords: new THREE.Vector3(10, 10, 10),
    };

    const planeObject: SceneObject = {
      fileName: "/public/plane.gltf",
      coords: new THREE.Vector3(0.5, 0.5, 0.5),
    };

    loadObject(earthObject, scene, (obj) => {
      earth = obj;
    });

    loadObject(planeObject, scene, (obj) => {
      plane = obj;
    });

    // Orbital path
    const orbitRadius = 15;
    const numPoints = 50;
    const orbitPoints: THREE.Vector3[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      const y = Math.sin(angle * 3) * 3;
      orbitPoints.push(new THREE.Vector3(x, y, z));
    }

    const orbitCurve = new Curve(orbitPoints, true);
    orbitCurve.draw(
      scene,
      isDark() ? 0x4488ff : 0xffffff,
      0,
      0.15,
      true,
      false,
    );

    // CSS2D label renderer
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.left = "0px";
    labelRenderer.domElement.style.width = "100%";
    labelRenderer.domElement.style.height = "100%";
    labelRenderer.domElement.style.pointerEvents = "none";
    mount.appendChild(labelRenderer.domElement);

    // Nodes
    let nodeLeft: Node | null = null;
    let nodeRight: Node | null = null;

    loadObject(earthObject, scene, (obj) => {
      earth = obj;

      nodeRight = new Node(scene, earth, {
        title: "North America",
        description: "Server: US-East-1",
        lat: 40,
        lon: -100,
        floatDistance: isMobile() ? 3 : 4,
        buttons: [
          {
            label: "Kill",
            onClick: () => console.log("Killing North America server..."),
          },
          {
            label: "Details",
            onClick: async () => {
              const url = "http://localhost:8080/api/server-info";
              try {
                const response = await fetch(url);
                if (!response.ok)
                  throw new Error(`Response status: ${response.status}`);
                const result = await response.json();
                setServerDetailsRef.current({
                  region: "North America",
                  ...result,
                });
              } catch (error: any) {
                setServerDetailsRef.current({
                  region: "North America",
                  error: error.message,
                });
              }
            },
          },
        ],
      });

      nodeLeft = new Node(scene, earth, {
        title: "North America",
        description: "Server: US-West-1",
        lat: 51,
        lon: 10,
        floatDistance: isMobile() ? 3 : 4,
        buttons: [
          {
            label: "Kill",
            onClick: () => console.log("Killing Europe server..."),
          },
          {
            label: "Details",
            onClick: async () => {
              const url = "http://localhost:8080/api/server-info";
              try {
                const response = await fetch(url);
                if (!response.ok)
                  throw new Error(`Response status: ${response.status}`);
                const result = await response.json();
                setServerDetailsRef.current({
                  region: "Europe",
                  ...result,
                });
              } catch (error: any) {
                setServerDetailsRef.current({
                  region: "Europe",
                  error: error.message,
                });
              }
            },
          },
        ],
      });
    });

    // Theme observer
    const observer = new MutationObserver(() => {
      const dark = isDark();
      renderer.setClearColor(dark ? 0x0a0f1e : 0x20a7db);
      dLight.intensity = dark ? 0.5 : 1;
      ambientLight.intensity = dark ? 0.2 : 0.5;
      starsMaterial.opacity = dark ? 1.0 : 0.15;
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Animation loop
    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.0005;

      if (plane) orbitCurve.lookAt(plane, time, 0.4);

      nodeLeft?.update(time);
      nodeRight?.update(time);

      labelRenderer.render(scene, camera);
      renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    const handleResize = () => {
      const mobile = isMobile();
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.position.set(25, 15, mobile ? 48 : 40);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
      orbit.update();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      orbit.dispose();
      renderer.dispose();
      mount.removeChild(labelRenderer.domElement);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* 3D scene */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Server details panel */}
      {serverDetails && (
        <div className="absolute right-4 top-4 z-50 w-80 rounded-2xl border border-slate-700 bg-slate-900/95 p-5 text-white shadow-2xl backdrop-blur sm:right-8 sm:top-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <h3 className="text-sm font-bold tracking-wide text-slate-100">
                {serverDetails.region ?? "Server"} Details
              </h3>
            </div>
            <button
              onClick={() => setServerDetails(null)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>

          {serverDetails.error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-950/40 p-3">
              <p className="text-xs font-medium text-red-400">
                Connection failed
              </p>
              <p className="mt-1 text-xs text-red-300/70">
                {serverDetails.error}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(serverDetails)
                .filter(([key]) => key !== "region")
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-xs font-medium text-slate-400">
                      {key}
                    </span>
                    <span className="max-w-[60%] break-all text-right text-xs text-slate-200">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Terminal */}
      <TerminalPanel />
    </div>
  );
}

// ─── Terminal constants ──────────────────────────────────────────────

/** Collapsed height of the mobile sheet (just the handle). */
const SHEET_MIN_H = 72;

/** Maximum height of the mobile sheet as a fraction of viewport height. */
const SHEET_MAX_FRAC = 0.75;

/** Snap-open threshold: if user drags past this fraction of the range, snap open. */
const SNAP_THRESHOLD = 0.35;

/** Fixed width of the desktop side panel in px. */
const DESKTOP_W = 380;

/** Fixed height of the desktop side panel in px. */
const DESKTOP_H = 420;

/**
 * TerminalPanel
 * -------------
 * Responsive wrapper for the {@link Terminal} component.
 *
 * @remarks
 * Provides:
 * - Mobile: draggable bottom sheet terminal
 * - Desktop: fixed-position side panel terminal
 *
 * Features:
 * - Touch drag gestures with snapping behavior
 * - Toggle via tap on handle
 * - Smooth height transitions
 * - Command integration with navigation and backend APIs
 *
 * Commands:
 * - `/kill`         — placeholder action
 * - `/game`         — navigates to game route
 * - `/leaderboard`  — fetches and displays high scores
 *
 * Leaderboard:
 * - Fetches from `/api/highscores/all`
 * - Formats output using {@link asciiTable}
 *
 * Layout:
 * - Mobile height constrained between {@link SHEET_MIN_H} and viewport fraction
 * - Desktop uses fixed width/height panel
 *
 * @returns Responsive terminal UI component
 */
function TerminalPanel() {
  const navigate = useNavigate();

  const terminalProps = {
    title: "dinehub-terminal",
    initialLines: ['Type a command. Try "/kill"'],
    commands: [
      {
        command: "/kill",
        description: "terminate all active nodes",
        onExecute: () => console.log("hello"),
      },
      {
        command: "/game",
        description: "play a game",
        onExecute: () => navigate("/game"),
      },
      
      {
        command: "/leaderboard",
        description: "show all player highscores",
        noHacker: true,
        onExecute: async () => {
          try {
            const res = await fetch("http://localhost:8080/api/highscores/all");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: { username: string; score: number }[] =
              await res.json();
            if (!data.length) return ["No scores recorded yet."];
            const ranked = data.map((d, i) => ({
              "#": i + 1,
              player: d.username,
              score: d.score,
            }));
            return asciiTable(ranked, ["#", "player", "score"]);
          } catch (e: any) {
            return [`Failed to fetch leaderboard: ${e.message}`];
          }
        },
      },
    ],
  };

  // ── Mobile drag state ───────────────────────────────────────────
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetH, setSheetH] = useState(SHEET_MIN_H);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const maxH = useCallback(() => window.innerHeight * SHEET_MAX_FRAC, []);

  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

  // ── Touch handlers (drag the handle) ────────────────────────────

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    startY.current = e.touches[0]?.clientY ?? 0;
    startH.current = sheetRef.current?.offsetHeight ?? SHEET_MIN_H;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dy = startY.current - touch.clientY; // positive = dragging up
      setSheetH(clamp(startH.current + dy, SHEET_MIN_H, maxH()));
    },
    [maxH],
  );

  const onTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    const current = sheetRef.current?.offsetHeight ?? SHEET_MIN_H;
    const range = maxH() - SHEET_MIN_H;

    // Snap to open or collapsed
    if (current - SHEET_MIN_H > range * SNAP_THRESHOLD) {
      setSheetH(maxH());
    } else {
      setSheetH(SHEET_MIN_H);
    }
  }, [maxH]);

  /** Tap the handle bar to toggle open/closed. */
  const onHandleTap = useCallback(() => {
    setSheetH((h) => (h > SHEET_MIN_H + 10 ? SHEET_MIN_H : maxH()));
  }, [maxH]);

  const isExpanded = sheetH > SHEET_MIN_H + 10;

  return (
    <>
      {/* ─── Mobile: draggable bottom sheet ─────────────────────── */}
      <div
        ref={sheetRef}
        style={{ height: sheetH }}
        className={[
          "fixed bottom-0 left-0 right-0 z-40",
          "flex flex-col",
          "rounded-t-2xl border-t border-slate-700/60",
          "bg-slate-950/95 shadow-[0_-4px_30px_rgba(0,0,0,0.45)] backdrop-blur-lg",
          "sm:hidden",
          // only animate when NOT actively dragging so the sheet feels instant
          dragging.current ? "" : "transition-[height] duration-200 ease-out",
        ].join(" ")}
      >
        {/* Drag handle */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={onHandleTap}
          className="flex flex-shrink-0 cursor-grab touch-none flex-col items-center gap-1.5 px-4 pb-2 pt-3 active:cursor-grabbing"
        >
          <div className="h-1 w-10 rounded-full bg-slate-500/80" />
          <span className="select-none text-[10px] font-medium uppercase tracking-widest text-slate-400">
            {isExpanded ? "drag down to hide" : "terminal"}
          </span>
        </div>

        {/* Terminal fills the remaining space */}
        <div className="min-h-0 flex-1 px-2 pb-2">
          <div className="h-full overflow-hidden">
            <Terminal {...terminalProps} />
          </div>
        </div>
      </div>

      {/* ─── Desktop: fixed side panel ──────────────────────────── */}
      <div
        style={{ width: DESKTOP_W, height: DESKTOP_H }}
        className={[
          "pointer-events-auto",
          "absolute bottom-6 right-6 z-40",
          "hidden sm:flex flex-col",
          "overflow-hidden rounded-2xl",
          "shadow-[0_8px_40px_rgba(0,0,0,0.5)]",
        ].join(" ")}
      >
        {/* Terminal body */}
        <div className="min-h-0 flex-1">
          <Terminal {...terminalProps} />
        </div>
      </div>
    </>
  );
}
