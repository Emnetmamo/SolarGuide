import * as THREE from "three";

/**
 * The little house from the reference picture: a roof array, the cable run down the wall,
 * an inverter and a battery, and a cut-away home so you can see where the power goes.
 * Everything is built in one place so the rotation, the tap targets and the labels agree.
 */

const WALL = 0xf7f4ea;
const ROOF = 0x8d949c;
const RIDGE = 0x7c838a;
const PANEL = 0x1f5fd0;
const PANEL_CELL = 0x143f8c;
const FRAME = 0xa9b1b9;
const BOX_WHITE = 0xf6f8f7;
const APPLIANCE = 0xeef1f2;
const DARK = 0x2b2f36;
const YELLOW = 0xffc22e;
const GRASS = 0x9cc78a;
const WOOD = 0xb98d5f;

const HW = 2.6; // half width (x)
const HD = 1.8; // half depth (z)
const H = 2.4; // wall height
const RISE = 1.3; // height of the ridge above the walls
const T = 0.16; // wall thickness
export const PITCH = Math.atan2(RISE, HD); // roof angle
export const SLOPE = Math.hypot(HD, RISE); // length of one roof slope

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.12, ...extra });
}

function box(w, h, d, color, extra) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
}

function ball(r, color, extra) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat(color, extra));
}

/** A straight piece of conduit between two points. */
function tube(from, to, radius = 0.05, color = YELLOW) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), 10), mat(color, { roughness: 0.5 }));
  mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

/** A yellow arrow showing which way the energy flows. */
function arrow(from, to, radius = 0.06, color = YELLOW) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const shaftLen = Math.max(0.14, dir.length() - 0.3);
  const group = new THREE.Group();
  const glow = { emissive: new THREE.Color(color), emissiveIntensity: 0.3, roughness: 0.4 };
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, shaftLen, 10), mat(color, glow));
  shaft.position.y = shaftLen / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(radius * 2.3, 0.3, 14), mat(color, glow));
  head.position.y = shaftLen + 0.15;
  group.add(shaft, head);
  group.position.copy(a);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return group;
}

