import { box, deckTop, trailerX } from "@/features/motion-lab/rig";

export function RoadTrain() {
  const bedCenter = trailerX;
  const nose = bedCenter + box.length / 2 + 1.6;

  return (
    <group>
      <mesh position={[bedCenter - 0.4, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[box.length + 0.8, 0.28, 1.15]} />
        <meshStandardMaterial color="#2c333b" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[bedCenter - 0.4, deckTop - 0.08, 0]} receiveShadow>
        <boxGeometry args={[box.length + 0.4, 0.08, box.width + 0.15]} />
        <meshStandardMaterial color="#3d4650" metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[bedCenter - box.length / 2 - 0.2, 0.85, 0]}>
        <boxGeometry args={[0.4, 1.1, 0.9]} />
        <meshStandardMaterial color="#23282f" metalness={0.4} roughness={0.45} />
      </mesh>
      {[-3.2, -1.2, 1.4].map((offset) => (
        <group key={offset} position={[bedCenter + offset, 0.42, 0]}>
          <Wheel z={1.05} />
          <Wheel z={-1.05} />
        </group>
      ))}
      <mesh position={[nose + 0.2, 1.15, 0]} castShadow>
        <boxGeometry args={[2.4, 1.55, 2.45]} />
        <meshStandardMaterial color="#1d4f91" metalness={0.32} roughness={0.4} />
      </mesh>
      <mesh position={[nose + 1.15, 1.35, 0]}>
        <boxGeometry args={[0.08, 0.7, 2.2]} />
        <meshStandardMaterial color="#c5d8ea" metalness={0.5} roughness={0.15} />
      </mesh>
      <group position={[nose + 1.55, 0.48, 0]}>
        <Wheel z={1.05} />
        <Wheel z={-1.05} />
      </group>
    </group>
  );
}

function Wheel({ z }: { z: number }) {
  return (
    <mesh position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.42, 0.42, 0.32, 20]} />
      <meshStandardMaterial color="#161616" roughness={0.9} />
    </mesh>
  );
}
