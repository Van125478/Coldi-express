import { useEffect, useMemo } from "react";
import type { Group } from "three";
import type { RefObject } from "react";
import * as THREE from "three";
import { box } from "@/features/motion-lab/rig";

function paintSide() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#d7dee7";
  context.fillRect(0, 0, 1024, 256);
  for (let x = 0; x < 1024; x += 24) {
    context.fillStyle = x % 48 === 0 ? "#c3ccd6" : "#eef3f8";
    context.fillRect(x, 18, 12, 220);
  }
  context.fillStyle = "#1e3a8a";
  context.fillRect(0, 150, 1024, 22);
  context.fillStyle = "#102848";
  context.font = "700 72px sans-serif";
  context.fillText("COLDI", 36, 118);
  context.fillStyle = "#1e3a8a";
  context.font = "600 28px sans-serif";
  context.fillText("REEFER", 360, 112);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function paintEnd(reefer: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = reefer ? "#1c2430" : "#d7dee7";
  context.fillRect(0, 0, 256, 256);
  if (reefer) {
    context.strokeStyle = "#9fb0c3";
    context.lineWidth = 4;
    for (let y = 40; y < 200; y += 18) {
      context.strokeRect(28, y, 200, 8);
    }
    context.fillStyle = "#7dd3fc";
    context.fillRect(28, 214, 90, 18);
  } else {
    for (let x = 0; x < 256; x += 20) {
      context.fillStyle = "#e7eef5";
      context.fillRect(x, 16, 8, 224);
    }
    context.fillStyle = "#1e3a8a";
    context.fillRect(0, 150, 256, 16);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function ReeferContainer({ body }: { body: RefObject<Group | null> }) {
  const maps = useMemo(
    () => ({
      side: paintSide(),
      reefer: paintEnd(true),
      door: paintEnd(false),
    }),
    [],
  );

  useEffect(
    () => () => {
      maps.side?.dispose();
      maps.reefer?.dispose();
      maps.door?.dispose();
    },
    [maps],
  );

  return (
    <group ref={body}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[box.length, box.height, box.width]} />
        <meshStandardMaterial color="#d7dee7" metalness={0.22} roughness={0.46} />
      </mesh>
      <mesh position={[0, 0, box.width / 2 + 0.01]}>
        <planeGeometry args={[box.length * 0.96, box.height * 0.9]} />
        <meshStandardMaterial map={maps.side ?? undefined} metalness={0.15} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -box.width / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[box.length * 0.96, box.height * 0.9]} />
        <meshStandardMaterial map={maps.side ?? undefined} metalness={0.15} roughness={0.5} />
      </mesh>
      <mesh position={[-box.length / 2 - 0.02, 0.05, 0]}>
        <boxGeometry args={[0.28, box.height * 0.86, box.width * 0.86]} />
        <meshStandardMaterial map={maps.reefer ?? undefined} color="#1c2430" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[box.length / 2 + 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[box.width * 0.9, box.height * 0.9]} />
        <meshStandardMaterial map={maps.door ?? undefined} metalness={0.15} roughness={0.5} />
      </mesh>
      {[-1, 1].map((side) =>
        [-1, 1].map((end) => (
          <mesh key={`${side}-${end}`} position={[(end * box.length) / 2, -box.height / 2 + 0.12, (side * box.width) / 2]}>
            <boxGeometry args={[0.28, 0.24, 0.28]} />
            <meshStandardMaterial color="#1a1e24" metalness={0.5} roughness={0.35} />
          </mesh>
        )),
      )}
    </group>
  );
}
