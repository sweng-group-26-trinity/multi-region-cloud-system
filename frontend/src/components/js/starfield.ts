import * as THREE from "three";
import { Trajectory } from "./trajectory";

/** Configuration options for {@link StarField}. */
export type StarFieldOptions = {
  /** Number of background stars to generate. Defaults to 2000. */
  count?: number;
  /** Inner shell radius for background star placement in world units. Defaults to 180. */
  minRadius?: number;
  /** Outer shell radius for background star placement in world units. Defaults to 330. */
  maxRadius?: number;
  /** Whether to start in dark mode with stars visible. Defaults to true. */
  darkMode?: boolean;

  /** Max simultaneous moving stars (active + fading combined). Defaults to 2. */
  maxActiveShots?: number;

  /** Tube radius for trail segments in world units. Defaults to 1.2. */
  trailTubeRadius?: number;

  /** Inner shell radius for shooting-star trajectories. Defaults to minRadius + 35. */
  shootingCurveMinRadius?: number;

  /** Outer shell radius for shooting-star trajectories. Defaults to maxRadius - 25. */
  shootingCurveMaxRadius?: number;

  /**
   * Render background stars as a single THREE.Points object (one draw call)
   * instead of individual sprites. Defaults to false.
   */
  usePoints?: boolean;
};

type StarData = {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  position: THREE.Vector3;
  baseOpacity: number;
};

/** One pre-built cylinder mesh that makes up a slice of the shooting-star trail. */
type TrailSegment = {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
};

/** One atmospheric glow layer rendered behind the shooting-star head. */
type GlowLayer = {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  /** Maximum opacity at full alpha. */
  baseOpacity: number;
};

/** All Three.js objects that visually represent one shooting star. */
type ShootingStarVisual = {
  headMaterial: THREE.MeshBasicMaterial;
  head: THREE.Mesh;
  trailSegments: TrailSegment[];
  /** Concentric back-face spheres that create a soft blue corona. */
  glowLayers: GlowLayer[];
};

/** Runtime state for one active or fading shooting star. */
type ShootingStarState = {
  curve: Trajectory;
  /** Normalised start of the sub-segment travelled on the curve (0–1). */
  tStart: number;
  /** Normalised end of the sub-segment travelled on the curve (0–1). */
  tEnd: number;
  /** How far along the span the head has moved; may exceed 1 after the end. */
  shootProgress: number;
  /** Fade-out multiplier (1 = fully visible, 0 = gone). */
  fadeAlpha: number;
  /** Seconds since this shot spawned — drives the fade-in ramp. */
  age: number;
  /** Units of shootProgress advanced per second. */
  speed: number;
  /** World-unit length of the tStart→tEnd segment, used for extrapolation. */
  segmentLength: number;
  /** Accumulated fade-out time, normalised by shootingFadeDuration. */
  fadeProgress: number;
  /** True once the head has passed fadeStartThreshold. */
  isFading: boolean;
  visual: ShootingStarVisual;
  /**
   * Per-shot trail length as a fraction of the shoot-progress span.
   * Randomised at spawn so each star has a distinct trail length.
   */
  trailMaxFraction: number;
};

/** Manages a 3D starfield scene with background stars and animated shooting stars. */
export class StarField {
  private scene: THREE.Scene;
  /** Group that owns all star sprites, trail meshes, and glow layers. */
  private group: THREE.Group;
  private stars: StarData[] = [];
  private darkMode: boolean;

  /** Total seconds elapsed since construction — drives shot scheduling. */
  private elapsed = 0;
  /** Elapsed value at which the next shot should spawn. */
  private nextShotTime = 0;

  /**
   * Moving stars — counted against maxActiveShots.
   * Once a star starts fading it moves to fadingShots, freeing the slot.
   */
  private activeShots: ShootingStarState[] = [];

  /**
   * Fading stars — counted against the cap so they can't accumulate unbounded.
   * Disposed once fully invisible.
   */
  private fadingShots: ShootingStarState[] = [];

  /** Maximum number of simultaneously visible shots (active + fading). */
  private maxActiveShots = 2;

  /** Number of cylinder segments per trail. */
  private readonly trailSteps = 20;

