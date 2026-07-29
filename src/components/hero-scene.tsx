import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Panels() {
  const group = useRef<THREE.Group>(null);
  const panels = useMemo(() => {
    const arr: { pos: [number, number, number]; rot: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      arr.push({
        pos: [Math.cos(angle) * 2.6, (i % 2 === 0 ? 0.4 : -0.4), Math.sin(angle) * 2.6],
        rot: [0, -angle + Math.PI / 2, 0],
        scale: 0.9 + (i % 3) * 0.15,
      });
    }
    return arr;
  }, []);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.15;
  });
  return (
    <group ref={group}>
      {panels.map((p, i) => (
        <Float key={i} floatIntensity={0.6} rotationIntensity={0.2} speed={1 + i * 0.1}>
          <mesh position={p.pos} rotation={p.rot} scale={p.scale}>
            <planeGeometry args={[1.2, 1.6]} />
            <meshStandardMaterial
              color="#0891B2"
              transparent
              opacity={0.15}
              emissive="#0891B2"
              emissiveIntensity={0.3}
              side={THREE.DoubleSide}
              wireframe={i % 3 === 0}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Core() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (mesh.current) {
      mesh.current.rotation.x += dt * 0.3;
      mesh.current.rotation.y += dt * 0.4;
    }
  });
  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1, 3]} />
      <MeshDistortMaterial color="#0891B2" distort={0.35} speed={1.5} roughness={0.2} metalness={0.7} />
    </mesh>
  );
}

export function HeroScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 6], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#F8FAFC"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#ffb27a" />
      <pointLight position={[-5, -3, -3]} intensity={1} color="#5a8dff" />
      <Core />
      <Panels />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
    </Canvas>
  );
}
