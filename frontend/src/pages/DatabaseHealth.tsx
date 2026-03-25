import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadObject, type SceneObject } from "../components/js/loader";
import { Curve } from "../components/js/curve";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { Node } from "../components/js/node";
import { useNavigate } from "react-router-dom";
import { Terminal } from "../components/js/Terminal";

/**
 * ThreeScene
 *
 * Main 3D visualization component for the application.
 *
 * Responsibilities:
 * - Initializes a Three.js scene with lighting and starfield
 * - Loads Earth and plane models
 * - Renders a curved orbital path
 * - Creates floating UI nodes attached to geographic coordinates
 * - Handles dark/light theme switching
 * - Runs the animation loop
 * - Displays an interactive terminal overlay
 *
 * This component uses WebGLRenderer for 3D rendering
 * and CSS2DRenderer for DOM-based labels attached to 3D objects.
 *
 * @example
 * ```tsx
 * <ThreeScene />
 * ```
 */
export default function ThreeScene() {
  /**
   * Reference to the DOM element where the WebGL canvas is mounted.
   */
  const mountRef = useRef<HTMLDivElement>(null);

  /**
   * React Router navigation hook used for UI buttons.
   */
  const navigate = useNavigate();

  /**
   * Initializes the 3D scene and rendering pipeline.
   *
   * Runs once when the component mounts.
   */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /**
     * Determines whether the application is currently in dark mode.
     */
    const isDark = () => document.documentElement.classList.contains("dark");

    /**
     * Returns whether the current viewport should be treated as mobile.
     */
    const isMobile = () => window.innerWidth < 640;

    /**
     * WebGL renderer responsible for drawing the 3D scene.
     */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(isDark() ? 0x0a0f1e : 0x20a7db);
    mount.appendChild(renderer.domElement);

    /**
     * Main 3D scene container.
     */
    const scene = new THREE.Scene();

    /**
     * Perspective camera used to view the scene.
     */
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    camera.position.set(25, 15, isMobile() ? 48 : 40);

    /**
     * Camera orbit controls allowing the user to rotate around the scene.
     */
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.minDistance = 20;
    orbit.maxDistance = 80;
    orbit.update();

    /**
     * Directional light simulating sunlight.
     */
    const dLight = new THREE.DirectionalLight(0xffffff, isDark() ? 0.5 : 1);
    dLight.position.set(0, 10, 2);
    scene.add(dLight);

    /**
     * Ambient light providing base illumination.
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark() ? 0.2 : 0.5);
    scene.add(ambientLight);

    /**
     * Starfield background using randomly distributed points.
     */
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

    /**
     * Atmospheric glow layers around the Earth.
     */
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

    /**
     * Earth model reference.
     */
    let earth: THREE.Object3D | null = null;

    /**
     * Plane model reference.
     */
    let plane: THREE.Object3D | null = null;

    /**
     * Configuration for the Earth model loader.
     */
    const earthObject: SceneObject = {
      fileName: "/public/earth.gltf",
      coords: new THREE.Vector3(10, 10, 10),
    };

    /**
     * Configuration for the plane model loader.
     */
    const planeObject: SceneObject = {
      fileName: "/public/plane.gltf",
      coords: new THREE.Vector3(0.5, 0.5, 0.5),
    };

    /**
     * Loads the Earth model into the scene.
     */
    loadObject(earthObject, scene, (obj) => {
      earth = obj;
    });

    /**
     * Loads the plane model into the scene.
     */
    loadObject(planeObject, scene, (obj) => {
      plane = obj;
    });

    /**
     * Defines an orbital path around the Earth.
     */
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

    /**
     * Renders the orbital path in the scene.
     */
    orbitCurve.draw(
      scene,
      isDark() ? 0x4488ff : 0xffffff,
      0,
      0.15,
      true,
      false,
    );

    /**
     * Renderer for HTML-based labels positioned in 3D space.
     */
    const labelRenderer = new CSS2DRenderer();

    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.left = "0px";
    labelRenderer.domElement.style.width = "100%";
    labelRenderer.domElement.style.height = "100%";
    labelRenderer.domElement.style.pointerEvents = "none";

    mount.appendChild(labelRenderer.domElement);

    /**
     * Floating nodes representing geographic server locations.
     */
    let nodeLeft: Node | null = null;
    let nodeRight: Node | null = null;

    /**
     * Attaches interactive nodes to the Earth model.
     */
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
            label: "Connect",
            onClick: () => console.log("Connecting to North America server..."),
          },
          {
            label: "Details",
            onClick: () => console.log("Show details for North America"),
          },
        ],
      });

      nodeLeft = new Node(scene, earth, {
        title: "Europe",
        description: "Server: US-West-1",
        lat: 51,
        lon: 10,
        floatDistance: isMobile() ? 3 : 4,
        buttons: [
          {
            label: "Connect",
            onClick: () => console.log("Connecting to Europe server..."),
          },
          {
            label: "Details",
            onClick: () => console.log("Show details for Europe"),
          },
        ],
      });
    });

    /**
     * Observes theme changes and updates scene lighting/colors.
     */
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

    /**
     * Main animation loop.
     */
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

    /**
     * Handles viewport resizing.
     */
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

    /**
     * Cleanup function executed when the component unmounts.
     */
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
      {/* Desktop-only dashboard shortcut */}
      <div className="absolute left-1/2 top-6 z-50 hidden -translate-x-1/2 sm:block">
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-full bg-indigo-600 px-6 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98]"
        >
          Dashboard
        </button>
      </div>

      {/* 3D scene */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Terminal sheet */}
      <MobileTerminalSheet />
    </div>
  );
}

