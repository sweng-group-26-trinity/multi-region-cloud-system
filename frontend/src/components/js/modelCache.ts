/**
 * @module modelCache
 *
 * A singleton GLTF model cache that loads each asset once over the network,
 * stores the parsed scene, and returns independent clones for each consumer.
 *
 * **Key behaviours:**
 * - First call triggers a real network/parse load.
 * - Concurrent calls for the same URL share one in-flight `Promise` — no duplicate fetches.
 * - Subsequent calls return a `clone()` synchronously via a resolved `Promise` — zero network cost.
 * - Each caller receives its own `Object3D` clone, so transforms, rotations, and visibility
 *   are fully independent across scenes.
 *
 * @example
 * ```ts
 * import { loadCached } from "./modelCache";
 *
 * loadCached("/public/earth.gltf").then((obj) => {
 *   obj.scale.setScalar(10);
 *   scene.add(obj);
 * });
 * ```
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
/**
 * Shared {@link GLTFLoader} instance reused for every load request.
 * Instantiating once avoids repeated internal setup costs.
 *
 * @internal
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
);
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
/**
 * Stores the canonical (master) `Object3D` scene for each URL after it has
 * been successfully loaded.
 *
 * Keys are the exact URL strings passed to {@link loadCached}.
 *
 * @internal
 */
const cache = new Map<string, THREE.Object3D>();

/**
 * Stores in-flight load `Promise`s keyed by URL.
 *
 * If a second caller requests the same URL while the first load is still
 * in progress, it receives a chained clone of this pending promise rather
 * than starting a new network request.
 *
 * Entries are removed once the load resolves or rejects.
 *
 * @internal
 */
const pending = new Map<string, Promise<THREE.Object3D>>();

/**
 * Loads a GLTF/GLB model from the given URL with transparent caching.
 *
 * Behaviour depends on the current cache state for `fileName`:
 *
 * | State | Outcome |
 * |-------|---------|
 * | Already loaded | Returns a `clone()` immediately (resolved `Promise`) |
 * | Load in progress | Chains onto the existing `Promise` and returns a `clone()` when it settles |
 * | Not yet requested | Fires a new network request, caches the result, and resolves with a `clone()` |
 *
 * The returned object is always a **clone** of the cached master scene, so
 * each caller can freely mutate position, rotation, scale, and visibility
 * without affecting other consumers.
 *
 * @param fileName - Absolute or root-relative URL of the `.gltf` or `.glb` asset.
 *   Must be stable across calls — the URL is used as the cache key.
 *
 *   clone ready to be added to a scene.
 *
 *
 * @example
 * ```ts
 * // Safe to call from multiple components simultaneously —
 * // only one HTTP request is made.
 * const [earth, earthCopy] = await Promise.all([
 *   loadCached("/public/earth.gltf"),
 *   loadCached("/public/earth.gltf"),
 * ]);
 * ```
 */
export function loadCached(fileName: string): Promise<THREE.Object3D> {
  if (cache.has(fileName)) {
    return Promise.resolve(cache.get(fileName)!.clone());
  }

  if (pending.has(fileName)) {
    return pending.get(fileName)!.then((obj) => obj.clone());
  }

  const promise = new Promise<THREE.Object3D>((resolve, reject) => {
    loader.load(
      fileName,
      (gltf) => {
        cache.set(fileName, gltf.scene);
        pending.delete(fileName);
        resolve(gltf.scene.clone());
      },
      undefined,
      reject,
    );
  });

  pending.set(fileName, promise);
  return promise;
}

/**
 * Evicts all entries from both the model cache and the pending-request map.
 *
 * will trigger a fresh network request.
 *
 * **When to use:**
 * - During hot-module replacement (HMR) teardown in development.
 *   on retained references to dispose geometries/materials first).
 * - In test `afterEach` hooks to reset module state between test cases.
 *
 * @example
 * ```ts
 * // In a Vitest / Jest afterEach:
 * afterEach(() => {
 *   clearModelCache();
 * });
 * ```
 */
export function clearModelCache(): void {
  cache.clear();
  pending.clear();
}
