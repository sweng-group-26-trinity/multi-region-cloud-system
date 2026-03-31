import { loadObject, type SceneObject } from "@/components/js/loader";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const GRAVITY = -0.018;
const FLAP = 0.32;
const PIPE_SPEED = 0.12;
const PIPE_GAP = 7;
const PIPE_INTERVAL = 100;
const BIRD_X = -4;

// --- Plane hitbox tuning ---
const HIT_OFFSET_X = 0.0;
const HIT_OFFSET_Y = 0.8;
const HIT_W = 1.0;
const HIT_H = 0.3;

const DEBUG = true;
/**
 * Three.js-powered game scene component.
 *
 * @remarks
 * - Orthographic camera and procedural terrain
 * - Dynamic lighting with dark mode support
 * - GLTF-loaded player model (plane) with fallback mesh
 * - Procedurally generated obstacles ("pipes" as trees)
 * - Custom collision detection using triangle approximations
 * - HUD overlay for score and game state
 * - High score submission via authenticated API call
 *
 * Game mechanics:
 * - Gravity continuously pulls the player downward
 * - Player can "flap" upward via input
 * - Obstacles move horizontally toward the player
 * - Score increases when passing obstacles
 * - Collision or bounds exit triggers game over
 *
 * Rendering:
 * - Uses requestAnimationFrame loop
 * - Terrain uses Perlin noise for natural variation
 * - Background includes star field with dark mode responsiveness
 *
 * Input:
 * - Space key or pointer/tap triggers flap
 * - Restart occurs after game over on next input
 *
 * Networking:
 * - On death, sends POST request to `/api/highscores`
 *   with JWT bearer token (if present in localStorage)
 *
 * Debugging:
 * - When DEBUG is enabled, renders:
 *   - Plane hitbox (Box3Helper)
 *   - Triangle outlines for obstacle collision regions
 *
 * @returns React component rendering the Three.js canvas and HUD overlay
 */
