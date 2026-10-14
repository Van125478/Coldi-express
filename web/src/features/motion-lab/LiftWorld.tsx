import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import type { Group, Object3D } from "three";
import type { RefObject } from "react";
import { ReachStacker } from "@/features/motion-lab/ReachStacker";
import { ReeferContainer } from "@/features/motion-lab/ReeferContainer";
import { RoadTrain } from "@/features/motion-lab/RoadTrain";
import { box, lockDrop, poseAt, tipLocal } from "@/features/motion-lab/rig";

type LiftWorldProps = {
  progress: RefObject<number>;
  shadows: boolean;
};

export function LiftWorld({ progress, shadows }: LiftWorldProps) {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const root = useRef<Group>(null);
  const boom = useRef<Group>(null);
  const slide = useRef<Group>(null);
  const mount = useRef<Object3D>(null);
  const wheels = useRef<Group>(null);
  const container = useRef<Group>(null);

  useFrame(() => {
    const pose = poseAt(progress.current ?? 0);
    camera.position.set(pose.camera[0], pose.camera[1], pose.camera[2]);
    camera.lookAt(pose.look[0], pose.look[1], pose.look[2]);

    if (root.current) root.current.position.x = pose.machineX;
    if (boom.current) boom.current.rotation.z = pose.pitch;
    if (slide.current) slide.current.position.x = pose.extension - tipLocal;
    if (mount.current) mount.current.rotation.z = -pose.pitch;
    wheels.current?.children.forEach((wheel) => {
      wheel.rotation.z = -pose.machineX / 0.78;
    });
    const load = container.current;
    const hanger = mount.current;
    if (load && hanger) {
      if (pose.carry) {
        if (load.parent !== hanger) hanger.attach(load);
        load.position.set(0, -(lockDrop + box.height / 2), 0);
        load.rotation.set(0, 0, 0);
      } else {
        if (load.parent !== scene) scene.attach(load);
        load.position.set(pose.container[0], pose.container[1], pose.container[2]);
        load.rotation.set(0, 0, 0);
      }
    }
  });

  return (
    <>
      <color attach="background" args={["#f4f6f8"]} />
      <fog attach="fog" args={["#f4f6f8", 48, 110]} />
      <hemisphereLight args={["#f8fbff", "#6d7680", 0.85]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[18, 22, 12]}
        intensity={2.6}
        castShadow={shadows}
        shadow-mapSize-width={shadows ? 2048 : 512}
        shadow-mapSize-height={shadows ? 2048 : 512}
        shadow-camera-far={70}
        shadow-camera-left={-24}
        shadow-camera-right={36}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <directionalLight position={[-10, 8, -6]} intensity={0.45} color="#dbe7f5" />
      <ReachStacker root={root} boom={boom} slide={slide} mount={mount} wheels={wheels} />
      <ReeferContainer body={container} />
      <RoadTrain />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, 0, 0]} receiveShadow>
        <planeGeometry args={[180, 140]} />
        <meshStandardMaterial color="#171c24" roughness={0.94} />
      </mesh>
      {shadows ? (
        <ContactShadows position={[12, 0.02, 0]} opacity={0.38} scale={46} blur={2.4} far={8} color="#05070a" />
      ) : null}
    </>
  );
}