  /** Seconds over which a new shot ramps from invisible to full opacity. */
  private readonly fadeInDuration = 0.6;
  /** Seconds for the fade-out to reach zero. */
  private readonly shootingFadeDuration = 8.45;
  /** shootProgress fraction at which fade-out begins. */
  private readonly fadeStartThreshold = 0.68;
  private readonly trailTubeRadius: number;

  /** Reusable midpoint vector — allocated once to avoid per-frame GC pressure. */
  private readonly _segMid = new THREE.Vector3();
  /** Reusable direction vector — allocated once to avoid per-frame GC pressure. */
  private readonly _segDir = new THREE.Vector3();
  /** Constant Y-axis used when orienting trail cylinder meshes. */
  private readonly _yAxis = new THREE.Vector3(0, 1, 0);

  /** Inner and outer shell radii for background star placement. */
  private starMinRadius = 180;
  private starMaxRadius = 330;
  /** Shell radii within which shooting-star trajectories are generated. */
  private shootingStartMinRadius = 230;
  private shootingStartMaxRadius = 350;

  /** When true, stars are rendered as a single THREE.Points object. */
  private usePoints = false;
  /** The THREE.Points mesh used when usePoints is true. */
  private pointsObject: THREE.Points | null = null;
  /** Shared material for the points object. */
  private pointsMaterial: THREE.PointsMaterial | null = null;

  constructor(scene: THREE.Scene, options: StarFieldOptions = {}) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "CustomStarField";

    this.darkMode = options.darkMode ?? true;
    this.trailTubeRadius = options.trailTubeRadius ?? 1.2;

    const count = options.count ?? 2000;
    this.starMinRadius = options.minRadius ?? 180;
    this.starMaxRadius = options.maxRadius ?? 330;

    this.shootingStartMinRadius =
      options.shootingCurveMinRadius ?? this.starMinRadius + 35;
    this.shootingStartMaxRadius =
      options.shootingCurveMaxRadius ?? this.starMaxRadius - 25;

    this.maxActiveShots = options.maxActiveShots ?? 1;
    this.usePoints = options.usePoints ?? false;

    this.createStars(count, this.starMinRadius, this.starMaxRadius);

