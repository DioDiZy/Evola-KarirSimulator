import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshReflectorMaterial, Text, Line, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";

export type MapEpisode = {
  id: string;
  name: string;
  synopsis: string | null;
  career_credit_reward: number;
  level_id: string;
};
export type MapLevel = { id: string; name: string; status: string; description: string | null };

const ACCENT = "#f4a15a";
const CYAN = "#5eead4";
const VIOLET = "#a78bfa";

type Node = {
  ep: MapEpisode;
  levelIdx: number;
  levelName: string;
  position: [number, number, number];
  done: boolean;
  locked: boolean;
  color: string;
};

function EpisodeNode({
  node,
  onSelect,
  selectedId,
  fading,
}: {
  node: Node;
  onSelect: (n: Node) => void;
  selectedId: string | null;
  fading: boolean;
}) {
  const g = useRef<THREE.Group>(null);
  const hex = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const selected = selectedId === node.ep.id;

  useFrame((_, dt) => {
    if (!g.current) return;
    const targetY = node.position[1] + (hover && !node.locked ? 0.2 : 0);
    g.current.position.y = THREE.MathUtils.damp(g.current.position.y, targetY, 4, dt);
    const s = THREE.MathUtils.damp(g.current.scale.x, selected ? 1.25 : hover ? 1.08 : 1, 5, dt);
    g.current.scale.setScalar(s);
    if (hex.current) {
      hex.current.rotation.y += dt * (hover ? 1.5 : 0.4);
      const mat = hex.current.material as THREE.MeshStandardMaterial;
      const target = node.done ? 1.4 : hover && !node.locked ? 1.6 : 0.55;
      mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, target, 4, dt);
    }
  });

  return (
    <group ref={g} position={node.position}>
      <Float floatIntensity={0.3} rotationIntensity={0.1} speed={1} enabled={!selected}>
        <mesh
          ref={hex}
          castShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!node.locked) {
              setHover(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = "auto";
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!node.locked) onSelect(node);
          }}
        >
          <cylinderGeometry args={[0.55, 0.55, 0.18, 6]} />
          <meshStandardMaterial
            color={node.locked ? "#1a2030" : "#0a1420"}
            emissive={node.locked ? "#334155" : node.color}
            emissiveIntensity={0.55}
            metalness={0.65}
            roughness={0.25}
            transparent={fading && !selected}
            opacity={fading && !selected ? 0.15 : 1}
          />
        </mesh>

        {/* Halo ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <torusGeometry args={[0.7, 0.01, 10, 64]} />
          <meshBasicMaterial color={node.locked ? "#475569" : node.color} toneMapped={false} />
        </mesh>

        {/* Number/status pip */}
        <Text position={[0, 0.12, 0]} fontSize={0.22} anchorX="center" anchorY="middle" color="#f7f2e8" rotation={[-Math.PI / 2, 0, 0]}>
          {node.done ? "✓" : node.locked ? "•" : "→"}
        </Text>

        <Text
          position={[0, 0.55, 0]}
          fontSize={0.12}
          maxWidth={1.6}
          anchorX="center"
          anchorY="middle"
          color="#f7f2e8"
        >
          {node.ep.name}
        </Text>
        <Text position={[0, 0.4, 0]} fontSize={0.06} anchorX="center" anchorY="middle" color={node.color}>
          {node.locked ? "TERKUNCI" : node.done ? "SELESAI" : `+${node.ep.career_credit_reward} CREDIT`}
        </Text>

        <pointLight position={[0, 0.4, 0]} intensity={hover ? 2 : 0.9} color={node.color} distance={3} decay={2} />
      </Float>
    </group>
  );
}

