import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

export function CareerCore({ position = [0, 0.2, 0] as [number, number, number] }) {
  const core = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);
  const particles = useRef<THREE.Points>(null);

  const particleGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 240;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 1.6 + Math.random() * 1.6;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.5;
      pos[i * 3 + 2] = r * Math.cos(p);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((_, dt) => {
    if (core.current) {
      core.current.rotation.y += dt * 0.25;
      core.current.rotation.x += dt * 0.1;
    }
    if (ring1.current) ring1.current.rotation.z += dt * 0.4;
    if (ring2.current) ring2.current.rotation.x += dt * 0.3;
    if (ring3.current) ring3.current.rotation.y += dt * 0.5;
    if (particles.current) particles.current.rotation.y += dt * 0.08;
  });

  return (
    <group position={position}>
      <Float floatIntensity={0.4} rotationIntensity={0.15} speed={1.2}>
        <mesh ref={core}>
          <icosahedronGeometry args={[0.75, 2]} />
          <meshStandardMaterial
            color="#f4a15a"
            emissive="#f4a15a"
            emissiveIntensity={1.2}
            roughness={0.25}
            metalness={0.8}
          />
        </mesh>

        <mesh>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshBasicMaterial color="#ffd7a8" transparent opacity={0.35} />
        </mesh>

        <mesh ref={ring1} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.35, 0.02, 16, 96]} />
          <meshBasicMaterial color="#f4a15a" toneMapped={false} />
        </mesh>
        <mesh ref={ring2} rotation={[0, Math.PI / 3, 0]}>
          <torusGeometry args={[1.7, 0.015, 16, 96]} />
          <meshBasicMaterial color="#5eead4" toneMapped={false} />
        </mesh>
        <mesh ref={ring3} rotation={[Math.PI / 4, 0, Math.PI / 6]}>
          <torusGeometry args={[2.05, 0.01, 12, 96]} />
          <meshBasicMaterial color="#a78bfa" toneMapped={false} />
        </mesh>

        <points ref={particles} geometry={particleGeom}>
          <pointsMaterial size={0.03} color="#bef2de" transparent opacity={0.7} sizeAttenuation />
        </points>
      </Float>

      <pointLight position={[0, 0, 0]} intensity={4} color="#f4a15a" distance={8} decay={2} />
    </group>
  );
}