export function buildHouse(group, { add, decor }) {
  const anchors = {};
  const at = (mesh, x, y, z) => {
    mesh.position.set(x, y, z);
    return mesh;
  };
  const part = (key, mesh, parent) => add(key, mesh, parent);
  const plain = (mesh, parent) => decor(mesh, parent);
  const anchor = (key, x, y, z) => {
    const holder = new THREE.Object3D();
    holder.position.set(x, y, z);
    group.add(holder);
    anchors[key] = holder;
  };

  /* ------------------------------- the yard ------------------------------- */

  const lawn = new THREE.Mesh(new THREE.CircleGeometry(7.5, 56), mat(GRASS, { roughness: 1 }));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = -0.02;
  plain(lawn);

  plain(at(box(1.3, 0.05, 2.5, 0xdcd8cc, { roughness: 0.95 }), 0.9, 0.02, 3.2));

  for (let i = 0; i <= 8; i += 1) plain(at(box(0.12, 1, 0.12, WOOD), -3.4 + i * 0.85, 0.5, -3.7));
  plain(at(box(7, 0.12, 0.07, 0xcaa072), 0, 0.78, -3.7));
  plain(at(box(7, 0.12, 0.07, 0xcaa072), 0, 0.44, -3.7));

  [[-2.7, 2.4], [-2.2, 2.7], [2.7, 2.4], [2.2, 2.7]].forEach(([x, z]) => {
    plain(at(ball(0.34, 0x4f8f53, { roughness: 0.9 }), x, 0.28, z));
  });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.8, 14), mat(0x6b4b2a));
  part("shade", at(trunk, -4.3, 0.9, 1.4));
  part("shade", at(ball(1, 0x3f7f4f, { roughness: 0.85 }), -4.3, 2.4, 1.4));

  /* --------------------------- the house and roof -------------------------- */

  plain(at(box(2 * HW - 0.2, 0.1, 2 * HD - 0.2, 0xd8c39a), 0, 0.05, 0)); // floor
  plain(at(box(2 * HW, H, T, WALL), 0, H / 2, -HD + T / 2)); // back wall
  plain(at(box(T, H, 2 * HD, WALL), -HW + T / 2, H / 2, 0)); // left wall
  plain(at(box(T, H, 2 * HD, WALL), HW - T / 2, H / 2, 0)); // right wall
  // The front is left open, the same cut-away as the picture, so the inside stays visible.

  const gable = new THREE.Shape();
  gable.moveTo(-HD, 0);
  gable.lineTo(HD, 0);
  gable.lineTo(0, RISE);
  gable.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gable, { depth: T, bevelEnabled: false });
  [-HW, HW - T].forEach((x) => {
    const g = new THREE.Mesh(gableGeo, mat(WALL));
    g.rotation.y = Math.PI / 2;
    g.position.set(x, H, 0);
    plain(g);
  });

  const front = at(box(2 * HW + 0.5, 0.16, SLOPE, ROOF, { roughness: 0.85 }), 0, H + RISE / 2, HD / 2);
  front.rotation.x = PITCH;
  plain(front);
  const back = at(box(2 * HW + 0.5, 0.16, SLOPE, ROOF, { roughness: 0.85 }), 0, H + RISE / 2, -HD / 2);
  back.rotation.x = -PITCH;
  plain(back);
  plain(at(box(2 * HW + 0.5, 0.14, 0.26, RIDGE), 0, H + RISE + 0.02, 0));

  /* ------------------------- the array on the roof ------------------------- */

  const array = new THREE.Group();
  array.position.set(0, H + RISE / 2, HD / 2);
  array.rotation.x = PITCH;
  group.add(array);

  [-1.23, -0.41, 0.41, 1.23].forEach((x) => {
    [-0.44, 0.44].forEach((z) => {
      part("frame", at(box(0.84, 0.05, 0.86, FRAME), x, 0.1, z), array);
      part("surface", at(box(0.78, 0.06, 0.8, PANEL, { roughness: 0.24, metalness: 0.35 }), x, 0.15, z), array);
      plain(at(box(0.62, 0.02, 0.64, PANEL_CELL, { roughness: 0.2, metalness: 0.4 }), x, 0.19, z), array);
    });
  });
  [-0.66, 0, 0.66].forEach((z) => part("frame", at(box(3.4, 0.08, 0.1, FRAME), 0, 0.05, z), array));
  part("junction", at(box(0.42, 0.22, 0.28, DARK), 1.75, 0.32, -0.84), array);

  /* ------------------ the cable run, inverter and battery ------------------ */

  // Along the left edge of the roof, in the same tilted frame as the array.
  part("cables", tube([-2.15, 0.2, -0.9], [-2.15, 0.2, 1.05], 0.05), array);

  const run = [
    [-2.15, 2.63, 1.84],
    [-2.74, 2.46, 1.2],
    [-2.74, 1.99, 0.78],
  ];
  run.slice(1).forEach((point, i) => part("cables", tube(run[i], point, 0.05)));
  part("cables", tube([-2.74, 1.99, 0.78], [-2.74, 1.3, 0.12], 0.045));
  part("cables", tube([-2.74, 1.3, 0.12], [-2.74, 1.18, -0.4], 0.045));

  part("inverter", at(box(0.2, 0.62, 0.46, BOX_WHITE, { roughness: 0.45 }), -2.79, 1.66, 0.75));
  part("inverter", at(box(0.05, 0.2, 0.3, 0x33544f, { roughness: 0.3 }), -2.9, 1.74, 0.75));
  part("inverter", at(ball(0.035, 0x3ad07a, { emissive: 0x2bbf6a, emissiveIntensity: 0.8 }), -2.89, 1.52, 0.75));

  part("battery", at(box(0.28, 1, 0.68, BOX_WHITE, { roughness: 0.5 }), -2.82, 0.62, -0.45));
  part("battery", at(box(0.03, 0.44, 0.03, 0x3ad07a, { emissive: 0x2bbf6a, emissiveIntensity: 0.55 }), -2.97, 1.02, -0.45));

  const b1 = part("battery", at(box(0.03, 0.2, 0.08, 0x22c06a, { emissive: 0x18a556, emissiveIntensity: 0.5 }), -2.97, 0.66, -0.45));
  b1.rotation.x = 0.5;
  const b2 = part("battery", at(box(0.03, 0.2, 0.08, 0x22c06a, { emissive: 0x18a556, emissiveIntensity: 0.5 }), -2.97, 0.5, -0.45));
  b2.rotation.x = -0.5;

  /* ------------------------ the home, cut open ---------------------------- */

  part("home", at(box(1.3, 0.28, 0.66, 0x5d7fa8, { roughness: 0.8 }), 1.1, 0.24, 1.1)); // sofa seat
  part("home", at(box(1.3, 0.46, 0.16, 0x52739a, { roughness: 0.8 }), 1.1, 0.48, 1.36)); // sofa back
  part("home", at(box(1.8, 0.02, 1.1, 0xded0b4, { roughness: 0.95 }), 1.05, 0.11, 0.5)); // rug
  part("home", at(box(0.94, 0.06, 0.46, 0xb98a5a), 1.05, 0.52, 0.35)); // table top
  part("home", at(box(0.14, 0.44, 0.14, 0x9c7047), 1.05, 0.3, 0.35)); // table leg
  part("home", at(box(0.9, 0.5, 0.06, DARK), 1, 1.45, -1.6)); // television
  part("home", at(box(0.62, 1.3, 0.62, APPLIANCE, { roughness: 0.5 }), -1.35, 0.75, -1.3)); // fridge
  part("home", at(box(1.1, 0.86, 0.55, 0xccd4d7, { roughness: 0.6 }), -0.3, 0.53, -1.35)); // counter
  part("home", at(box(0.5, 0.04, 0.44, DARK), -0.3, 0.98, -1.35)); // hob

  const lamp = new THREE.PointLight(0xfff1cf, 0.9, 8);
  lamp.position.set(0.6, 2.1, 0.2);
  plain(lamp);

  /* ----------------------------- the energy ------------------------------- */

  plain(at(ball(0.6, 0xffd75e, { emissive: 0xffc22e, emissiveIntensity: 0.85, roughness: 0.4 }), -4.4, 5, 2));
  const halo = at(new THREE.Mesh(new THREE.SphereGeometry(0.95, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.2, depthWrite: false })), -4.4, 5, 2);
  plain(halo);

  plain(arrow([-3.75, 4.55, 1.9], [-2.05, 3.8, 1.55]));
  plain(arrow([-2.35, 1.95, 0.62], [-1.15, 1.72, 0.2]));
  plain(arrow([-2.32, 1, -0.35], [-1.2, 0.95, -0.45]));
  plain(arrow([-0.3, 1.3, -1.15], [0.55, 1.4, -1.5]));

  /* --------------------------- label anchors ------------------------------ */

  anchor("sunlight", -4.4, 5, 2);
  anchor("panels", 0, 3.55, 1.05);
  anchor("inverter", -2.95, 1.66, 0.75);
  anchor("battery", -2.95, 0.62, -0.45);
  anchor("home", 1, 2.35, 0.2);

  return { anchors, array };
}