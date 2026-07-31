import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";

export type CameraKey = {
  t: number;
  pos: [number, number, number];
  look: [number, number, number];
};

/**
 * Camera path untuk seluruh Career Simulation World.
 * Posisi kontinu di sepanjang sumbu -Z sehingga tidak ada teleport
 * kamera yang terlihat; perpindahan ruang jauh disamarkan dark fade.
 */
export const CAMERA_KEYS: CameraKey[] = [
  { t: 0.0, pos: [0, 1.0, 12], look: [0, 0.9, -6] },
  { t: 0.12, pos: [0, 0.9, 2], look: [0, 0.9, -8] },
  { t: 0.2, pos: [0, 0.9, -6], look: [0, 0.9, -20] },
  { t: 0.28, pos: [1.4, 1.0, -19], look: [0, 1.0, -27] },
  { t: 0.36, pos: [-0.6, 0.9, -28], look: [0, 0.9, -38] },
  { t: 0.42, pos: [0, 0.7, -40], look: [0, 0.5, -52] },
  { t: 0.72, pos: [0, 0.7, -76], look: [0, 0.5, -88] },
  { t: 0.8, pos: [0, 0.9, -92], look: [0, 0.8, -101] },
  { t: 0.88, pos: [1.1, 1.0, -100], look: [0, 0.8, -108] },
  { t: 1.0, pos: [0, 1.1, -113], look: [0, 0.9, -121] },
];

function sample(
  keys: CameraKey[],
  t: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  let i = 0;
  while (i < keys.length - 2 && clamped > keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const k = THREE.MathUtils.clamp((clamped - a.t) / (b.t - a.t), 0, 1);
  const e = k * k * (3 - 2 * k);
  outPos.set(
    THREE.MathUtils.lerp(a.pos[0], b.pos[0], e),
    THREE.MathUtils.lerp(a.pos[1], b.pos[1], e),
    THREE.MathUtils.lerp(a.pos[2], b.pos[2], e),
  );
  outLook.set(
    THREE.MathUtils.lerp(a.look[0], b.look[0], e),
    THREE.MathUtils.lerp(a.look[1], b.look[1], e),
    THREE.MathUtils.lerp(a.look[2], b.look[2], e),
  );
}

type Props = {
  progressRef: MutableRefObject<number>;
  isMobile: boolean;
  reducedMotion: boolean;
};

export function SceneDirector({ progressRef, isMobile, reducedMotion }: Props) {
  const { camera, pointer, scene } = useThree();

  // Temporary vectors — tidak pernah dibuat ulang tiap frame.
  const targetPos = useRef(new THREE.Vector3()).current;
  const targetLook = useRef(new THREE.Vector3()).current;
  const currentLook = useRef(new THREE.Vector3(0, 0.9, -6)).current;

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = progressRef.current;

    sample(CAMERA_KEYS, t, targetPos, targetLook);

    if (!isMobile && !reducedMotion) {
      targetPos.x += pointer.x * 0.22;
      targetPos.y += pointer.y * 0.12;
    }

    const smooth = reducedMotion ? 12 : 3.2;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.x, smooth, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.y, smooth, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.z, smooth, dt);

    currentLook.x = THREE.MathUtils.damp(currentLook.x, targetLook.x, smooth, dt);
    currentLook.y = THREE.MathUtils.damp(currentLook.y, targetLook.y, smooth, dt);
    currentLook.z = THREE.MathUtils.damp(currentLook.z, targetLook.z, smooth, dt);
    camera.lookAt(currentLook);

    // Fog menutup rapat di ruang transisi, membuka di dalam ruangan.
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      const tight = t > 0.36 && t < 0.44 ? 1 : 0;
      fog.near = THREE.MathUtils.damp(fog.near, tight ? 1 : 6, 2, dt);
      fog.far = THREE.MathUtils.damp(fog.far, tight ? 26 : 52, 2, dt);
    }
  });

  return null;
}