export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const isDark = () => document.documentElement.classList.contains("dark");

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(isDark() ? 0x0a0f1e : 0x20a7db);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const aspect = mount.clientWidth / mount.clientHeight;
    const frustumSize = 20;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      2000,
    );
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);

    // Lights
    const dLight = new THREE.DirectionalLight(0xffffff, isDark() ? 0.5 : 1);
    dLight.position.set(-5, 15, 10);
    scene.add(dLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark() ? 0.4 : 0.8);
    scene.add(ambientLight);

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000 * 3; i += 3) {
      const r = 40 + Math.random() * 70;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: isDark() ? 1.0 : 0.1,
    });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // Dark mode observer
    const observer = new MutationObserver(() => {
      const dark = isDark();
      renderer.setClearColor(dark ? 0x0a0f1e : 0x20a7db);
      dLight.intensity = dark ? 0.5 : 1;
      ambientLight.intensity = dark ? 0.4 : 0.8;
      starsMat.opacity = dark ? 1.0 : 0.1;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Ground
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xded895 });
    const ground = new THREE.Mesh(new THREE.BoxGeometry(200, 2, 1), groundMat);
    ground.position.set(0, -frustumSize / 2 - 0.5, 0);
    scene.add(ground);

    // --- Perlin noise ---
    function fade(t: number) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }
    function lerp(a: number, b: number, t: number) {
      return a + t * (b - a);
    }
    function grad(hash: number, x: number, y: number) {
      const h = hash & 3;
      const u = h < 2 ? x : y;
      const v = h < 2 ? y : x;
      return (h & 1 ? -u : u) + (h & 2 ? -v : v);
    }
    const perm = Array.from({ length: 256 }, (_: unknown, i: number) => i).sort(
      () => Math.random() - 0.5,
    );
    const p = [...perm, ...perm];
    function perlin(x: number, y: number) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      const u = fade(x),
        v = fade(y);
      const a = p[X]! + Y,
        b = p[X + 1]! + Y;
      return lerp(
        lerp(grad(p[a]!, x, y), grad(p[b]!, x - 1, y), u),
        lerp(grad(p[a + 1]!, x, y - 1), grad(p[b + 1]!, x - 1, y - 1), u),
        v,
      );
    }

    // --- Terrain: one very wide mesh per layer, scrolls and wraps ---
    const terrainLayers = [
      { z: -30, speed: 0.006, color: 0x2d8a1e, amplitude: 8.0 },
      { z: -20, speed: 0.014, color: 0x3aab28, amplitude: 6.5 },
      { z: -10, speed: 0.026, color: 0x4fd63a, amplitude: 5.0 },
    ];

    // Two tiles per layer, each 300 units wide — way more than any screen
    const tW = 300;
    const segsX = 200;
    const segsZ = 35;
    const tDepth = 20;
    const terrainMeshes: { mesh: THREE.Mesh; speed: number }[] = [];

    terrainLayers.forEach((layer) => {
      function makeTile(seedX: number): THREE.Mesh {
        const geo = new THREE.PlaneGeometry(tW, tDepth, segsX, segsZ);
        const pos = geo.attributes.position as THREE.BufferAttribute;
        const vertsPerRow = segsX + 1;
        for (let row = 0; row <= segsZ; row++) {
          for (let col = 0; col <= segsX; col++) {
            const idx = row * vertsPerRow + col;
            const nx = (col / segsX) * 8 + seedX;
            const nz = (row / segsZ) * 4;
            const noise =
              (perlin(nx, nz) +
                perlin(nx * 2, nz * 2) * 0.5 +
                perlin(nx * 4, nz * 4) * 0.25) *
              layer.amplitude;
            pos.setZ(idx, Math.max(0, noise));
          }
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({
          color: layer.color,
          roughness: 0.85,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -(Math.PI / 2 - 0.45);
        mesh.position.set(0, -frustumSize / 2, layer.z);
        scene.add(mesh);
        return mesh;
      }

      // Tile A at x=0, tile B at x=tW — they leapfrog
      const meshA = makeTile(0);
      meshA.position.x = 0;
      terrainMeshes.push({ mesh: meshA, speed: layer.speed });

      const meshB = makeTile(8); // different seed so they look varied
      meshB.position.x = tW;
      terrainMeshes.push({ mesh: meshB, speed: layer.speed });
    });

    // --- Plane ---
    const planePivot = new THREE.Group();
    planePivot.position.set(BIRD_X, 0, 0);
    scene.add(planePivot);

    let planeLoaded = false;
    loadObject(
      {
        fileName: "/public/plane.gltf",
        coords: new THREE.Vector3(0.5, 0.5, 0.5),
      },
      scene,
      (obj) => {
        scene.remove(obj);
        obj.rotation.y = Math.PI / 2;
        planePivot.add(obj);
        planeLoaded = true;
      },
    );

    const fallbackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.6, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xffd700 }),
    );
    planePivot.add(fallbackMesh);

    function getPlaneBB(): THREE.Box3 {
      const cx = planePivot.position.x + HIT_OFFSET_X;
      const cy = planePivot.position.y + HIT_OFFSET_Y;
      return new THREE.Box3(
        new THREE.Vector3(cx - HIT_W, cy - HIT_H, -1),
        new THREE.Vector3(cx + HIT_W, cy + HIT_H, 1),
      );
    }

    // --- Trees (pipes) ---
    type Pipe = {
      top: THREE.Group;
      bot: THREE.Group;
      x: number;
      scored: boolean;
      botTipY: number; // world Y of bottom tree tip
      botHeight: number;
      botHalfWidth: number;
      topTipY: number; // world Y of top tree tip
      topHeight: number;
      topHalfWidth: number;
    };
    const pipes: Pipe[] = [];

    function spawnPipe() {
      const gapY = (Math.random() - 0.5) * 5;
      const spawnX = (frustumSize * aspect) / 2 + 4;

      const pipeData: Pipe = {
        top: new THREE.Group(),
        bot: new THREE.Group(),
        x: spawnX,
        scored: false,
        botTipY: gapY - PIPE_GAP / 2,
        botHeight: 8,
        botHalfWidth: 2,
        topTipY: gapY + PIPE_GAP / 2,
        topHeight: 8,
        topHalfWidth: 2,
      };

      // bottom tree — tip at group origin, body hangs below
      const botGroup = new THREE.Group();
      botGroup.position.set(spawnX, gapY - PIPE_GAP / 2, 0);
      scene.add(botGroup);
      pipeData.bot = botGroup;

      loadObject(
        { fileName: "/public/tree.gltf", coords: new THREE.Vector3(2, 2, 2) },
        scene,
        (obj) => {
          scene.remove(obj);
          obj.rotation.y = (Math.random() - 0.5) * 0.8;
          obj.rotation.z = (Math.random() - 0.5) * 0.3;
          const box = new THREE.Box3().setFromObject(obj);
          const h = box.max.y - box.min.y;
          const hw = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
          pipeData.botHeight = h;
          pipeData.botHalfWidth = hw;
          obj.position.y = -box.max.y;
          botGroup.add(obj);
        },
      );

      // top tree — group flipped so tip points DOWN
      const topGroup = new THREE.Group();
      topGroup.position.set(spawnX, gapY + PIPE_GAP / 2, 0);
      topGroup.rotation.x = Math.PI;
      scene.add(topGroup);
      pipeData.top = topGroup;

      loadObject(
        { fileName: "/public/tree.gltf", coords: new THREE.Vector3(2, 2, 2) },
        scene,
        (obj) => {
          scene.remove(obj);
          obj.rotation.y = (Math.random() - 0.5) * 0.8;
          obj.rotation.z = (Math.random() - 0.5) * 0.3;
          const box = new THREE.Box3().setFromObject(obj);
          const h = box.max.y - box.min.y;
          const hw = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
          pipeData.topHeight = h;
          pipeData.topHalfWidth = hw;
          obj.position.y = -box.max.y;
          topGroup.add(obj);
        },
      );

      pipes.push(pipeData);
    }

    // --- HUD ---
    const hud = document.createElement("div");
    hud.style.cssText = `
      position:absolute;top:0;left:0;width:100%;height:100%;
      pointer-events:none;display:flex;flex-direction:column;
      align-items:center;justify-content:flex-start;padding-top:24px;
      font-family:monospace;
    `;
    const scoreEl = document.createElement("div");
    scoreEl.style.cssText =
      "font-size:48px;font-weight:700;color:white;text-shadow:2px 2px 0 #333;";
    scoreEl.textContent = "0";
    hud.appendChild(scoreEl);
    const msgEl = document.createElement("div");
    msgEl.style.cssText = `
      margin-top:60px;font-size:22px;color:white;
      text-shadow:1px 1px 0 #333;text-align:center;line-height:1.6;
    `;
    msgEl.textContent = "press space or tap to start";
    hud.appendChild(msgEl);
    mount.style.position = "relative";
    mount.appendChild(hud);

    // --- Debug: draw actual triangles ---
    const debugObjects: THREE.Object3D[] = [];

    function makeTriangleLine(
      tipX: number,
      tipY: number,
      baseX: number,
      baseTopY: number,
      baseHW: number,
      color: number,
    ): THREE.Line {
      const pts = [
        new THREE.Vector3(tipX, tipY, 0),
        new THREE.Vector3(baseX - baseHW, baseTopY, 0),
        new THREE.Vector3(baseX + baseHW, baseTopY, 0),
        new THREE.Vector3(tipX, tipY, 0), // close the triangle
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      return new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
    }

    function updateDebug() {
      debugObjects.forEach((o) => scene.remove(o));
      debugObjects.length = 0;
      if (!DEBUG) return;

      scene.updateMatrixWorld();

      // plane hitbox
      const planeHelper = new THREE.Box3Helper(
        getPlaneBB(),
        new THREE.Color(0x00ffff),
      );
      scene.add(planeHelper);
      debugObjects.push(planeHelper);

      for (const p of pipes) {
        // bottom tree: tip at top, base hangs below
        const botTri = makeTriangleLine(
          p.x,
          p.bot.position.y, // tip: x=tree centre, y=gap edge
          p.x,
          p.bot.position.y - p.botHeight, // base Y
          p.botHalfWidth,
          0x00ff00,
        );
        scene.add(botTri);
        debugObjects.push(botTri);

        // top tree: tip at bottom, base rises above
        const topTri = makeTriangleLine(
          p.x,
          p.top.position.y, // tip: x=tree centre, y=gap edge
          p.x,
          p.top.position.y + p.topHeight, // base Y
          p.topHalfWidth,
          0xff8800,
        );
        scene.add(topTri);
        debugObjects.push(topTri);
      }
    }

    // --- Game state ---
    let vy = 0;
    let alive = false;
    let started = false;
    let score = 0;
    let frame = 0;
    let animationId: number;

    function flap() {
      if (!started) {
        started = true;
        alive = true;
        msgEl.textContent = "";
      }
      if (alive) vy = FLAP;
    }

    function reset() {
      planePivot.position.set(BIRD_X, 0, 0);
      planePivot.rotation.z = 0;
      vy = 0;
      score = 0;
      frame = 0;
      scoreEl.textContent = "0";
      pipes.forEach((p) => {
        scene.remove(p.top);
        scene.remove(p.bot);
      });
      pipes.length = 0;
      alive = true;
      started = true;
      msgEl.textContent = "";
      spawnPipe();
    }

    function die() {
      alive = false;
      msgEl.innerHTML = "game over<br>...";
      for (const key of Object.keys(localStorage)) {
        console.log(key, "→", localStorage.getItem(key));
      }

      const token = localStorage.getItem("authToken"); // or however your AuthContext stores it
      if (token) {
        fetch("http://localhost:8080/api/highscores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ score }),
        })
          .then((r) => console.log("status:", r.status))
          .catch(console.error);
      } else {
        console.log("No access token found, skipping high score submission.");
      }
    }

    // Proper rect-to-triangle collision: check full plane hitbox against triangular tree cones
    function checkCollision(): boolean {
      const bb = getPlaneBB();
      const planeTop = bb.max.y;
      const planeBot = bb.min.y;
      const planeCX = (bb.min.x + bb.max.x) / 2;
      const planeHW = HIT_W;

      if (planeBot < -frustumSize / 2 + 1) return true;
      if (planeTop > frustumSize / 2) return true;

      for (const p of pipes) {
        // bottom tree: tip at p.bot.position.y, expands downward
        const botTip = p.bot.position.y;
        const botBase = botTip - p.botHeight;

        // check if plane vertically overlaps tree extent
        if (planeBot < botTip && planeTop > botBase) {
          // sample multiple heights through the plane to catch collisions
          const samples = [planeBot, planeTop, (planeBot + planeTop) / 2];
          for (const checkY of samples) {
            if (checkY >= botBase && checkY < botTip) {
              const depth = botTip - checkY;
              const allowedHW = (depth / p.botHeight) * p.botHalfWidth;
              const dxToTree = Math.abs(p.x - planeCX);
              if (dxToTree < allowedHW + planeHW) return true;
            }
          }
        }

        // top tree: tip at p.top.position.y, expands upward
        const topTip = p.top.position.y;
        const topBase = topTip + p.topHeight;

        // check if plane vertically overlaps tree extent
        if (planeTop > topTip && planeBot < topBase) {
          // sample multiple heights through the plane to catch collisions
          const samples = [planeBot, planeTop, (planeBot + planeTop) / 2];
          for (const checkY of samples) {
            if (checkY <= topBase && checkY > topTip) {
              const depth = checkY - topTip;
              const allowedHW = (depth / p.topHeight) * p.topHalfWidth;
              const dxToTree = Math.abs(p.x - planeCX);
              if (dxToTree < allowedHW + planeHW) return true;
            }
          }
        }
      }
      return false;
    }

    spawnPipe();

    function animate() {
      animationId = requestAnimationFrame(animate);
      frame++;

      if (alive) {
        vy += GRAVITY;
        planePivot.position.y += vy;
        planePivot.rotation.z = Math.max(-0.5, Math.min(0.4, vy * 1.5));

        if (frame % PIPE_INTERVAL === 0) spawnPipe();

        for (const p of pipes) {
          p.x -= PIPE_SPEED;
          p.top.position.x = p.x;
          p.bot.position.x = p.x;
          if (!p.scored && p.x < BIRD_X) {
            p.scored = true;
            score++;
            scoreEl.textContent = String(score);
          }
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
          const p = pipes[i]!;
          if (p.x < -(frustumSize * aspect) / 2 - 6) {
            scene.remove(p.top);
            scene.remove(p.bot);
            pipes.splice(i, 1);
          }
        }

        if (checkCollision()) die();
      }

      // leapfrog terrain tiles — each tile is tW wide, pair covers 2*tW
      for (const t of terrainMeshes) {
        t.mesh.position.x -= t.speed;
        if (t.mesh.position.x < -tW) {
          t.mesh.position.x += tW * 2;
        }
      }

      fallbackMesh.visible = !planeLoaded;
      updateDebug();
      renderer.render(scene, camera);
    }

    animate();

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!started || alive) flap();
        else reset();
      }
    };
    const onTap = () => {
      if (!started || alive) flap();
      else reset();
    };

    window.addEventListener("keydown", onKey);
    renderer.domElement.addEventListener("pointerdown", onTap);

    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      const a = mount.clientWidth / mount.clientHeight;
      camera.left = (-frustumSize * a) / 2;
      camera.right = (frustumSize * a) / 2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onTap);
      renderer.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
      if (mount.contains(hud)) mount.removeChild(hud);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}
