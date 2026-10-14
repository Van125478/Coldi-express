import { useEffect, useMemo } from "react";
import type { Group, Object3D } from "three";
import type { RefObject } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { box, lockDrop, pivot, tipLocal } from "@/features/motion-lab/rig";

const paint = "#1a4e8c";
const paintDeep = "#102844";
const steel = "#2a313a";
const steelLight = "#4a545f";
const glass = "#c5dced";

type StackerProps = {
  root: RefObject<Group | null>;
  boom: RefObject<Group | null>;
  slide: RefObject<Group | null>;
  mount: RefObject<Object3D | null>;
  wheels: RefObject<Group | null>;
};

export function ReachStacker({ root, boom, slide, mount, wheels }: StackerProps) {
  const hazard = useMemo(() => stripeTexture(), []);

  useEffect(
    () => () => {
      hazard?.dispose();
    },
    [hazard],
  );

  return (
    <group ref={root}>
      <RoundedBox args={[5.6, 1.25, 2.85]} radius={0.06} smoothness={2} position={[0.15, 1.28, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={paint} metalness={0.42} roughness={0.34} />
      </RoundedBox>
      <RoundedBox args={[2.15, 1.85, 2.7]} radius={0.05} smoothness={2} position={[-2.15, 1.55, 0]} castShadow>
        <meshStandardMaterial color={paintDeep} metalness={0.38} roughness={0.42} />
      </RoundedBox>
      {[-0.35, 0.05, 0.45].map((y) => (
        <mesh key={y} position={[-2.15, 1.35 + y, 1.36]}>
          <boxGeometry args={[1.7, 0.06, 0.04]} />
          <meshStandardMaterial color="#0b1c33" metalness={0.2} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[1.85, 2.55, 0]} castShadow>
        <boxGeometry args={[0.85, 2.7, 1.35]} />
        <meshStandardMaterial color={paintDeep} metalness={0.35} roughness={0.4} />
      </mesh>
      <RoundedBox args={[2.05, 1.65, 2.15]} radius={0.08} smoothness={3} position={[0.15, 2.55, 0.72]} castShadow>
        <meshStandardMaterial color={paint} metalness={0.32} roughness={0.38} />
      </RoundedBox>
      <mesh position={[0.55, 2.72, 1.78]}>
        <boxGeometry args={[1.35, 0.78, 0.05]} />
        <meshStandardMaterial color={glass} metalness={0.65} roughness={0.08} />
      </mesh>
      <mesh position={[-0.55, 2.55, 1.78]}>
        <boxGeometry args={[0.62, 0.95, 0.05]} />
        <meshStandardMaterial color={glass} metalness={0.6} roughness={0.1} />
      </mesh>
      <mesh position={[1.15, 2.15, 1.15]}>
        <boxGeometry args={[0.08, 0.55, 0.35]} />
        <meshStandardMaterial color="#d5dde6" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.9, 3.45, 0.72]}>
        <boxGeometry args={[1.5, 0.08, 0.16]} />
        <meshStandardMaterial color="#f5c518" metalness={0.2} roughness={0.45} />
      </mesh>
      <mesh position={[2.55, 0.95, 0]} castShadow>
        <boxGeometry args={[1.35, 0.55, 2.35]} />
        <meshStandardMaterial color={steel} metalness={0.55} roughness={0.32} />
      </mesh>
      <group ref={wheels}>
        <Wheel position={[2.35, 0.78, 1.15]} radius={0.78} width={0.48} />
        <Wheel position={[2.35, 0.78, -1.15]} radius={0.78} width={0.48} />
        <Wheel position={[-1.55, 0.58, 1.02]} radius={0.58} width={0.4} />
        <Wheel position={[-1.55, 0.58, -1.02]} radius={0.58} width={0.4} />
      </group>

      <group ref={boom} position={[pivot.x, pivot.y, pivot.z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 1.45, 20]} />
          <meshStandardMaterial color="#8d97a3" metalness={0.75} roughness={0.22} />
        </mesh>
        <mesh position={[3.35, 0, 0]} castShadow>
          <boxGeometry args={[6.5, 0.78, 1.02]} />
          <meshStandardMaterial color="#1c232c" metalness={0.62} roughness={0.3} />
        </mesh>
        <mesh position={[3.35, -0.28, 0.42]}>
          <boxGeometry args={[6.2, 0.08, 0.08]} />
          <meshStandardMaterial color={steelLight} metalness={0.7} roughness={0.28} />
        </mesh>
        <mesh position={[1.5, -0.55, 0.55]} rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.07, 0.09, 2.2, 12]} />
          <meshStandardMaterial color="#b7c0ca" metalness={0.82} roughness={0.18} />
        </mesh>
        <mesh position={[1.5, -0.55, -0.55]} rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.07, 0.09, 2.2, 12]} />
          <meshStandardMaterial color="#b7c0ca" metalness={0.82} roughness={0.18} />
        </mesh>
        <group ref={slide}>
          <mesh position={[3.15, 0, 0]} castShadow>
            <boxGeometry args={[6.1, 0.5, 0.68]} />
            <meshStandardMaterial color={steelLight} metalness={0.58} roughness={0.32} />
          </mesh>
          <group ref={mount} position={[tipLocal, 0, 0]}>
            <mesh position={[-0.2, 0.02, 0]} castShadow>
              <boxGeometry args={[0.85, 0.62, 0.78]} />
              <meshStandardMaterial color="#15191f" metalness={0.45} roughness={0.38} />
            </mesh>
            <mesh position={[0, -0.22, 0]} castShadow>
              <boxGeometry args={[box.length * 0.98, 0.32, 0.38]} />
              <meshStandardMaterial color="#14181e" metalness={0.4} roughness={0.42} map={hazard ?? undefined} />
            </mesh>
            {[-1, 1].map((end) => (
              <mesh key={end} position={[end * (box.length / 2 - 0.02), -0.28, 0]} castShadow>
                <boxGeometry args={[0.38, 0.24, box.width * 0.9]} />
                <meshStandardMaterial color="#1b2027" metalness={0.42} roughness={0.4} />
              </mesh>
            ))}
            {[
              [-(box.length / 2) + 0.08, box.width / 2 - 0.08],
              [box.length / 2 - 0.08, box.width / 2 - 0.08],
              [-(box.length / 2) + 0.08, -(box.width / 2) + 0.08],
              [box.length / 2 - 0.08, -(box.width / 2) + 0.08],
            ].map(([x, z]) => (
              <mesh key={`${x}-${z}`} position={[x, -lockDrop + 0.11, z]} castShadow>
                <boxGeometry args={[0.16, 0.22, 0.16]} />
                <meshStandardMaterial color="#f5c518" metalness={0.35} roughness={0.4} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

function Wheel({ position, radius, width }: { position: [number, number, number]; radius: number; width: number }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, width, 28]} />
        <meshStandardMaterial color="#141414" roughness={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.42, radius * 0.42, width + 0.05, 16]} />
        <meshStandardMaterial color="#c9d0d8" metalness={0.72} roughness={0.22} />
      </mesh>
    </group>
  );
}

function stripeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  if (!context) return null;
  for (let index = 0; index < 8; index += 1) {
    context.fillStyle = index % 2 === 0 ? "#14181e" : "#f5c518";
    context.fillRect(index * 16, 0, 16, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(6, 1);
  return texture;
}