/**
 * Mobile and desktop terminal wrapper.
 *
 * On mobile, the terminal behaves like a draggable bottom sheet.
 * On desktop, the terminal remains as a floating panel.
 *
 * @returns Responsive terminal overlay.
 */
function MobileTerminalSheet() {
  const [mobileHeightVh, setMobileHeightVh] = useState(18);
  const [dragging, setDragging] = useState(false);

  const startYRef = useRef<number | null>(null);
  const startHeightRef = useRef<number>(18);

  const COLLAPSED = 18;
  const MID = 42;
  const EXPANDED = 72;

  const terminalProps = {
    title: "dinehub-terminal",
    initialLines: ['Type a command. Try "/kill"'],
    commands: [
      {
        command: "/kill",
        description: "terminate all active nodes",
        onExecute: () => {
          console.log("hello");
        },
      },
    ],
  };

  const clampHeight = (value: number) =>
    Math.max(COLLAPSED, Math.min(EXPANDED, value));

  const snapHeight = (value: number) => {
    const snapPoints = [COLLAPSED, MID, EXPANDED];
    return snapPoints.reduce((closest, point) =>
      Math.abs(point - value) < Math.abs(closest - value) ? point : closest,
    );
  };

  const beginDrag = (clientY: number) => {
    startYRef.current = clientY;
    startHeightRef.current = mobileHeightVh;
    setDragging(true);
  };

  const updateDrag = (clientY: number) => {
    if (startYRef.current === null) return;

    const deltaY = startYRef.current - clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    setMobileHeightVh(clampHeight(startHeightRef.current + deltaVh));
  };

  const endDrag = () => {
    setDragging(false);
    startYRef.current = null;
    setMobileHeightVh((prev) => snapHeight(prev));
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => updateDrag(e.clientY);
    const onMouseUp = () => endDrag();
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      updateDrag(touch.clientY);
    };
    const onTouchEnd = () => endDrag();

    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragging]);

  return (
    <>
      {/* Mobile draggable bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-slate-950/82 shadow-2xl backdrop-blur transition-[height] duration-200 sm:hidden"
        style={{ height: `${mobileHeightVh}vh` }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="Drag terminal"
          onMouseDown={(e) => beginDrag(e.clientY)}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (!touch) return;
            beginDrag(touch.clientY);
          }}
          onDoubleClick={() =>
            setMobileHeightVh((prev) => (prev < MID ? EXPANDED : COLLAPSED))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setMobileHeightVh((prev) => (prev < MID ? EXPANDED : COLLAPSED));
            }
          }}
          className="flex w-full cursor-row-resize flex-col items-center gap-2 px-4 pb-2 pt-3"
        >
          <div className="h-1.5 w-14 rounded-full bg-slate-500" />
          <span className="text-xs text-slate-300">
            Swipe or drag terminal
          </span>
        </div>

        <div className="h-[calc(100%-44px)] overflow-hidden px-2 pb-2">
          <div className="h-full overflow-hidden rounded-2xl">
            <Terminal {...terminalProps} />
          </div>
        </div>
      </div>

      {/* Desktop terminal */}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-40 hidden w-[min(92%,900px)] -translate-x-1/2 sm:block">
        <div className="overflow-hidden rounded-2xl shadow-2xl">
          <Terminal {...terminalProps} />
        </div>
      </div>
    </>
  );
}