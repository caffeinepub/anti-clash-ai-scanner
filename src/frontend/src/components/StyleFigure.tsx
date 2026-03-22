interface StyleFigureProps {
  topColor: string;
  bottomColor: string;
  shoeColor: string;
  accessoryColor: string;
  hairStyle?: "short" | "medium" | "long" | "curly";
  gender?: string;
  size?: "sm" | "md";
}

export default function StyleFigure({
  topColor,
  bottomColor,
  shoeColor,
  accessoryColor,
  hairStyle = "short",
  gender = "all",
  size = "md",
}: StyleFigureProps) {
  const w = size === "sm" ? 80 : 120;
  const h = size === "sm" ? 134 : 200;
  const scale = size === "sm" ? 0.667 : 1;

  // Base measurements at md (120x200)
  const cx = 60; // center x
  const skinTone = "#F5D5B0";
  const hairColor = "#2C1A0E";
  const isWomen = gender === "women";

  const hairPaths: Record<string, string> = {
    short: `M${cx - 18},52 Q${cx - 20},30 ${cx},28 Q${cx + 20},30 ${cx + 18},52
       Q${cx + 22},40 ${cx + 18},32 Q${cx},20 ${cx - 18},32 Q${cx - 22},40 ${cx - 18},52 Z`,
    medium: `M${cx - 18},52 Q${cx - 22},30 ${cx},26 Q${cx + 22},30 ${cx + 18},52
       Q${cx + 24},44 ${cx + 20},60 Q${cx + 22},34 ${cx},22 Q${cx - 22},34 ${cx - 20},60 Q${cx - 24},44 ${cx - 18},52 Z`,
    long: `M${cx - 18},52 Q${cx - 22},28 ${cx},24 Q${cx + 22},28 ${cx + 18},52
       Q${cx + 26},48 ${cx + 22},80 Q${cx + 24},34 ${cx},20 Q${cx - 24},34 ${cx - 22},80 Q${cx - 26},48 ${cx - 18},52 Z`,
    curly: `M${cx - 18},52 Q${cx - 26},36 ${cx - 14},28 Q${cx - 8},18 ${cx},24
       Q${cx + 8},18 ${cx + 14},28 Q${cx + 26},36 ${cx + 18},52
       Q${cx + 28},46 ${cx + 24},38 Q${cx + 20},20 ${cx},20 Q${cx - 20},20 ${cx - 24},38 Q${cx - 28},46 ${cx - 18},52 Z`,
  };

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 120 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        display: "block",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {/* Shadow/ground */}
      <ellipse cx={cx} cy={196} rx={22} ry={4} fill="rgba(0,0,0,0.08)" />

      {/* Shoes */}
      <rect
        x={cx - 18}
        y={176}
        width={14}
        height={8}
        rx={4}
        fill={shoeColor}
        opacity={0.9}
      />
      <rect
        x={cx + 4}
        y={176}
        width={14}
        height={8}
        rx={4}
        fill={shoeColor}
        opacity={0.9}
      />
      {/* Shoe toe highlight */}
      <rect
        x={cx - 16}
        y={177}
        width={5}
        height={2}
        rx={1}
        fill="white"
        opacity={0.25}
      />
      <rect
        x={cx + 6}
        y={177}
        width={5}
        height={2}
        rx={1}
        fill="white"
        opacity={0.25}
      />

      {/* Legs */}
      <rect
        x={cx - 17}
        y={130}
        width={13}
        height={50}
        rx={6}
        fill={bottomColor}
        opacity={0.9}
      />
      <rect
        x={cx + 4}
        y={130}
        width={13}
        height={50}
        rx={6}
        fill={bottomColor}
        opacity={0.9}
      />
      {/* Leg crease highlight */}
      <rect
        x={cx - 12}
        y={135}
        width={3}
        height={38}
        rx={1.5}
        fill="white"
        opacity={0.15}
      />
      <rect
        x={cx + 9}
        y={135}
        width={3}
        height={38}
        rx={1.5}
        fill="white"
        opacity={0.15}
      />

      {/* Belt / waist stripe */}
      <rect
        x={cx - 20}
        y={126}
        width={40}
        height={6}
        rx={3}
        fill={accessoryColor}
        opacity={0.85}
      />

      {/* Torso / Top */}
      {isWomen ? (
        /* Women — slight waist taper */
        <path
          d={`M${cx - 20},75 Q${cx - 22},92 ${cx - 18},100 L${cx - 20},128 L${cx + 20},128 L${cx + 18},100 Q${cx + 22},92 ${cx + 20},75 Z`}
          fill={topColor}
          opacity={0.9}
        />
      ) : (
        /* Men — straight torso */
        <rect
          x={cx - 20}
          y={75}
          width={40}
          height={53}
          rx={4}
          fill={topColor}
          opacity={0.9}
        />
      )}
      {/* Torso highlight */}
      <rect
        x={cx - 14}
        y={80}
        width={6}
        height={36}
        rx={3}
        fill="white"
        opacity={0.12}
      />

      {/* Left arm */}
      <rect
        x={cx - 34}
        y={76}
        width={14}
        height={42}
        rx={7}
        fill={topColor}
        opacity={0.85}
        transform={`rotate(6 ${cx - 27} 76)`}
      />
      {/* Right arm */}
      <rect
        x={cx + 20}
        y={76}
        width={14}
        height={42}
        rx={7}
        fill={topColor}
        opacity={0.85}
        transform={`rotate(-6 ${cx + 27} 76)`}
      />

      {/* Left hand / wrist */}
      <ellipse
        cx={cx - 28}
        cy={120}
        rx={5}
        ry={6}
        fill={skinTone}
        opacity={0.9}
      />
      {/* Watch dot on left wrist */}
      <circle
        cx={cx - 28}
        cy={113}
        r={3}
        fill={accessoryColor}
        opacity={0.95}
      />
      <circle cx={cx - 28} cy={113} r={1.5} fill="white" opacity={0.6} />

      {/* Right hand */}
      <ellipse
        cx={cx + 28}
        cy={120}
        rx={5}
        ry={6}
        fill={skinTone}
        opacity={0.9}
      />

      {/* Neck */}
      <rect
        x={cx - 7}
        y={63}
        width={14}
        height={16}
        rx={6}
        fill={skinTone}
        opacity={0.9}
      />

      {/* Face */}
      <ellipse cx={cx} cy={50} rx={17} ry={20} fill={skinTone} opacity={0.95} />
      {/* Ear left */}
      <ellipse
        cx={cx - 17}
        cy={50}
        rx={3}
        ry={4}
        fill={skinTone}
        opacity={0.9}
      />
      {/* Ear right */}
      <ellipse
        cx={cx + 17}
        cy={50}
        rx={3}
        ry={4}
        fill={skinTone}
        opacity={0.9}
      />
      {/* Eyes */}
      <ellipse cx={cx - 6} cy={47} rx={2.5} ry={2} fill="#2C2C2C" />
      <ellipse cx={cx + 6} cy={47} rx={2.5} ry={2} fill="#2C2C2C" />
      {/* Eye glint */}
      <circle cx={cx - 5} cy={46} r={0.8} fill="white" />
      <circle cx={cx + 7} cy={46} r={0.8} fill="white" />
      {/* Smile */}
      <path
        d={`M${cx - 5},56 Q${cx},60 ${cx + 5},56`}
        stroke="#8B6A5A"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Nose */}
      <ellipse cx={cx} cy={52} rx={1.5} ry={2} fill="#C9A887" opacity={0.6} />

      {/* Hair */}
      <path
        d={hairPaths[hairStyle] ?? hairPaths.short}
        fill={hairColor}
        opacity={0.92}
      />
    </svg>
  );
}
