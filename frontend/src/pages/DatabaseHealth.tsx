import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadObject, type SceneObject } from "../components/js/loader";
import { Curve } from "../components/js/curve";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { Node } from "../components/js/node";
import { useNavigate } from "react-router-dom";
import { Terminal } from "../components/js/Terminal";
import { StarField } from "../components/js/starfield";

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
     * Full starfield with blinking background stars and animated shooting-star
     * trails, driven by {@link StarField}. Replaces the previous static
     * {@code THREE.Points} implementation. Visibility follows dark mode.
     */
    const starField = new StarField(scene, {
      count: 2000,
      minRadius: 80,
      maxRadius: 230,
      darkMode: isDark(),
      maxActiveShots: 3,
      shootingCurveMinRadius: 250,
      shootingCurveMaxRadius: 300,
      trailTubeRadius: 0.5,
      usePoints: true,
    });

    /**
     * Three concentric back-face spheres that produce a soft atmospheric glow
     * around the Earth — larger radius = wider, more transparent halo.
     */
    const glowMeshes: THREE.Mesh[] = [];

    const glowConfigs = [
      { radius: 10.8, lightOpacity: 0.08, darkOpacity: 0.15 },
      { radius: 11.5, lightOpacity: 0.05, darkOpacity: 0.08 },
      { radius: 12.5, lightOpacity: 0.03, darkOpacity: 0.04 },
    ];

    glowConfigs.forEach(({ radius, lightOpacity, darkOpacity }) => {
      const glowGeo = new THREE.SphereGeometry(radius, 16, 16);

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
      /** Triple-frequency sine gives the orbit a gentle vertical wave. */
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
      /**
       * Re-evaluate starfield visibility whenever the theme changes.
       */
      starField.setDarkMode(dark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    /**
     * Main animation loop.
     */
    let animationId: number;

    /**
     * Timestamp (ms) of the previous animation frame, used to compute a
     * frame-accurate delta for {@link StarField#update}.
     */
    let lastFrameTime = performance.now();

    function animate() {
      animationId = requestAnimationFrame(animate);

      const now = performance.now();

      /**
       * Elapsed seconds since the last frame, clamped to 100 ms to prevent
       * large jumps after the tab regains focus.
       */
      const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;

      /** Advance starfield blinking and shooting-star animations. */
      starField.update(delta);

      const time = Date.now() * 0.0005;

      if (plane) orbitCurve.lookAt(plane, time, 0.4);

      nodeLeft?.update(time);
      nodeRight?.update(time);

      /**
       * Required every frame when {@code enableDamping} is true so that
       * inertia is applied correctly after the user releases the mouse.
       */
      orbit.update();

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

      /**
       * Release all Three.js geometries, materials, and sprites owned by the
       * starfield so they don't leak across hot-reloads or route changes.
       */
      starField.dispose();

      renderer.dispose();

      mount.removeChild(labelRenderer.domElement);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Desktop-only dashboard shortcut */}
      <div className="absolute left-1/2 top-6 z-50 hidden -translate-x-1/2 sm:block"></div>

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
  /** Controls whether the terminal sheet is expanded or collapsed. */
  const [expanded, setExpanded] = useState(false);

  /** Shared props passed to both the mobile and desktop Terminal instances. */
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
      {
        command: "/docs",
        description: "open docs page",
        noHacker: true,
        onExecute: () => {
          window.location.assign("/docs");
        },
      },
    ],
  };

  return (
    <>
      {/* Mobile terminal */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-slate-950/90 shadow-2xl backdrop-blur transition-all duration-300 sm:hidden ${
          expanded ? "h-[62vh]" : "h-[14vh]"
        }`}
      >
        {/* Toggle bar */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full flex-col items-center gap-2 px-4 pb-2 pt-3"
          aria-label={expanded ? "Collapse terminal" : "Expand terminal"}
        >
          <div className="h-1.5 w-14 rounded-full bg-slate-500" />
          <span className="text-xs font-medium text-slate-300">
            {expanded ? "Hide terminal" : "Show terminal"}
          </span>
        </button>

        {/* Terminal wrapper */}
        <div className="h-[calc(100%-44px)] px-2 pb-2">
          <div className="h-full overflow-hidden rounded-2xl border border-slate-800">
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
