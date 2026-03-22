import {
  ContactShadows,
  Environment,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface OutfitColors {
  topColor: string;
  bottomColor: string;
  shoeColor: string;
  hairColor?: string;
  skinTone?: string;
}

interface Avatar3DProps {
  outfitColors?: OutfitColors;
  gender?: "man" | "woman" | "all";
  faceImageUrl?: string;
  height?: number;
}

// ── Shared material helpers ────────────────────────────────────────────────
function FabricMat({
  color,
  roughness = 0.72,
}: { color: string; roughness?: number }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      metalness={0.04}
      clearcoat={0.05}
      clearcoatRoughness={0.8}
    />
  );
}

function SkinMat({ color }: { color: string }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.38}
      metalness={0}
      clearcoat={0.1}
      clearcoatRoughness={0.5}
    />
  );
}

function ShoeMat({ color }: { color: string }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.3}
      metalness={0.1}
      clearcoat={0.6}
      clearcoatRoughness={0.2}
    />
  );
}

// ── Main character mesh ────────────────────────────────────────────────────
function GameCharacterMesh({
  outfitColors,
  gender,
  faceImageUrl,
}: {
  outfitColors: OutfitColors;
  gender: "man" | "woman";
  faceImageUrl?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const autoRotate = useRef(true);
  const lastTouch = useRef(0);

  const skin =
    outfitColors.skinTone ?? (gender === "woman" ? "#F0C8A8" : "#D4A574");
  const hair =
    outfitColors.hairColor ?? (gender === "woman" ? "#8B4513" : "#1C1208");
  const top = outfitColors.topColor;
  const bottom = outfitColors.bottomColor;
  const shoe = outfitColors.shoeColor;
  const isWoman = gender === "woman";

  // Face texture
  const [faceTexture, setFaceTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!faceImageUrl) {
      setFaceTexture(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(128, 128, 128, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, 0, 0, 256, 256);
      setFaceTexture(new THREE.CanvasTexture(c));
    };
    img.src = faceImageUrl;
  }, [faceImageUrl]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (Date.now() - lastTouch.current > 2500) autoRotate.current = true;
    if (autoRotate.current) groupRef.current.rotation.y += delta * 0.45;
  });

  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const stop = () => {
      autoRotate.current = false;
      lastTouch.current = Date.now();
    };
    el.addEventListener("pointerdown", stop);
    el.addEventListener("touchstart", stop);
    return () => {
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("touchstart", stop);
    };
  }, [gl]);

  // ── Proportions ──────────────────────────────────────────────────────────
  const headR = 0.22;
  const torsoW = isWoman ? 0.42 : 0.5;
  const torsoH = 0.52;
  const torsoD = 0.24;
  const hipW = isWoman ? 0.44 : 0.38;
  const hipH = 0.22;
  const upperArmL = 0.24;
  const lowerArmL = 0.22;
  const upperLegL = 0.3;
  const lowerLegL = 0.27;
  const footH = 0.1;
  const footL = 0.28;

  // Y positions (feet bottom = 0)
  const footY = footH / 2;
  const lowerLegY = footY + footH / 2 + lowerLegL / 2;
  const upperLegY = lowerLegY + lowerLegL / 2 + upperLegL / 2;
  const hipY = upperLegY + upperLegL / 2 + hipH / 2;
  const torsoY = hipY + hipH / 2 + torsoH / 2;
  const shoulderY = torsoY + torsoH / 2;
  const neckY = shoulderY + 0.07;
  const headY = neckY + 0.07 + headR;

  const armX = torsoW / 2 + 0.09;
  const upperArmY = shoulderY - 0.04;
  const lowerArmY = upperArmY - upperArmL / 2 - lowerArmL / 2 + 0.02;
  const handY = lowerArmY - lowerArmL / 2 - 0.05;
  const legX = hipW / 2 - 0.07;

  const offset = -headY * 0.42;

  return (
    <group ref={groupRef} position={[0, offset, 0]}>
      {/* ── HEAD ── */}
      <mesh position={[0, headY, 0]} castShadow>
        <sphereGeometry args={[headR, 40, 40]} />
        {faceTexture ? (
          <meshPhysicalMaterial map={faceTexture} roughness={0.4} />
        ) : (
          <meshPhysicalMaterial
            color={skin}
            roughness={0.38}
            metalness={0}
            clearcoat={0.1}
            clearcoatRoughness={0.5}
          />
        )}
      </mesh>

      {/* Eye whites */}
      {([-0.08, 0.08] as number[]).map((ex) => (
        <mesh key={ex} position={[ex, headY + 0.025, headR * 0.9]} castShadow>
          <sphereGeometry args={[0.044, 16, 16]} />
          <meshPhysicalMaterial color="#f5f5f5" roughness={0.2} />
        </mesh>
      ))}
      {/* Pupils */}
      {([-0.08, 0.08] as number[]).map((ex) => (
        <mesh key={ex} position={[ex, headY + 0.025, headR * 0.95]} castShadow>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshPhysicalMaterial color="#1a1a2e" roughness={0.1} />
        </mesh>
      ))}
      {/* Eye shine */}
      {([-0.074, 0.086] as number[]).map((ex) => (
        <mesh key={ex} position={[ex, headY + 0.038, headR * 0.97]}>
          <sphereGeometry args={[0.009, 8, 8]} />
          <meshPhysicalMaterial color="white" roughness={0} />
        </mesh>
      ))}

      {/* Eyebrows */}
      {([-0.08, 0.08] as number[]).map((ex) => (
        <mesh
          key={ex}
          position={[ex, headY + 0.075, headR * 0.88]}
          rotation={[0, 0, ex < 0 ? 0.15 : -0.15]}
          castShadow
        >
          <boxGeometry args={[0.065, 0.014, 0.012]} />
          <meshPhysicalMaterial color={hair} roughness={0.9} />
        </mesh>
      ))}

      {/* Nose */}
      <mesh position={[0, headY - 0.025, headR + 0.005]} castShadow>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshPhysicalMaterial color={skin} roughness={0.5} />
      </mesh>

      {/* Lips */}
      <mesh position={[0, headY - 0.08, headR - 0.01]} castShadow>
        <sphereGeometry args={[0.028, 12, 8]} />
        <meshPhysicalMaterial
          color={isWoman ? "#c0625e" : "#b07060"}
          roughness={0.4}
        />
      </mesh>

      {/* Hair cap */}
      <mesh position={[0, headY + headR * 0.25, 0]} castShadow>
        <sphereGeometry
          args={[headR + 0.012, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.55]}
        />
        <meshPhysicalMaterial color={hair} roughness={0.88} metalness={0.05} />
      </mesh>

      {isWoman ? (
        <>
          {/* Side hair */}
          {([-1, 1] as number[]).map((side) => (
            <mesh
              key={side}
              position={[side * (headR - 0.01), headY - 0.09, 0]}
              rotation={[0, 0, side * 0.28]}
              castShadow
            >
              <capsuleGeometry args={[0.048, 0.38, 8, 12]} />
              <meshPhysicalMaterial color={hair} roughness={0.88} />
            </mesh>
          ))}
          {/* Bun */}
          <mesh position={[0, headY + headR - 0.02, -headR + 0.05]} castShadow>
            <sphereGeometry args={[0.085, 20, 20]} />
            <meshPhysicalMaterial color={hair} roughness={0.88} />
          </mesh>
        </>
      ) : (
        /* Men's side profile hair fringe */
        <mesh
          position={[0, headY + headR * 0.05, headR * 0.65]}
          rotation={[0.4, 0, 0]}
          castShadow
        >
          <boxGeometry args={[headR * 1.6, 0.04, 0.07]} />
          <meshPhysicalMaterial color={hair} roughness={0.9} />
        </mesh>
      )}

      {/* ── NECK ── */}
      <mesh position={[0, neckY, 0]} castShadow>
        <capsuleGeometry args={[0.072, 0.1, 8, 12]} />
        <SkinMat color={skin} />
      </mesh>

      {/* ── TORSO ── */}
      <RoundedBox
        args={[torsoW, torsoH, torsoD]}
        radius={0.04}
        smoothness={4}
        position={[0, torsoY, 0]}
        castShadow
      >
        <FabricMat color={top} />
      </RoundedBox>

      {/* Collar V-neck */}
      <mesh
        position={[0, torsoY + torsoH / 2 - 0.05, torsoD / 2 + 0.008]}
        castShadow
      >
        <boxGeometry args={[0.18, 0.1, 0.02]} />
        <FabricMat color={top} roughness={0.4} />
      </mesh>

      {/* Shirt button line */}
      {[0.14, 0.04, -0.06, -0.16].map((by) => (
        <mesh
          key={by}
          position={[0, torsoY + by, torsoD / 2 + 0.01]}
          castShadow
        >
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshPhysicalMaterial color="#f0f0f0" roughness={0.3} />
        </mesh>
      ))}

      {/* Shoulder caps */}
      {([-1, 1] as number[]).map((side) => (
        <mesh
          key={side}
          position={[side * (torsoW / 2 + 0.01), shoulderY - 0.02, 0]}
          castShadow
        >
          <sphereGeometry args={[0.092, 20, 20]} />
          <FabricMat color={top} roughness={0.6} />
        </mesh>
      ))}

      {/* ── UPPER ARMS ── */}
      {([-1, 1] as number[]).map((side) => (
        <mesh
          key={side}
          position={[side * armX, upperArmY, 0]}
          rotation={[0, 0, side * 0.14]}
          castShadow
        >
          <capsuleGeometry args={[0.072, upperArmL * 0.6, 8, 12]} />
          <FabricMat color={top} />
        </mesh>
      ))}

      {/* ── LOWER ARMS ── */}
      {([-1, 1] as number[]).map((side) => (
        <mesh
          key={side}
          position={[side * (armX + 0.03), lowerArmY, 0.04]}
          rotation={[-0.18, 0, side * 0.08]}
          castShadow
        >
          <capsuleGeometry args={[0.056, lowerArmL * 0.55, 8, 12]} />
          <meshPhysicalMaterial
            color={skin}
            roughness={0.38}
            metalness={0}
            clearcoat={0.1}
          />
        </mesh>
      ))}

      {/* ── HANDS ── */}
      {([-1, 1] as number[]).map((side) => (
        <mesh
          key={side}
          position={[side * (armX + 0.05), handY, 0.07]}
          castShadow
        >
          <sphereGeometry args={[0.054, 16, 16]} />
          <meshPhysicalMaterial color={skin} roughness={0.4} metalness={0} />
        </mesh>
      ))}

      {/* ── HIPS ── */}
      <RoundedBox
        args={[hipW, hipH, torsoD - 0.01]}
        radius={0.035}
        smoothness={4}
        position={[0, hipY, 0]}
        castShadow
      >
        <FabricMat color={bottom} roughness={0.75} />
      </RoundedBox>

      {/* Belt */}
      <mesh
        position={[0, hipY + hipH / 2 - 0.01, torsoD / 2 + 0.005]}
        castShadow
      >
        <boxGeometry args={[hipW - 0.02, 0.038, 0.018]} />
        <meshPhysicalMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Belt buckle */}
      <mesh
        position={[0, hipY + hipH / 2 - 0.01, torsoD / 2 + 0.018]}
        castShadow
      >
        <boxGeometry args={[0.06, 0.04, 0.015]} />
        <meshPhysicalMaterial color="#c0a060" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* ── UPPER LEGS ── */}
      {([-1, 1] as number[]).map((side) => (
        <mesh key={side} position={[side * legX, upperLegY, 0]} castShadow>
          <capsuleGeometry args={[0.098, upperLegL * 0.55, 8, 12]} />
          <FabricMat color={bottom} roughness={0.78} />
        </mesh>
      ))}

      {/* Pants crease lines */}
      {([-1, 1] as number[]).map((side) => (
        <mesh
          key={side}
          position={[side * legX, upperLegY - 0.04, torsoD / 2 - 0.06]}
          rotation={[0.1, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.012, upperLegL * 0.7, 0.008]} />
          <FabricMat color={bottom} roughness={0.9} />
        </mesh>
      ))}

      {/* ── LOWER LEGS ── */}
      {([-1, 1] as number[]).map((side) => (
        <mesh key={side} position={[side * legX, lowerLegY, 0]} castShadow>
          <capsuleGeometry args={[0.079, lowerLegL * 0.52, 8, 12]} />
          <FabricMat color={bottom} roughness={0.78} />
        </mesh>
      ))}

      {/* ── SHOES ── */}
      {([-1, 1] as number[]).map((side) => (
        <group key={side} position={[side * legX, footY, 0.04]}>
          {/* Upper shoe */}
          <RoundedBox
            args={[0.15, footH, footL]}
            radius={0.03}
            smoothness={4}
            castShadow
          >
            <ShoeMat color={shoe} />
          </RoundedBox>
          {/* Sole */}
          <RoundedBox
            args={[0.168, 0.042, footL + 0.02]}
            radius={0.012}
            smoothness={3}
            position={[0, -footH / 2 - 0.018, 0]}
            castShadow
          >
            <meshPhysicalMaterial color="#111111" roughness={0.75} />
          </RoundedBox>
          {/* Toe cap highlight */}
          <mesh position={[0, 0.008, footL / 2 - 0.02]} castShadow>
            <sphereGeometry
              args={[0.065, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]}
            />
            <ShoeMat color={shoe} />
          </mesh>
        </group>
      ))}

      {/* Women's waist taper accent */}
      {isWoman && (
        <mesh position={[0, torsoY - torsoH / 2 + 0.04, 0]} castShadow>
          <torusGeometry args={[torsoW / 2 - 0.03, 0.022, 8, 32]} />
          <meshPhysicalMaterial color={top} roughness={0.5} clearcoat={0.2} />
        </mesh>
      )}
    </group>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────
