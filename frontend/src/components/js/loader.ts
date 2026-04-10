import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
);

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
/**
 * Represents a loadable 3D object in the scene.
 */
export interface SceneObject {
  /** Path or URL to the GLTF/GLB file */
  fileName: string;

  /** Scale to apply to the loaded object */
  coords: THREE.Vector3;
}

/**
 * Loads a GLTF object into the scene.
 *
 * If loading succeeds:
 * - The model is added to the scene
 * - The provided scale is applied
 * - The optional `onLoad` callback is triggered
 *
 * If loading fails:
 * - A fallback red wireframe cube is created instead
 * - The fallback object is scaled
 * - The optional `onLoad` callback is triggered
 *
 * @param object - Configuration describing the object to load
 * @param scene - The THREE.Scene to add the object to
 * @param onLoad - Optional callback executed after the object (or fallback) is added
 */
export function loadObject(
  object: SceneObject,
  scene: THREE.Scene,
  onLoad?: (obj: THREE.Object3D) => void,
): void {
  loader.load(
    object.fileName,

    /**
     * Called when the GLTF model loads successfully.
     *
     * @param gltf - Loaded GLTF result
     */
    (gltf) => {
      const mesh = gltf.scene;

      mesh.scale.copy(object.coords);
      scene.add(mesh);

      onLoad?.(mesh);

      console.log(
        `${object.fileName}.loadObject(): Object loaded successfully!`,
      );
    },
    undefined,

    /**
     * Called if loading fails.
     *
     * @param error - Error returned by the loader
     */
    (error) => {
      console.error(
        `${object.fileName}.loadObject(): Error loading object:`,
        error,
      );

      // Fallback: red wireframe cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        wireframe: true,
      });
      const cube = new THREE.Mesh(geometry, material);

      cube.scale.copy(object.coords);
      scene.add(cube);

      onLoad?.(cube);

      console.log(
        `${object.fileName}.loadObject(): Fallback cube loaded instead.`,
      );
    },
  );
}
