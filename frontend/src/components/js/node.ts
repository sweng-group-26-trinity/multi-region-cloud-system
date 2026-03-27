import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

type NodeSide = "left" | "right";

/**
 * Converts geographic latitude and longitude coordinates into a 3D position
 * on a sphere surface.
 *
 * The conversion assumes:
 * - Y axis is the polar axis (north/south)
 * - Radius is measured from the sphere center
 * - Latitude is in degrees (-90 to 90)
 * - Longitude is in degrees (-180 to 180)
 *
 * @param lat - Latitude in degrees.
 * @param lon - Longitude in degrees.
 * @param radius - Sphere radius.
 * @returns {THREE.Vector3} Cartesian coordinates on the sphere surface.
 */
function latLonToVector3(
  lat: number,
  lon: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Returns whether the current viewport should be treated as mobile-sized.
 *
 * @returns True when viewport width is below 640px.
 */
function isMobileViewport() {
  return window.innerWidth < 640;
}

/**
 * Represents an interactive button displayed inside a Node label.
 */
export interface NodeButton {
  /**
   * Text displayed on the button.
   */
  label: string;

  /**
   * Click handler executed when the button is pressed.
   */
  onClick: () => void;
}

/**
 * Configuration options used when creating a Node.
 */
export interface NodeOptions {
  /**
   * Optional side alignment of the label.
   * Currently reserved for future layout logic.
   * @default "right"
   */
  side?: "left" | "right";

  /**
   * Title displayed at the top of the label.
   * @default "Node"
   */
  title?: string;

  /**
   * Secondary descriptive text displayed below the title.
   */
  description?: string;

  /**
   * Optional interactive buttons displayed inside the label.
   */
  buttons?: NodeButton[];

  /**
   * Geographic latitude on Earth surface.
   */
  lat: number;

  /**
   * Geographic longitude on Earth surface.
   */
  lon: number;

  /**
   * Distance from Earth surface to floating label in world units.
   * Reduced automatically on mobile for better screen fit.
   * @default 6
   */
  floatDistance?: number;
}

/**
 * Node
 * ----
 * Represents an interactive geographic marker attached to a rotating Earth object.
 *
 * Features:
 * - Anchors to Earth using latitude/longitude coordinates
 * - Renders a glowing 3D marker on the surface
 * - Displays a floating CSS2D label
 * - Draws a dashed line connecting marker to label
 * - Smooth floating animation along radial direction
 * - Supports interactive buttons inside the label
 *
 * The marker is attached as a child of the Earth object,
 * ensuring it rotates naturally with the globe.
 *
 * The label floats outward from the Earth's surface
 * and animates smoothly over time.
 *
 * On mobile viewports, the label is kept closer to the globe and
 * given a smaller floating animation so it stays on screen.
 *
 * @example
 * const node = new Node(scene, earth, {
 *   title: "Europe",
 *   description: "Server: EU-West-1",
 *   lat: 51,
 *   lon: 10,
 *   floatDistance: 4,
 *   buttons: [
 *     { label: "Connect", onClick: () => console.log("Connecting...") }
 *   ]
 * });
 */
export class Node {
  private scene: THREE.Scene;
  private earth: THREE.Object3D;
  private labelObject: CSS2DObject;
  private marker: THREE.Mesh;
  private line: THREE.Line;
  private basePosition: THREE.Vector3;
  private floatOffset: number;
  private floatDistance: number;
  private mobile: boolean;

  /**
   * Creates a new floating geographic node.
   *
   * @param scene - The Three.js scene where label and line are added.
   * @param earth - The Earth object used as positional reference.
   * @param options - Configuration for geographic location and UI content.
   */
  constructor(scene: THREE.Scene, earth: THREE.Object3D, options: NodeOptions) {
    const {
      side = "right",
      title = "Node",
      description = "",
      buttons = [],
      lat,
      lon,
      floatDistance = 6,
    } = options;

    this.scene = scene;
    this.earth = earth;
    this.mobile = isMobileViewport();
    this.floatOffset = Math.random() * 10;
    this.floatDistance = this.mobile
      ? Math.min(floatDistance, 3.5)
      : floatDistance;

    this.marker = this.createMarker(lat, lon);

    const markerWorld = new THREE.Vector3();
    this.marker.getWorldPosition(markerWorld);

    const earthWorld = new THREE.Vector3();
    this.earth.getWorldPosition(earthWorld);
    const direction = markerWorld.clone().sub(earthWorld).normalize();

    this.basePosition = markerWorld
      .clone()
      .add(direction.multiplyScalar(this.floatDistance));

    this.labelObject = this.createLabel(title, description, buttons, side);
    this.line = this.createDottedLine();

    this.scene.add(this.labelObject);
    this.scene.add(this.line);
  }

  /**
   * Creates the floating HTML label used for the node UI.
   *
   * Styling is responsive so the label remains usable on smaller screens.
   * Mobile layouts use a smaller width and reduced sideways offset.
   *
   * @param title - Primary title text.
   * @param description - Secondary description text.
   * @param buttons - Interactive buttons shown inside the label.
   * @param side - Optional side alignment hint.
   * @returns The constructed CSS2D label object.
   */
  private createLabel(
    title: string,
    description: string,
    buttons: NodeButton[],
    side: NodeSide,
  ) {
    const mobile = isMobileViewport();

    const div = document.createElement("div");
    div.style.background = "rgba(255,255,255,0.96)";
    div.style.backdropFilter = "blur(8px)";
    (div.style as any).webkitBackdropFilter = "blur(8px)";
    div.style.padding = mobile ? "10px 12px" : "12px 16px";
    div.style.borderRadius = mobile ? "14px" : "12px";
    div.style.fontSize = mobile ? "12px" : "14px";
    div.style.color = "black";
    div.style.boxShadow = "0 10px 28px rgba(0,0,0,0.22)";
    div.style.pointerEvents = "auto";
    div.style.width = mobile ? "148px" : "190px";
    div.style.maxWidth = mobile ? "42vw" : "190px";
    div.style.minWidth = mobile ? "148px" : "170px";
    div.style.border = "1px solid rgba(15,23,42,0.06)";

    const sideOffset = mobile
      ? side === "left"
        ? -6
        : 0
      : side === "left"
        ? -18
        : 18;

    const globalShift = mobile ? -50 : 0;

    div.style.transform = `translateX(${sideOffset + globalShift}px)`;

    const titleEl = document.createElement("div");
    titleEl.style.fontWeight = "700";
    titleEl.style.fontSize = mobile ? "11px" : "15px";
    titleEl.style.lineHeight = "1.2";
    titleEl.style.marginBottom = description ? "4px" : "0";
    titleEl.style.color = "#0f172a";
    titleEl.style.wordBreak = "break-word";
    titleEl.textContent = title;
    div.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement("div");
      descEl.style.fontSize = mobile ? "10px" : "12px";
      descEl.style.color = "#64748b";
      descEl.style.lineHeight = "1.35";
      descEl.style.marginBottom =
        buttons.length > 0 ? (mobile ? "8px" : "10px") : "0";
      descEl.style.wordBreak = "break-word";
      descEl.textContent = description;
      div.appendChild(descEl);
    }

    if (buttons.length > 0) {
      const buttonContainer = document.createElement("div");
      buttonContainer.style.display = "flex";
      buttonContainer.style.gap = mobile ? "6px" : "8px";
      buttonContainer.style.marginTop = mobile ? "6px" : "8px";
      buttonContainer.style.flexWrap = "wrap";

      buttons.forEach((btn) => {
        const button = document.createElement("button");
        button.textContent = btn.label;
        button.style.padding = mobile ? "6px 10px" : "7px 12px";
        button.style.border = "none";
        button.style.borderRadius = mobile ? "8px" : "6px";
        button.style.background = "#1e293b";
        button.style.color = "white";
        button.style.cursor = "pointer";
        button.style.fontSize = mobile ? "10px" : "12px";
        button.style.fontWeight = "600";
        button.style.lineHeight = "1";
        button.style.flex = mobile ? "1 1 auto" : "0 0 auto";
        button.style.minWidth = mobile ? "0" : "auto";
        button.style.whiteSpace = "nowrap";
        button.style.transition = "background 0.2s ease, transform 0.2s ease";

        button.onmouseover = () => {
          button.style.background = "#334155";
        };

        button.onmouseout = () => {
          button.style.background = "#1e293b";
          button.style.transform = "scale(1)";
        };

        button.onmousedown = () => {
          button.style.transform = "scale(0.98)";
        };

        button.onmouseup = () => {
          button.style.transform = "scale(1)";
        };

        button.onclick = (e) => {
          e.stopPropagation();
          btn.onClick();
        };

        buttonContainer.appendChild(button);
      });

      div.appendChild(buttonContainer);
    }

    const label = new CSS2DObject(div);
    label.position.copy(this.basePosition);
    if (mobile && side === "right") {
      label.position.x -= 5.0;
    }
    return label;
  }

  /**
   * Creates a glowing marker attached to the Earth surface.
   *
   * @param lat - Geographic latitude.
   * @param lon - Geographic longitude.
   * @returns The marker mesh.
   */
  private createMarker(lat: number, lon: number) {
    const geometry = new THREE.SphereGeometry(0.04, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xffaa00,
      emissiveIntensity: 1.5,
    });

    const marker = new THREE.Mesh(geometry, material);
    const localPos = latLonToVector3(lat, lon, 1.0);
    marker.position.copy(localPos);

    this.earth.add(marker);
    return marker;
  }

  /**
   * Creates the dashed line connecting marker and label.
   *
   * @returns The dashed line object.
   */
  private createDottedLine() {
    const material = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 0.5,
      gapSize: 0.3,
    });

    const geometry = new THREE.BufferGeometry();
    return new THREE.Line(geometry, material);
  }

  /**
   * Updates node position and animation.
   *
   * Should be called every frame inside the main animation loop.
   *
   * Responsibilities:
   * - Recalculates world position of marker
   * - Keeps label positioned outward from Earth's surface
   * - Applies floating animation along radial direction
   * - Updates dashed connection line geometry
   *
   * Mobile viewports use a smaller float amount so labels do not drift
   * too far in and out of the visible screen area.
   *
   * @param _time - Time value (typically based on elapsed time or Date.now()).
   */
  public update(_time: number) {
    const mobile = isMobileViewport();

    const markerWorld = new THREE.Vector3();
    this.marker.getWorldPosition(markerWorld);

    const earthWorld = new THREE.Vector3();
    this.earth.getWorldPosition(earthWorld);
    const direction = markerWorld.clone().sub(earthWorld).normalize();

    const effectiveFloatDistance = mobile
      ? Math.min(this.floatDistance, 3.5)
      : this.floatDistance;

    this.basePosition = markerWorld
      .clone()
      .add(direction.multiplyScalar(effectiveFloatDistance));

    const floatAmount = mobile ? 0.22 : 0.8;
    const floatY = Math.sin(_time + this.floatOffset) * floatAmount;

    const newPos = this.basePosition.clone();
    newPos.add(direction.multiplyScalar(floatY));
    this.labelObject.position.copy(newPos);

    const labelWorld = new THREE.Vector3();
    this.labelObject.getWorldPosition(labelWorld);

    const positions = new Float32Array([
      markerWorld.x,
      markerWorld.y,
      markerWorld.z,
      labelWorld.x,
      labelWorld.y,
      labelWorld.z,
    ]);

    this.line.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    this.line.computeLineDistances();
  }
}
