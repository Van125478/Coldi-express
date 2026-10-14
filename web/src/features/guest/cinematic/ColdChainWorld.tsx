import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import type { Group, InstancedMesh } from "three";
import * as THREE from "three";
import type { RefObject } from "react";
import { sampleShot, smoothstep } from "@/features/guest/cinematic/shots";

type Quality = "full" | "light";

type DirectorProps = {
  progress: RefObject<number>;
  quality: Quality;
};

export function Director({ progress, quality }: DirectorProps) {
  const camera = useThree((state) => state.camera);
  const truck = useRef<Group>(null);
  const wheels = useRef<Group>(null);
  const door = useRef<Group>(null);

  useFrame(() => {
    const value = progress.current ?? 0;
    const shot = sampleShot(value);
    camera.position.set(shot.position[0], shot.position[1], shot.position[2]);
    camera.lookAt(shot.look[0], shot.look[1], shot.look[2]);

    const travel = smoothstep(0.4, 0.82, value);
    if (truck.current) truck.current.position.x = -1.5 + travel * 16.5;
    wheels.current?.children.forEach((child) => {
      child.rotation.z = -travel * 18;
    });
    if (door.current) door.current.position.y = 1.15 + smoothstep(0.16, 0.34, value) * 1.55;
  });

  return (
    <>
      <color attach="background" args={["#070d1f"]} />
      <fog attach="fog" args={["#070d1f", 10, 34]} />
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#dbeafe", "#0f172a", 0.45]} />
      <directionalLight
        position={[10, 14, 8]}
        intensity={1.55}
        castShadow={quality === "full"}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={40}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-8, 5, -6]} intensity={0.55} color="#93c5fd" />
      <pointLight position={[-6.2, 2.1, -10]} intensity={12} distance={9} color="#7dd3fc" />
      <pointLight position={[18.2, 2.2, -18]} intensity={8} distance={8} color="#bfdbfe" />

      <Corridor quality={quality} />
      <ColdStore door={door} />
      <Road />
      <Reefer truck={truck} wheels={wheels} />
      <Destination />
      <RouteBeacons />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, -0.02, -10]} receiveShadow>
        <planeGeometry args={[48, 36]} />
        <meshStandardMaterial color="#0b1224" roughness={0.95} />
      </mesh>
      {quality === "full" ? <ContactShadows opacity={0.4} scale={36} blur={2.2} far={7} color="#020617" /> : null}
    </>
  );
}