export default function Avatar3D({
  outfitColors,
  gender = "all",
  faceImageUrl,
  height = 340,
}: Avatar3DProps) {
  const defaultColors: OutfitColors = {
    topColor: "#4A90D9",
    bottomColor: "#2C3E6B",
    shoeColor: "#8B4513",
    hairColor: "#2C1A0E",
    skinTone: "#E8C5A0",
  };

  const colors = outfitColors ?? defaultColors;
  const [genderOverride, setGenderOverride] = useState<"man" | "woman" | null>(
    null,
  );
  const effectiveGender: "man" | "woman" =
    genderOverride ?? (gender === "woman" ? "woman" : "man");

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        height,
        background:
          "linear-gradient(160deg, #1a2744 0%, #0d1520 60%, #12203a 100%)",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0.3, 2.8], fov: 42 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Lights */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[-3, 6, 4]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0005}
        />
        <pointLight position={[2, 3, 3]} intensity={0.7} color="#ffe8cc" />
        <pointLight
          position={[0, -0.5, 2.5]}
          intensity={0.35}
          color="#aaccff"
        />
        <hemisphereLight args={["#334466", "#111122", 0.5]} />

        {/* IBL reflections */}
        <Environment preset="city" />

        {/* Contact shadow on floor */}
        <ContactShadows
          position={[0, -0.82, 0]}
          opacity={0.55}
          scale={3}
          blur={2.4}
          far={2}
          color="#000020"
        />

        {/* Floor plane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.82, 0]}
          receiveShadow
        >
          <circleGeometry args={[2.5, 48]} />
          <meshStandardMaterial color="#1a2a44" roughness={1} metalness={0} />
        </mesh>
        <gridHelper
          args={[4, 10, "#1e3a5f", "#162840"]}
          position={[0, -0.815, 0]}
        />

        <Suspense fallback={null}>
          <GameCharacterMesh
            outfitColors={colors}
            gender={effectiveGender}
            faceImageUrl={faceImageUrl}
          />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.7}
          target={[0, 0.2, 0]}
        />
      </Canvas>

      {/* Gender toggle */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
        <button
          type="button"
          onClick={() => setGenderOverride("man")}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
            effectiveGender === "man"
              ? "bg-blue-500 text-white"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          ♂ Male
        </button>
        <button
          type="button"
          onClick={() => setGenderOverride("woman")}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
            effectiveGender === "woman"
              ? "bg-pink-500 text-white"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          ♀ Female
        </button>
      </div>

      {/* Drag hint */}
      <div className="absolute top-2 right-2 text-[9px] text-white/30 font-medium">
        Drag to rotate
      </div>
    </div>
  );
}
