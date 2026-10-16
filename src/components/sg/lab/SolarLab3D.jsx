import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTS, partByKey } from "@/lib/lab-parts";
import { buildHouse } from "@/lib/lab-house";
import { IssueIllustration } from "@/components/sg/lab/IssueIllustration";

const START = { y: 0.55, x: 0.06 };
const VIEW = { distance: 11.6, min: 7, max: 28 };
const DIRECTION = new THREE.Vector3(6.6, 4, 8).normalize();

/** Wide screens look at the house from close up; narrow ones stand back so nothing is cut off. */
const fitDistance = (aspect) => Math.max(VIEW.distance, 13.6 / Math.max(aspect, 0.5));

/** What the labels say, which part each follows, and how far it sits from it. */
const LABELS = [
  { key: "sunlight", text: "Sunlight", sun: true, dx: 0, dy: -18 },
  { key: "panels", text: "Solar panels", dx: 0, dy: -20 },
  { key: "inverter", text: "Inverter", dx: -34, dy: -8 },
  { key: "battery", text: "Battery", dx: -34, dy: 12 },
  { key: "home", text: "Your home", dx: 30, dy: -14 },
];

function selectedMaterial(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2, emissive: new THREE.Color(0xf4c542), emissiveIntensity: 0.45 });
}

/** A home installation you can turn around: tap a part to read what it does and what to check safely. */
export default function SolarLab3D() {
  const mountRef = useRef(null);
  const apiRef = useRef({});
  const [selected, setSelected] = useState("surface");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
    camera.position.copy(DIRECTION).multiplyScalar(VIEW.distance);
    camera.lookAt(0, 1.9, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9cc78a, 0.4));
    const sunLight = new THREE.DirectionalLight(0xfff3cd, 1.05);
    sunLight.position.set(6, 9, 7);
    scene.add(sunLight);

    const group = new THREE.Group();
    scene.add(group);

    const named = {};
    const add = (key, mesh, parent) => {
      mesh.userData.part = key;
      mesh.userData.baseMaterial = mesh.material;
      mesh.userData.selectedMaterial = selectedMaterial(mesh.material?.color?.getHex?.() ?? 0xffffff);
      mesh.castShadow = false;
      (parent ?? group).add(mesh);
      named[key] = named[key] ?? [];
      named[key].push(mesh);
      return mesh;
    };
    const decor = (mesh, parent) => (parent ?? group).add(mesh);

    const { anchors } = buildHouse(group, { add, decor });

    /* Labels pinned to the parts, so the picture reads on its own while you turn it. */
    const overlay = document.createElement("div");
    overlay.className = "pointer-events-none absolute inset-0 overflow-hidden";
    mount.appendChild(overlay);
    const labelNodes = LABELS.map(({ key, text, sun, dx, dy }) => {
      const el = document.createElement("div");
      el.className = sun
        ? "absolute left-0 top-0 whitespace-nowrap rounded-full border border-sun/60 bg-sun px-2.5 py-1 text-[11px] font-semibold text-sun-foreground shadow-soft transition-opacity"
        : "absolute left-0 top-0 whitespace-nowrap rounded-full border border-primary/25 bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-soft transition-opacity";
      el.textContent = text;
      el.style.opacity = "0";
      overlay.appendChild(el);
      return { el, object: anchors[key], dx, dy };
    });

    const projected = new THREE.Vector3();
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    const updateLabels = () => {
      const width = renderer.domElement.clientWidth;
      const height = renderer.domElement.clientHeight;
      labelNodes.forEach(({ el, object, dx, dy }) => {
        if (!object) return;
        object.getWorldPosition(projected);
        projected.project(camera);
        const behind = projected.z > 1;
        el.style.opacity = behind ? "0" : "1";
        if (behind) return;
        // kept inside the frame, so a label never slides off the edge on a narrow screen
        const x = clamp((projected.x * 0.5 + 0.5) * width + dx, 46, Math.max(46, width - 46));
        const y = clamp((-projected.y * 0.5 + 0.5) * height + dy, 16, Math.max(16, height - 16));
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      });
    };

    const render = () => {
      renderer.render(scene, camera);
      updateLabels();
    };

    const applyHighlight = (key) => {
      Object.entries(named).forEach(([partKey, meshes]) => {
        meshes.forEach((mesh) => {
          mesh.material = partKey === key ? mesh.userData.selectedMaterial : mesh.userData.baseMaterial;
        });
      });
      render();
    };

    // turn it by dragging
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    const rotation = { y: START.y, x: START.x };

    const applyRotation = () => {
      group.rotation.y = rotation.y;
      group.rotation.x = rotation.x;
      render();
    };
    applyRotation();

    const onPointerDown = (event) => {
      dragging = true;
      moved = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.style.cursor = "grabbing";
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      rotation.y += dx * 0.008;
      rotation.x = Math.max(-0.35, Math.min(0.5, rotation.x + dy * 0.004));
      applyRotation();
    };
    const onPointerUp = (event) => {
      if (!dragging) return;
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      if (moved > 8) return; // it was a drag, not a tap
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(group.children, true);
      const hit = hits.find((h) => h.object.userData?.part);
      if (hit) setSelected(hit.object.userData.part);
    };
    const onWheel = (event) => {
      event.preventDefault();
      const next = camera.position.length() + event.deltaY * 0.0035;
      camera.position.setLength(Math.max(VIEW.min, Math.min(VIEW.max, next)));
      render();
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      const width = mount.clientWidth || 320;
      const height = mount.clientHeight || 260;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.position.copy(DIRECTION).multiplyScalar(fitDistance(camera.aspect));
      render();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    apiRef.current = {
      applyHighlight,
      reset: () => {
        rotation.y = START.y;
        rotation.x = START.x;
        camera.position.copy(DIRECTION).multiplyScalar(fitDistance(camera.aspect));
        applyRotation();
      },
    };

    return () => {
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      apiRef.current = {};
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      if (overlay.parentNode === mount) mount.removeChild(overlay);
    };
  }, []);

  useEffect(() => {
    apiRef.current.applyHighlight?.(selected);
  }, [selected]);

  const part = partByKey(selected);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-sun/10 to-transparent">
        <div ref={mountRef} className="relative h-72 w-full sm:h-96" />
        <div className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
          Drag to turn · pinch or scroll to zoom · tap a part
        </div>
        <Button type="button" variant="ghost" size="sm" className="absolute right-3 top-3 bg-card/90" onClick={() => apiRef.current.reset?.()}>
          <RotateCcw className="h-4 w-4" /> Reset view
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PARTS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setSelected(p.key)}
            aria-pressed={selected === p.key}
            className={
              selected === p.key
                ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            }
          >
            {p.name.split(" (")[0]}
          </button>
        ))}
      </div>

      <div className="card-soft grid gap-4 p-5 sm:grid-cols-[9rem,1fr]">
        <IssueIllustration kind={part.illustration} />
        <div>
          <h3 className="font-display text-lg font-bold">{part.name}</h3>
          <p className="mt-2 text-sm">{part.plain}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong className="text-foreground">What can go wrong:</strong> {part.issue}
          </p>
          <p className="mt-2 rounded-xl bg-ok-soft px-3 py-2 text-sm">
            <strong>Safe next step:</strong> {part.safeStep}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This model is for learning and orientation only. It cannot reveal hidden defects, and it is not a certified inspection.
      </p>
    </div>
  );
}