function Map({
  nodes,
  onArrive,
  trackName,
}: {
  nodes: Node[];
  onArrive: (id: string) => void;
  trackName: string;
}) {
  const { camera } = useThree();
  const [selected, setSelected] = useState<Node | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const introDone = useRef(false);
  const t = useRef(0);
  const target = useRef(new THREE.Vector3(0, 0.2, 0));

  const pathPoints = useMemo(
    () => nodes.map((n) => new THREE.Vector3(n.position[0], n.position[1] + 0.05, n.position[2])),
    [nodes],
  );

  useFrame((_, dt) => {
    t.current += dt;
    if (!introDone.current) {
      const p = Math.min(1, t.current / 1.8);
      const e = 1 - Math.pow(1 - p, 3);
      camera.position.x = THREE.MathUtils.lerp(-8, 0, e);
      camera.position.y = THREE.MathUtils.lerp(8, 4, e);
      camera.position.z = THREE.MathUtils.lerp(16, 9, e);
      camera.lookAt(0, 0.2, 0);
      if (p >= 1) introDone.current = true;
      return;
    }

    // Follow selected or hovered node
    const focus = selected ?? nodes.find((n) => n.ep.id === hoveredId) ?? null;
    if (selected) {
      const targetPos = new THREE.Vector3(
        selected.position[0],
        selected.position[1] + 1.2,
        selected.position[2] + 2.5,
      );
      camera.position.lerp(targetPos, Math.min(1, dt * 3));
      target.current.set(selected.position[0], selected.position[1] + 0.2, selected.position[2]);
      camera.lookAt(target.current);
      if (camera.position.distanceTo(targetPos) < 0.5) onArrive(selected.ep.id);
      return;
    }

    // Idle: pan camera along path center
    const cx = focus ? focus.position[0] * 0.6 : Math.sin(t.current * 0.15) * 1.5;
    const cz = focus ? focus.position[2] + 4 : 9 + Math.sin(t.current * 0.1) * 0.4;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, cx, 1.5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 4, 2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, cz, 1.5, dt);
    const lookX = focus ? focus.position[0] : 0;
    const lookZ = focus ? focus.position[2] : 0;
    target.current.lerp(new THREE.Vector3(lookX, 0.3, lookZ), Math.min(1, dt * 2));
    camera.lookAt(target.current);
  });

  return (
    <>
      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[80, 80]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={35}
          roughness={0.9}
          depthScale={1}
          color="#050b16"
          metalness={0.65}
        />
      </mesh>

      <Text position={[0, 3.4, -8]} fontSize={0.5} anchorX="center" anchorY="middle" color="#f7f2e8">
        {trackName.toUpperCase()}
      </Text>
      <Text position={[0, 2.9, -8]} fontSize={0.12} anchorX="center" anchorY="middle" color={ACCENT}>
        MISSION MAP · IKUTI JALUR NEON
      </Text>

      {/* Neon path connecting nodes */}
      {pathPoints.length > 1 && (
        <Line points={pathPoints} color={ACCENT} lineWidth={2} transparent opacity={0.55} />
      )}

      {nodes.map((n) => (
        <group
          key={n.ep.id}
          onPointerOver={() => setHoveredId(n.ep.id)}
          onPointerOut={() => setHoveredId(null)}
        >
          <EpisodeNode
            node={n}
            onSelect={(node) => setSelected(node)}
            selectedId={selected?.ep.id ?? null}
            fading={!!selected}
          />
        </group>
      ))}

      <ambientLight intensity={0.3} />
      <pointLight position={[0, 6, 4]} intensity={1.6} color={ACCENT} />
      <pointLight position={[-6, 4, -4]} intensity={0.9} color={CYAN} />
      <pointLight position={[6, 4, -4]} intensity={0.9} color={VIOLET} />
    </>
  );
}

export function TrackMapScene({
  trackName,
  levels,
  episodes,
  completedIds,
}: {
  trackName: string;
  levels: MapLevel[];
  episodes: MapEpisode[];
  completedIds: Set<string>;
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);

  const nodes = useMemo<Node[]>(() => {
    const out: Node[] = [];
    let i = 0;
    const colors = [ACCENT, CYAN, VIOLET];
    levels.forEach((lvl, lvlIdx) => {
      const locked = lvl.status !== "active";
      const eps = episodes.filter((e) => e.level_id === lvl.id);
      eps.forEach((ep, epIdx) => {
        // Serpentine layout
        const row = lvlIdx;
        const col = epIdx;
        const x = (col - (eps.length - 1) / 2) * 2.6;
        const z = -row * 3.2;
        out.push({
          ep,
          levelIdx: lvlIdx,
          levelName: lvl.name,
          position: [x, 0.2, z],
          done: completedIds.has(ep.id),
          locked,
          color: colors[lvlIdx % colors.length],
        });
        i++;
      });
    });
    return out;
  }, [levels, episodes, completedIds]);

  const onArrive = (episodeId: string) => {
    if (transitioning) return;
    setTransitioning(true);
    navigate({ to: "/episodes/$episodeId", params: { episodeId } });
  };

  return (
    <Canvas
      dpr={[1, isMobile ? 1 : 1.5]}
      camera={{ position: [-8, 8, 16], fov: isMobile ? 58 : 48, near: 0.1, far: 120 }}
      gl={{ powerPreference: "high-performance", antialias: !isMobile, alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        scene.fog = new THREE.Fog("#02060c", 10, 32);
      }}
    >
      <color attach="background" args={["#02060c"]} />
      <Map nodes={nodes} onArrive={onArrive} trackName={trackName} />
      {!isMobile && (
        <EffectComposer>
          <Bloom intensity={0.85} luminanceThreshold={0.35} luminanceSmoothing={0.9} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.9} />
        </EffectComposer>
      )}
      {transitioning && (
        <Html center>
          <div className="pointer-events-none rounded-md bg-background/70 px-4 py-2 font-mono-cl text-xs uppercase tracking-widest text-accent">
            Membuka episode…
          </div>
        </Html>
      )}
    </Canvas>
  );
}