    this.scene.add(this.group);
    this.setDarkMode(this.darkMode);
    this.scheduleNextShot(0.5);
  }

  /** Advances the starfield simulation by one frame. @param delta - Elapsed seconds since the last frame. */
  update(delta: number): void {
    if (!Number.isFinite(delta) || delta <= 0) return;

    this.elapsed += delta;
    if (!this.darkMode) return;

    if (this.elapsed >= this.nextShotTime) {
      const totalShots = this.activeShots.length + this.fadingShots.length;
      if (totalShots < this.maxActiveShots) {
        this.startShootingStar();
      }
      this.scheduleNextShot(totalShots >= this.maxActiveShots ? 0.5 : 1.5);
    }

    // Tick active shots — transfer fading ones immediately to free the slot
    for (let i = this.activeShots.length - 1; i >= 0; i--) {
      const shot = this.activeShots[i]!;
      this.tickShot(shot, delta);

      if (shot.isFading) {
        this.activeShots.splice(i, 1);
        this.fadingShots.push(shot);
      }
    }

    // Tick fading shots — dispose once fully invisible
    for (let i = this.fadingShots.length - 1; i >= 0; i--) {
      const shot = this.fadingShots[i]!;
      this.tickShot(shot, delta);

      if (shot.fadeAlpha <= 0) {
        this.disposeShot(shot);
        this.fadingShots.splice(i, 1);
      }
    }
  }

  /** Toggles dark mode, showing or hiding stars and shooting-star effects. @param darkMode - True to enable the starfield, false to hide it. */
  setDarkMode(darkMode: boolean): void {
    this.darkMode = darkMode;

    for (const star of this.stars) {
      star.baseOpacity = this.darkMode ? 0.95 : 0;
      star.material.opacity = star.baseOpacity;
    }

    if (this.pointsMaterial) {
      this.pointsMaterial.opacity = this.darkMode ? 1.0 : 0;
    }

    if (!this.darkMode) this.hideShootingStars();
  }

  /** Removes all starfield objects from the scene and releases their GPU resources. */
  dispose(): void {
    this.scene.remove(this.group);

    for (const star of this.stars) {
      this.group.remove(star.sprite);
      star.material.dispose();
    }

    // Dispose points geometry and material when in usePoints mode
    if (this.pointsObject) {
      this.group.remove(this.pointsObject);
      this.pointsObject.geometry.dispose();
      this.pointsMaterial?.dispose();
      this.pointsObject = null;
      this.pointsMaterial = null;
    }

    for (const shot of [...this.activeShots, ...this.fadingShots]) {
      this.disposeShot(shot);
    }

    this.stars = [];
    this.activeShots = [];
    this.fadingShots = [];
  }

  // Background stars

  private createStars(
    count: number,
    minRadius: number,
    maxRadius: number,
  ): void {
    if (this.usePoints) {
      // Pack all positions into a single BufferGeometry — one draw call instead of one per star
      const positions = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const p = this.randomSpherePoint(minRadius, maxRadius);
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );

      this.pointsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.4,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      });

      this.pointsObject = new THREE.Points(geometry, this.pointsMaterial);
      this.group.add(this.pointsObject);
      return;
    }

    for (let i = 0; i < count; i++) {
      const position = this.randomSpherePoint(minRadius, maxRadius);

      const material = new THREE.SpriteMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
      });

      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);

      const size = Math.random() < 0.05 ? 1.0 : 0.25 + Math.random() * 0.35;
      sprite.scale.set(size, size, size);

      this.group.add(sprite);

      this.stars.push({
        sprite,
        material,
        position: position.clone(),
        baseOpacity: 0,
      });
    }
  }

  // Trail

  private createTrailSegments(): TrailSegment[] {
    const segments: TrailSegment[] = [];

    for (let i = 0; i < this.trailSteps; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0x99bbff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      });

      // Pre-build a unit-height cylinder — repositioned each frame rather than reallocated
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
          this.trailTubeRadius,
          this.trailTubeRadius,
          1,
          6,
          1,
        ),
        material,
      );
      mesh.visible = false;

      this.group.add(mesh);
      segments.push({ mesh, material });
    }

    return segments;
  }

  private createShotVisual(): ShootingStarVisual {
    const headMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });

    // Low-poly icosahedron for the head — sized to match the trail tube radius
    const head = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 1),
      headMaterial,
    );
    head.scale.setScalar(this.trailTubeRadius);
    head.visible = false;
    this.group.add(head);

    // Three concentric back-face spheres producing a soft blue corona around the head
    const glowConfigs: { scaleMult: number; baseOpacity: number }[] = [
      { scaleMult: 3.5, baseOpacity: 0.45 },
      { scaleMult: 6.0, baseOpacity: 0.28 },
      { scaleMult: 9.5, baseOpacity: 0.14 },
    ];

    const glowLayers: GlowLayer[] = glowConfigs.map(
      ({ scaleMult, baseOpacity }) => {
        const material = new THREE.MeshBasicMaterial({
          color: 0x1a4aff,
          transparent: true,
          opacity: 0,
          side: THREE.BackSide,
          depthWrite: false,
          toneMapped: false,
          blending: THREE.AdditiveBlending,
        });
        const mesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1, 2),
          material,
        );
        mesh.scale.setScalar(this.trailTubeRadius * scaleMult);
        mesh.visible = false;
        this.group.add(mesh);
        return { mesh, material, baseOpacity };
      },
    );

    return {
      headMaterial,
      head,
      trailSegments: this.createTrailSegments(),
      glowLayers,
    };
  }

  private resetShotVisual(visual: ShootingStarVisual): void {
    visual.head.visible = false;
    visual.headMaterial.opacity = 0;
    for (const seg of visual.trailSegments) {
      seg.mesh.visible = false;
      seg.material.opacity = 0;
    }
    for (const glow of visual.glowLayers) {
      glow.mesh.visible = false;
      glow.material.opacity = 0;
    }
  }

  private disposeShotVisual(visual: ShootingStarVisual): void {
    this.group.remove(visual.head);
    visual.head.geometry.dispose();
    visual.headMaterial.dispose();

    for (const seg of visual.trailSegments) {
      this.group.remove(seg.mesh);
      seg.mesh.geometry.dispose();
      seg.material.dispose();
    }

    for (const glow of visual.glowLayers) {
      this.group.remove(glow.mesh);
      glow.mesh.geometry.dispose();
      glow.material.dispose();
    }
  }

  private disposeShot(shot: ShootingStarState): void {
    this.disposeShotVisual(shot.visual);
    if (shot.curve.pathObject) {
      this.scene.remove(shot.curve.pathObject);
      shot.curve.pathObject.geometry.dispose();
      (shot.curve.pathObject.material as THREE.Material).dispose();
      shot.curve.pathObject = null;
    }
  }

  // Shooting star lifecycle

  private startShootingStar(): void {
    // Build a fresh trajectory tangent to the sphere shell for this shot
    const normal = this.randomUnitVector();
    const shellRadius =
      this.shootingStartMinRadius +
      Math.random() *
        (this.shootingStartMaxRadius - this.shootingStartMinRadius);
    const center = normal.clone().multiplyScalar(shellRadius);

    // Two orthogonal basis vectors on the tangent plane — random angle so
    // the travel direction is not always horizontal
    const helper =
      Math.abs(normal.y) < 0.95
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);
    const basisA = new THREE.Vector3().crossVectors(normal, helper).normalize();
    const basisB = new THREE.Vector3().crossVectors(normal, basisA).normalize();
    const angle = Math.random() * Math.PI * 2;
    const tangent = basisA
      .clone()
      .multiplyScalar(Math.cos(angle))
      .addScaledVector(basisB, Math.sin(angle));

    const lineLength = 60 + Math.random() * 60;
    // Positive bend — Trajectory pushes the midpoint towards Earth
    const bend = (0.2 + Math.random() * 0.3) * lineLength;
    const trajectory = new Trajectory(
      center.clone().addScaledVector(tangent, -lineLength / 2),
      center.clone().addScaledVector(tangent, lineLength / 2),
      bend,
    );

    const span = 0.16 + Math.random() * 0.22;
    const tStart = Math.random() * (1 - span - 0.04) + 0.02;
    const tEnd = tStart + span;

    const segmentLength = this.estimateCurveSegmentLength(
      trajectory,
      tStart,
      tEnd,
    );
    const visual = this.createShotVisual();
    this.resetShotVisual(visual);

    const trailMaxFraction = 1.5 + Math.random() * 0.5;

    this.activeShots.push({
      curve: trajectory,
      tStart,
      tEnd,
      shootProgress: 0,
      fadeAlpha: 1,
      age: 0,
      speed: 1.8 + Math.random() * 2.2,
      segmentLength,
      fadeProgress: 0,
      isFading: false,
      visual,
      trailMaxFraction,
    });
  }

  /** Advances a single shot and sets isFading when the threshold is crossed. */
  private tickShot(shot: ShootingStarState, delta: number): void {
    shot.age += delta;
    shot.shootProgress += shot.speed * delta;

    if (!shot.isFading && shot.shootProgress >= this.fadeStartThreshold) {
      shot.isFading = true;
    }
    if (shot.isFading) {
      shot.fadeProgress += delta / this.shootingFadeDuration;
      shot.fadeAlpha = Math.max(0, 1 - shot.fadeProgress);
    }

    // Combined alpha: ramp in over fadeInDuration, then ramp out when isFading
    const fadeIn = Math.min(1, shot.age / this.fadeInDuration);
    const alpha = fadeIn * shot.fadeAlpha;

    // Head position — extrapolate linearly past the curve end if needed
    const clampedProgress = Math.min(1, shot.shootProgress);
    const headT = THREE.MathUtils.lerp(shot.tStart, shot.tEnd, clampedProgress);
    let headPosition: THREE.Vector3;

    if (shot.shootProgress > 1) {
      const endPos = shot.curve.path.getPointAt(headT);
      const exitTangent = shot.curve.path.getTangentAt(headT).normalize();
      const extraDist = (shot.shootProgress - 1) * shot.segmentLength;
      headPosition = endPos.clone().addScaledVector(exitTangent, extraDist);
    } else {
      headPosition = shot.curve.path.getPointAt(headT);
    }

    shot.visual.head.visible = alpha > 0;
    shot.visual.head.position.copy(headPosition);
    shot.visual.headMaterial.opacity = Math.min(1, alpha * 1.2);

    // Glow layers follow the head and pulsate at ~1.3 Hz
    const pulse = 0.7 + 0.3 * Math.sin(shot.age * 8);
    for (const glow of shot.visual.glowLayers) {
      glow.mesh.visible = alpha > 0;
      glow.mesh.position.copy(headPosition);
      glow.material.opacity = alpha * glow.baseOpacity * pulse;
    }

    this.renderTrail(shot, alpha);
  }

  private renderTrail(shot: ShootingStarState, alpha: number): void {
    // Tail has no upper clamp so both ends keep moving past the curve end during fade
    const trailProgress = Math.max(
      0,
      shot.shootProgress - shot.trailMaxFraction,
    );

    // Pre-compute exit position and tangent once so all segments can extrapolate cheaply
    const pastEnd = shot.shootProgress > 1;
    const clampedHeadT = THREE.MathUtils.lerp(
      shot.tStart,
      shot.tEnd,
      Math.min(1, shot.shootProgress),
    );
    const exitPos = pastEnd ? shot.curve.path.getPointAt(clampedHeadT) : null;
    const exitTangent = pastEnd
      ? shot.curve.path.getTangentAt(clampedHeadT).normalize()
      : null;

    for (let i = 0; i < shot.visual.trailSegments.length; i++) {
      const segment = shot.visual.trailSegments[i];
      if (!segment) continue;

      // t1/t2 are normalised positions along the trail (0 = tail, 1 = head)
      // opacity scales with t2 so the tail is transparent and the head is brightest
      const t1 = i / this.trailSteps;
      const t2 = (i + 1) / this.trailSteps;

      const opacity = alpha * t2;

      if (opacity <= 0.01) {
        segment.mesh.visible = false;
        segment.material.opacity = 0;
        continue;
      }

      const p1Progress = THREE.MathUtils.lerp(
        trailProgress,
        shot.shootProgress,
        t1,
      );
      const p2Progress = THREE.MathUtils.lerp(
        trailProgress,
        shot.shootProgress,
        t2,
      );

      const p1 = this.sampleProgress(shot, p1Progress, exitPos, exitTangent);
      const p2 = this.sampleProgress(shot, p2Progress, exitPos, exitTangent);

      this._segDir.subVectors(p2, p1);
      const length = this._segDir.length();

      if (length < 0.0001) {
        segment.mesh.visible = false;
        continue;
      }

      this._segMid.addVectors(p1, p2).multiplyScalar(0.5);

      segment.mesh.position.copy(this._segMid);
      segment.mesh.scale.y = length;
      segment.mesh.quaternion.setFromUnitVectors(
        this._yAxis,
        this._segDir.divideScalar(length),
      );

      segment.material.opacity = Math.min(1, opacity);
      segment.mesh.visible = true;
    }
  }

  /**
   * Samples a world-space position for a given shoot-progress value.
   * Values within 0–1 are sampled from the curve; values beyond 1 are
   * extrapolated linearly using the pre-computed exit position and tangent.
   */
  private sampleProgress(
    shot: ShootingStarState,
    progress: number,
    exitPos: THREE.Vector3 | null,
    exitTangent: THREE.Vector3 | null,
  ): THREE.Vector3 {
    if (progress <= 1) {
      const t = THREE.MathUtils.clamp(
        THREE.MathUtils.lerp(shot.tStart, shot.tEnd, progress),
        0,
        1,
      );
      return shot.curve.path.getPointAt(t);
    }
    const extraDist = (progress - 1) * shot.segmentLength;
    return exitPos!.clone().addScaledVector(exitTangent!, extraDist);
  }

  // Helpers

  private hideShootingStars(): void {
    for (const shot of [...this.activeShots, ...this.fadingShots]) {
      this.disposeShotVisual(shot.visual);
    }
    this.activeShots = [];
    this.fadingShots = [];
  }

  private scheduleNextShot(minDelay: number): void {
    this.nextShotTime = this.elapsed + minDelay + Math.random() * 0.5;
  }

  private estimateCurveSegmentLength(
    curve: Trajectory,
    tStart: number,
    tEnd: number,
  ): number {
    const samples = 24;
    let length = 0;
    let previous = curve.path.getPointAt(tStart);

    for (let i = 1; i <= samples; i++) {
      const t = THREE.MathUtils.lerp(tStart, tEnd, i / samples);
      const point = curve.path.getPointAt(t);
      length += point.distanceTo(previous);
      previous = point;
    }

    return length;
  }

  private randomSpherePoint(
    minRadius: number,
    maxRadius: number,
  ): THREE.Vector3 {
    const dir = this.randomUnitVector();
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    return dir.multiplyScalar(radius);
  }

  private randomUnitVector(): THREE.Vector3 {
    const y = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    return new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
  }
}
