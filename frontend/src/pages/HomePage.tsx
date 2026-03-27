import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadObject, type SceneObject } from "../components/js/loader";
import { Curve } from "../components/js/curve";
import { CookingPot, Activity } from "lucide-react";

/**
 * HomePage
 *
 * Landing page for the application that renders a 3D animated scene
 * representing a multi-regional distributed system.
 *
 * Features:
 * - Animated Earth model
 * - Multiple orbiting planes representing regional traffic
 * - Orbital path visualizations
 * - Dynamic starfield background
 * - Atmospheric glow around the Earth
 * - Dark/light mode reactive rendering
 * - Interactive UI overlays for navigation
 *
 * Built using WebGLRenderer and OrbitControls.
 * The scene is mounted into a DOM element using a React ref.
 *
 * @example
 * ```tsx
 * <HomePage />
 * ```
 */
export default function HomePage() {
  /**
   * Reference to the DOM container used to mount the WebGL canvas.
   */
  const mountRef = useRef<HTMLDivElement>(null);

  /**
   * React Router navigation function for routing between pages.
   */
  const navigate = useNavigate();

  /**
   * Initializes the Three.js rendering pipeline and animation loop.
   *
   * Runs once when the component mounts.
   */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /**
     * Tracks whether the component is still mounted.
     * Prevents updates after unmount.
     */
    let mounted = true;

    /**
     * Returns whether the application is currently in dark mode.
     */
    const isDark = () => document.documentElement.classList.contains("dark");

    /**
     * Main WebGL renderer responsible for drawing the scene.
     */
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(isDark() ? 0x0a0f1e : 0x20a7db);
    mount.appendChild(renderer.domElement);

    /**
     * Primary Three.js scene container.
     */
    const scene = new THREE.Scene();

    /**
     * Perspective camera used for viewing the 3D scene.
     */
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    camera.position.set(25, 15, 40);

    /**
     * Orbit controls allowing the user to rotate around the scene.
     */
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 80;
    controls.update();

    /**
     * Directional light acting as the primary scene illumination.
     */
    const dLight = new THREE.DirectionalLight(0xffffff, isDark() ? 0.5 : 1);

    dLight.position.set(0, 10, 2);
    scene.add(dLight);

    /**
     * Ambient light providing global base illumination.
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark() ? 0.2 : 0.5);

    scene.add(ambientLight);

    /**
     * Creates a starfield using randomly distributed points.
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

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    /**
     * Atmospheric glow layers surrounding the Earth model.
     */
    const glowMeshes: THREE.Mesh[] = [];

    const glowConfigs = [
      { radius: 10.8, lightOpacity: 0.35, darkOpacity: 0.15 },
      { radius: 11.5, lightOpacity: 0.28, darkOpacity: 0.08 },
      { radius: 12.5, lightOpacity: 0.13, darkOpacity: 0.04 },
    ];

    glowConfigs.forEach(({ radius, lightOpacity, darkOpacity }) => {
      const glowGeo = new THREE.SphereGeometry(radius, 64, 64);

      const glowMat = new THREE.MeshBasicMaterial({
        color: isDark() ? 0x1a4aff : 0x00fbff,
        transparent: true,
        opacity: isDark() ? darkOpacity : lightOpacity,
        side: THREE.BackSide,
      });

      const mesh = new THREE.Mesh(glowGeo, glowMat);

      glowMeshes.push(mesh);
      scene.add(mesh);
    });

    /**
     * Orbit path meshes used to visualize flight routes.
     */
    const orbitMeshes: THREE.Mesh[] = [];

    [
      { radius: 13, opacity: 0.2 },
      { radius: 18, opacity: 0.2 },
      { radius: 21, opacity: 0.2 },
    ].forEach(({ radius, opacity }) => {
      const points: THREE.Vector3[] = [];

      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;

        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle * 3) * 2,
            Math.sin(angle) * radius,
          ),
        );
      }

      const curve = new Curve(points, true);

      curve.draw(
        scene,
        isDark() ? 0x4488ff : 0xffffff,
        0.1,
        opacity,
        true,
        false,
      );

      if (curve.pathObject) orbitMeshes.push(curve.pathObject);
    });

    /**
     * Reference to the Earth model.
     */
    let earth: THREE.Object3D | null = null;

    /**
     * Configuration for the Earth model loader.
     */
    const earthObject: SceneObject = {
      fileName: "/public/earth.gltf",
      coords: new THREE.Vector3(10, 10, 10),
    };

    /**
     * Loads the Earth model into the scene.
     */
    loadObject(earthObject, scene, (obj) => {
      if (!mounted) return;
      earth = obj;
    });

    /**
     * Stores orbiting planes representing distributed traffic nodes.
     */
    const planes: {
      object: THREE.Object3D;
      orbitRadius: number;
      speed: number;
      offset: number;
      yAmplitude: number;
    }[] = [];

    /**
     * Configuration for each orbiting plane.
     */
    const orbitConfigs = [
      { orbitRadius: 15, speed: 1.8, offset: 0, yAmplitude: 3 },
      {
        orbitRadius: 18,
        speed: 1.6,
        offset: Math.PI + Math.PI / 3,
        yAmplitude: 2,
      },
      { orbitRadius: 21, speed: 1.4, offset: Math.PI / 2, yAmplitude: 4 },
    ];

    const planeObject: SceneObject = {
      fileName: "/public/plane.gltf",
      coords: new THREE.Vector3(0.5, 0.5, 0.5),
    };

    /**
     * Loads multiple planes and assigns orbital parameters.
     */
    orbitConfigs.forEach((config) => {
      loadObject(planeObject, scene, (obj) => {
        if (!mounted) return;

        planes.push({
          object: obj,
          orbitRadius: config.orbitRadius,
          speed: config.speed,
          offset: config.offset,
          yAmplitude: config.yAmplitude,
        });
      });
    });

    /**
     * Observes dark-mode changes and updates scene colors.
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

      if (earth) earth.rotation.y += 0.001;

      planes.forEach((plane) => {
        const angle = time * plane.speed + plane.offset;

        plane.object.position.x = Math.cos(angle) * plane.orbitRadius;
        plane.object.position.z = Math.sin(angle) * plane.orbitRadius;
        plane.object.position.y = Math.sin(angle * 3) * plane.yAmplitude;

        const nextAngle = angle + 0.01;

        plane.object.lookAt(
          Math.cos(nextAngle) * plane.orbitRadius,
          Math.sin(nextAngle * 3) * plane.yAmplitude,
          Math.sin(nextAngle) * plane.orbitRadius,
        );
      });

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    /**
     * Handles browser window resizing.
     */
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    /**
     * Cleanup executed when the component unmounts.
     */
    return () => {
      mounted = false;
      observer.disconnect();
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* WebGL canvas mount point */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Soft overlay to improve text readability */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-transparent to-black/30 dark:from-black/20 dark:to-black/50" />

      {/* Hero content */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between px-5 pb-8 pt-20 sm:px-8 sm:pb-10 sm:pt-24">
        <div className="flex-1" />

        <div className="max-w-[22rem] text-center sm:max-w-2xl">
          <h1 className="text-4xl font-bold leading-[0.95] text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
            Multi-regional
            <br />
            Database
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/85 drop-shadow sm:mt-5 sm:text-base md:text-lg">
            Multi-region cloud-native database with real-time health monitoring
          </p>
        </div>

        <div className="mt-8 flex w-full max-w-sm flex-col items-center gap-3 pointer-events-auto sm:max-w-md">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ef6b3a] px-6 py-4 font-semibold text-white shadow-lg shadow-[#ef6b3a]/30 transition-all duration-200 hover:scale-[1.02] hover:bg-[#d95a2a] hover:shadow-xl"
          >
            <CookingPot className="h-5 w-5" />
            View Dashboard
          </button>

          <button
            onClick={() => navigate("/health")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900/85 px-6 py-4 font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800/90 hover:shadow-xl"
          >
            <Activity className="h-5 w-5" />
            Check Health Status
          </button>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {["US East", "US West"].map((region) => (
              <div
                key={region}
                className="flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-700 sm:text-sm">
                  {region}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 hidden text-center text-xs text-white/70 sm:block">
            Group 26 - In collaboration with Toast
          </p>
        </div>
      </div>
    </div>
  );
}
