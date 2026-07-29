import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

type Component3D = { id: string; label: string; broken: boolean };

function Panel({
  position,
  label,
  broken,
  selected,
  onClick,
}: {
  position: [number, number, number];
  label: string;
  broken: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useFrame((_, dt) => {
    if (mesh.current && broken) {
      mesh.current.rotation.z = Math.sin(performance.now() * 0.002) * 0.06;
    }
  });

  const color = selected ? "#0891B2" : hovered ? "#c9884a" : broken ? "#8a4a2a" : "#3a3a44";
  return (
    <group position={position}>
      <Float floatIntensity={selected ? 0.8 : 0.2} rotationIntensity={0.1} speed={1.2}>
        <mesh
          ref={mesh}
          onClick={onClick}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        >
          <boxGeometry args={[1.6, 1, 0.08]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.4 : 0.1} metalness={0.5} roughness={0.4} />
        </mesh>
        <Html center distanceFactor={8} position={[0, 0, 0.06]} style={{ pointerEvents: "none" }}>
          <div className="font-mono-cl text-[10px] uppercase tracking-widest text-ink whitespace-nowrap">
            {label}
          </div>
        </Html>
      </Float>
    </group>
  );
}

export function MissionScene({
  components,
  selectedId,
  onSelect,
}: {
  components: Component3D[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 1.5, 6], fov: 45 }} style={{ width: "100%", height: "100%" }}>
      <color attach="background" args={["#F8FAFC"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 4, 3]} intensity={1.6} color="#ffb27a" />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#6ea0ff" />
      {/* monitor frame */}
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[7, 4.4, 0.1]} />
        <meshStandardMaterial color="#111114" metalness={0.6} roughness={0.5} />
      </mesh>
      {components.map((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <Panel
            key={c.id}
            position={[col === 0 ? -1.6 : 1.6, 0.7 - row * 1.4, 0.1]}
            label={c.label}
            broken={c.broken}
            selected={selectedId === c.id}
            onClick={() => onSelect(c.id)}
          />
        );
      })}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}
