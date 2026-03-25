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
 * * Built using WebGLRenderer and OrbitControls.
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
     *
     * Multiple sphere meshes with increasing radius create
     * a halo-like atmospheric effect.
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
     *
     * Updates object positions and renders each frame.
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

  /**
   * React UI overlay rendered above the WebGL canvas.
   */
  /**
   * React UI overlay.
   *
   * Contains:
   * - Centered title and description
   * - Navigation buttons for dashboard and health monitoring
   * - Region status indicators
   * - Project attribution footer
   */
  return (
    <div className="relative w-screen h-screen">
      {/* WebGL canvas mount point */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Center text overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        {/**
         * Main page title.
         *
         * Describes the system architecture being visualized.
         */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg text-center text-balance">
          Multi-regional
          <br />
          Database
        </h1>

        {/**
         * Supporting subtitle describing system capabilities.
         */}
        <p className="mt-4 text-lg md:text-xl text-white/80 max-w-lg text-center text-pretty drop-shadow">
          Multi-region cloud-native database with real-time health monitoring
        </p>
      </div>

      {/* Bottom action buttons and system status */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pb-8">
        {/**
         * Primary navigation actions.
         */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pointer-events-auto">
          {/* Dashboard navigation */}
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ef6b3a] px-8 py-4 font-semibold text-white shadow-lg shadow-[#ef6b3a]/30 transition-all duration-200 hover:scale-105 hover:bg-[#d95a2a] hover:shadow-xl"
          >
            <CookingPot className="w-5 h-5" />
            View Dashboard
          </button>

          {/* Health monitoring page */}
          <button
            onClick={() => navigate("/health")}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-800 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-gray-700 hover:shadow-xl"
          >
            <Activity className="w-5 h-5" />
            Check Health Status
          </button>
        </div>

        {/**
         * Region health indicators.
         *
         * Each pill represents a database region
         * with a pulsing status light.
         */}
        <div className="flex flex-wrap justify-center gap-3 mt-6 pointer-events-auto">
          {["US East", "US West"].map((region) => (
            <div
              key={region}
              className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="w-2 h-2 rounded-l bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-700 font-medium">
                {region}
              </span>
            </div>
          ))}
        </div>

        {/**
         * Project attribution footer.
         */}
        <p className="text-white/70 text-sm mt-6">
          Group 26 - In collaboration with Toast
        </p>
      </div>
    </div>
  );
}
