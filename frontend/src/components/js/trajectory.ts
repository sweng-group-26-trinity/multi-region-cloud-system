import * as THREE from "three";

/**
 * A trajectory between two world-space points, with an optional lateral bend
 * that curves the path via a quadratic Bézier arc.
 *
 * The `path` property exposes the same `getPointAt` / `getTangentAt` interface
 * used by `Curve`, so it can be used as a drop-in replacement anywhere a
 * Catmull-Rom path was used.
 */
export class Trajectory {
  /** Unit vector along the direction of travel (from `start` to `end`). */
  normal: THREE.Vector3;

  /** World-space start point of the trajectory. */
  start: THREE.Vector3;

  /** World-space end point of the trajectory. */
  end: THREE.Vector3;

  /**
   * Path from `start` to `end`.
   *
   * A straight `THREE.LineCurve3` when `bend` is zero, or a
   * `THREE.QuadraticBezierCurve3` when a bend offset is supplied.
   * `getPointAt(0)` returns `start` and `getPointAt(1)` returns `end`.
   */
  path: THREE.Curve<THREE.Vector3>;

  /** Optional debug mesh visualising the trajectory segment. Null until `draw` is called. */
  pathObject: THREE.Mesh | null = null;

  /**
   * @param start - World-space start point of the trajectory.
   * @param end   - World-space end point of the trajectory.
   * @param bend  - Lateral offset (world units) applied to the midpoint
   *               control point, curving the path sideways. Positive and
   *               negative values curve in opposite directions. Defaults to 0
   *               (straight line).
   */
  constructor(start: THREE.Vector3, end: THREE.Vector3, bend = 0) {
    this.start = start.clone();
    this.end = end.clone();
    this.normal = end.clone().sub(start).normalize();

    if (bend !== 0) {
      const mid = start.clone().lerp(end, 0.5);
      // Always bend towards the Earth (origin) so the arc bows inward
      const toEarth = mid.clone().negate().normalize();
      const control = mid.clone().addScaledVector(toEarth, bend);
      this.path = new THREE.QuadraticBezierCurve3(
        this.start,
        control,
        this.end,
      );
    } else {
      this.path = new THREE.LineCurve3(this.start, this.end);
    }
  }

  /**
   * Renders the trajectory as a tube mesh for debugging and adds it to the scene.
   * Replaces any previously drawn mesh for this trajectory.
   *
   * @param scene       - The THREE.Scene to add the mesh to.
   * @param color       - Tube colour (default: red).
   * @param radius      - Tube radius in world units (default: 0.2).
   * @param opacity     - Material opacity in the range [0, 1] (default: 1).
   * @param transparent - Whether the material should use transparency (default: false).
   * @returns `true` on success.
   */
  draw(
    scene: THREE.Scene,
    color: THREE.ColorRepresentation = 0xff0000,
    radius = 0.2,
    opacity = 1,
    transparent = false,
  ): boolean {
    if (this.pathObject) {
      scene.remove(this.pathObject);
      this.pathObject.geometry.dispose();
      (this.pathObject.material as THREE.Material).dispose();
    }

    const geometry = new THREE.TubeGeometry(this.path, 20, radius, 6, false);
    const material = new THREE.MeshBasicMaterial({
      color,
      opacity,
      transparent,
      depthWrite: false,
      toneMapped: false,
    });
    this.pathObject = new THREE.Mesh(geometry, material);
    scene.add(this.pathObject);
    return true;
  }
}
