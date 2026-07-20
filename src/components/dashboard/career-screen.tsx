import { RoundedBox } from "@react-three/drei";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type CareerTunnelField = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  status: string;
  mediaUrl?: string | null;
};

type Props = {
  field: CareerTunnelField;
  index: number;
  total: number;
  position: [number, number, number];
  rotationY: number;
  accent: string;
  onActivate: (slug: string) => void;
};

function drawAbstract(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#0b1226");
  grad.addColorStop(1, "#03060c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    const y = (i / 30) * h;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + Math.sin(i) * 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // radial glow
  const rg = ctx.createRadialGradient(w * 0.7, h * 0.35, 20, w * 0.7, h * 0.35, w * 0.5);
  rg.addColorStop(0, accent);
  rg.addColorStop(1, "transparent");
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

function drawOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, field: CareerTunnelField, index: number, total: number, accent: string) {
  // dark overlay bottom
  const og = ctx.createLinearGradient(0, 0, 0, h);
  og.addColorStop(0, "rgba(2,6,12,0.15)");
  og.addColorStop(0.55, "rgba(2,6,12,0.55)");
  og.addColorStop(1, "rgba(2,6,12,0.95)");
  ctx.fillStyle = og;
  ctx.fillRect(0, 0, w, h);

  // border
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  ctx.globalAlpha = 1;

  const active = field.status === "active";

  // badge
  ctx.fillStyle = active ? accent : "#94a3b8";
  ctx.font = "600 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(active ? "CAREER FIELD" : "COMING SOON", 40, 60);

  // index number
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "500 20px ui-monospace, monospace";
  const idx = String(index + 1).padStart(2, "0");
  const tot = String(total).padStart(2, "0");
  const label = `${idx} / ${tot}`;
  ctx.fillText(label, w - 40 - ctx.measureText(label).width, 60);

  // Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 64px ui-sans-serif, system-ui, sans-serif";
  const name = field.name.toUpperCase();
  ctx.fillText(name, 40, h - 140);

  // Tagline
  ctx.fillStyle = "rgba(226,232,240,0.85)";
  ctx.font = "400 24px ui-sans-serif, system-ui, sans-serif";
  const tagline = field.tagline || "";
  const maxWidth = w - 80;
  // simple word wrap single line trim
  let line = tagline;
  while (ctx.measureText(line).width > maxWidth && line.length > 3) line = line.slice(0, -2);
  if (line !== tagline) line = line.slice(0, -1) + "…";
  ctx.fillText(line, 40, h - 100);

  // CTA
  ctx.fillStyle = active ? accent : "#64748b";
  ctx.font = "700 20px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(active ? "VIEW MORE →" : "LOCKED", 40, h - 50);

  // Scanlines
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#000000";
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 1;

  // subtle RGB subpixel tint
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#ff0033";
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

export function CareerScreen({ field, index, total, position, rotationY, accent, onActivate }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const active = field.status === "active";

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 576;
    const ctx = canvas.getContext("2d")!;
    drawAbstract(ctx, canvas.width, canvas.height, accent);
    drawOverlay(ctx, canvas.width, canvas.height, field, index, total, accent);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    if (field.mediaUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // cover fit
        const cw = canvas.width, ch = canvas.height;
        const ir = img.width / img.height;
        const cr = cw / ch;
        let dw = cw, dh = ch, dx = 0, dy = 0;
        if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; }
        else { dw = cw; dh = cw / ir; dy = (ch - dh) / 2; }
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
        drawOverlay(ctx, cw, ch, field, index, total, accent);
        tex.needsUpdate = true;
      };
      img.onerror = () => { /* keep abstract */ };
      img.src = field.mediaUrl;
    }
    return tex;
  }, [field, index, total, accent]);

  useEffect(() => () => { texture.dispose(); }, [texture]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const targetScale = hovered && active ? 1.05 : 1;
    const s = groupRef.current.scale.x;
    const next = s + (targetScale - s) * Math.min(1, dt * 6);
    groupRef.current.scale.setScalar(next);
    if (lightRef.current) {
      const targetI = hovered && active ? 3.5 : 1.6;
      lightRef.current.intensity += (targetI - lightRef.current.intensity) * Math.min(1, dt * 6);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (active) onActivate(field.slug);
  };
  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    if (active) document.body.style.cursor = "pointer";
  };
  const handleOut = () => {
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      {/* Outer frame */}
      <RoundedBox args={[4.6, 2.8, 0.22]} radius={0.08} smoothness={4} castShadow>
        <meshStandardMaterial color="#0a1020" metalness={0.85} roughness={0.35} />
      </RoundedBox>
      {/* Inner frame */}
      <RoundedBox args={[4.35, 2.55, 0.24]} radius={0.05} smoothness={3} position={[0, 0, 0.02]}>
        <meshStandardMaterial color="#03060c" metalness={0.5} roughness={0.6} />
      </RoundedBox>
      {/* Screen */}
      <mesh
        position={[0, 0, 0.13]}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <planeGeometry args={[4.1, 2.3]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0, 0.9]} intensity={1.6} distance={5} color={accent} decay={2} />
    </group>
  );
}