function Corridor({ quality }: { quality: Quality }) {
  const count = quality === "full" ? 72 : 36;
  const mesh = useRef<InstancedMesh>(null);
  const arcs = useMemo(() => {
    const curves = [
      [
        [-0.2, 0.2, 0.2],
        [0.8, 1.5, -0.2],
        [1.8, 0.35, 0.4],
      ],
      [
        [1.8, 0.35, 0.4],
        [2.5, 1.2, 0.1],
        [3.2, 0.15, -0.2],
      ],
    ] as const;
    return curves.map((points) => {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...points[0]),
        new THREE.Vector3(...points[1]),
        new THREE.Vector3(...points[2]),
      );
      return new THREE.TubeGeometry(curve, 28, 0.018, 6, false);
    });
  }, []);

  useLayoutEffect(() => {
    const current = mesh.current;
    if (!current) return;
    const dummy = new THREE.Object3D();
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 1.15 - 0.35;
      const radius = 1.35 + (index % 6) * 0.16;
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle * 0.7) * 0.85, Math.sin(angle) * 0.45);
      dummy.scale.setScalar(index % 8 === 0 ? 0.11 : 0.04);
      dummy.updateMatrix();
      current.setMatrixAt(index, dummy.matrix);
    }
    current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useLayoutEffect(() => () => arcs.forEach((geometry) => geometry.dispose()), [arcs]);

  return (
    <group position={[2.3, 1.25, 0]}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={1.4} roughness={0.3} />
      </instancedMesh>
      {arcs.map((geometry) => (
        <mesh key={geometry.uuid} geometry={geometry}>
          <meshStandardMaterial color="#dbeafe" emissive="#60a5fa" emissiveIntensity={1.6} />
        </mesh>
      ))}
      {[
        [0.1, 0.15, 0.1],
        [1.8, 0.35, 0.35],
        [3.15, 0.1, -0.15],
      ].map((position) => (
        <mesh key={position.join()} position={position as [number, number, number]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#bfdbfe" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}

function ColdStore({ door }: { door: RefObject<Group | null> }) {
  return (
    <group position={[-6.2, 0, -10]}>
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 3.4, 4.2]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 3.48, 0]}>
        <boxGeometry args={[6.6, 0.16, 4.4]} />
        <meshStandardMaterial color="#dbeafe" />
      </mesh>
      <mesh position={[3.22, 1.15, 0]}>
        <boxGeometry args={[0.08, 2.1, 2.3]} />
        <meshStandardMaterial color="#020617" emissive="#38bdf8" emissiveIntensity={0.45} />
      </mesh>
      <group ref={door} position={[3.28, 1.15, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 2.05, 2.15]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.4} />
        </mesh>
      </group>
      <Crate position={[1.5, 0.38, 0.55]} color="#bbf7d0" />
      <Crate position={[1.5, 1.12, 0.55]} color="#86efac" />
      <Crate position={[1.55, 0.38, -0.45]} color="#bae6fd" />
      <Crate position={[0.7, 0.32, 0.2]} color="#7dd3fc" />
      {[-1.6, -0.4, 0.8].map((x) => (
        <mesh key={x} position={[x, 2.15, 2.12]}>
          <boxGeometry args={[0.7, 0.45, 0.06]} />
          <meshStandardMaterial color="#dbeafe" emissive="#93c5fd" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Crate({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

function Road() {
  return (
    <group position={[8, 0, -18]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[26, 3.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => (
        <mesh key={index} position={[-10 + index * 2.2, 0.03, 0]}>
          <boxGeometry args={[0.9, 0.02, 0.08]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      ))}
    </group>
  );
}

function Reefer({ truck, wheels }: { truck: RefObject<Group | null>; wheels: RefObject<Group | null> }) {
  return (
    <group ref={truck} position={[-1.5, 0, -18]}>
      <mesh position={[-0.15, 1.15, 0]} castShadow>
        <boxGeometry args={[3.5, 1.65, 1.42]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.18} roughness={0.38} />
      </mesh>
      <mesh position={[-0.15, 1.15, 0.72]}>
        <boxGeometry args={[3.52, 0.16, 0.02]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      <mesh position={[-2.05, 1.15, 0]} castShadow>
        <boxGeometry args={[0.32, 1.48, 1.32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.45} roughness={0.32} />
      </mesh>
      <mesh position={[-2.22, 1.35, 0]}>
        <boxGeometry args={[0.04, 0.28, 0.7]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[2.05, 0.95, 0]} castShadow>
        <boxGeometry args={[1.25, 1.35, 1.32]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.28} roughness={0.42} />
      </mesh>
      <mesh position={[2.62, 1.12, 0]}>
        <boxGeometry args={[0.06, 0.52, 1.05]} />
        <meshStandardMaterial color="#dbeafe" metalness={0.55} roughness={0.12} />
      </mesh>
      <group ref={wheels}>
        {[
          [-1.15, 0.55],
          [-1.15, -0.55],
          [0.35, 0.55],
          [0.35, -0.55],
          [1.85, 0.55],
          [1.85, -0.55],
        ].map(([x, z]) => (
          <group key={`${x}-${z}`} position={[x, 0.32, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.24, 16]} />
              <meshStandardMaterial color="#020617" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Destination() {
  return (
    <group position={[18.4, 0, -18]}>
      <mesh position={[0, 1.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.8, 3.1, 3.6]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.6} />
      </mesh>
      <mesh position={[-2.42, 1.05, 0]}>
        <boxGeometry args={[0.08, 1.9, 1.8]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#bfdbfe" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 3.18, 0]}>
        <boxGeometry args={[5, 0.14, 3.8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

function RouteBeacons() {
  const stops = [0.5, 4.2, 8.2, 12.2, 16.2];
  return (
    <group position={[0, 0, -18]}>
      {stops.map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[index === 2 ? 0.14 : 0.09, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={1.8} />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 1.4, 6]} />
            <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
