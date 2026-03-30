import * as THREE from "three";

/**
 * Represents a 3D curve built from control points using Catmull-Rom interpolation.
 *
 * Provides utilities for:
 * - Rendering the curve as a tube mesh
 * - Moving and orienting objects along the curve
 */
export class Curve {
  /** Control points that define the curve */
  points: THREE.Vector3[];

  /** Whether the curve is closed (forms a loop) */
  closed: boolean;

  /** Internal Catmull-Rom curve representation */
  path: THREE.CatmullRomCurve3;

  /** Mesh object used to render the curve */
  pathObject: THREE.Mesh | null = null;

  /**
   * Creates a new Curve instance.
   *
   * @param points - Array of THREE.Vector3 control points
   * @param closed - Whether the curve should form a closed loop
   */
  constructor(points: THREE.Vector3[], closed = false) {
    this.points = points;
    this.closed = closed;
    this.path = new THREE.CatmullRomCurve3(this.points, this.closed);
  }

  /**
   * Draws the curve as a TubeGeometry mesh and adds it to the scene.
   *
   * If a previous mesh exists, it will be removed and disposed.
   *
   * @param scene - The THREE.Scene to add the curve mesh to
   * @param color - The color of the tube material (default: red)
   * @param radius - Radius of the tube (default: 0.2)
   * @returns True if successfully drawn, false if insufficient points
   */
  draw(
    scene: THREE.Scene,
    color: THREE.ColorRepresentation = 0xff0000,
    radius = 0.2,
    opacity: number,
    transparent: boolean,
  ): boolean {
    if (this.points.length < 2) {
      console.warn("Curve.draw(): not enough points");
      return false;
    }

    // Remove and dispose existing mesh if present
    if (this.pathObject) {
      scene.remove(this.pathObject);
      this.pathObject.geometry.dispose();
      (this.pathObject.material as THREE.Material).dispose();
    }
    const tubeGeometry = new THREE.TubeGeometry(
      this.path,
      100, // tubular segments
      radius,
      8, // radial segments
      this.closed,
    );
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color,
      opacity: opacity,
      transparent: transparent,
    });
    this.pathObject = new THREE.Mesh(tubeGeometry, tubeMaterial);

    scene.add(this.pathObject);

    return true;
  }

  /**
   * Moves and orients an object along the curve over time.
   *
   * The object is positioned at a point on the curve determined by:
   * `t = (elapsedTime * speed) % 1`
   *
   * The object's forward direction is aligned with the curve tangent.
   *
   * @param object - The THREE.Object3D to animate
   * @param elapsedTime - Time value used to compute curve position
   * @param speed - Movement speed multiplier (default: 0.2)
   */
  lookAt(object: THREE.Object3D, elapsedTime: number, speed = 0.2): void {
    if (!Number.isFinite(elapsedTime)) return;
    const t = (elapsedTime * speed) % 1;
    const position = this.path.getPointAt(t);
    object.position.copy(position);
    const tangent = this.path.getTangentAt(t);
    object.lookAt(position.clone().add(tangent));
  }
}