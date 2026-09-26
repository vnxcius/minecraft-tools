/** the three faces an inventory-style head shows, as skin UV (px) and their place on the cube */
const FACES = [
	// top: the texture's top row is the back of the head
	{ uv: [8, 0], transform: "rotateX(90deg)", light: 1 },
	{ uv: [8, 8], transform: "", light: 0.85 },
	// the head's right side, on the viewer's left
	{ uv: [0, 8], transform: "rotateY(-90deg)", light: 0.65 },
] as const;

/** a cube of `size` px textured with the head (offset 0) or the hat layer (offset 32) of a skin */
function Cube({ url, size, offset }: { url: string; size: number; offset: number }) {
	const scale = size / 8;
	return (
		<div
			className="absolute top-1/2 left-1/2 transform-3d"
			style={{ width: size, height: size, margin: -size / 2 }}
		>
			{FACES.map(({ uv, transform, light }) => (
				<div
					key={uv.join()}
					className="absolute inset-0 [image-rendering:pixelated] backface-hidden"
					style={{
						backgroundImage: `url("${url}")`,
						// width only: legacy 64x32 skins keep their aspect ratio
						backgroundSize: `${64 * scale}px auto`,
						backgroundPosition: `${-(uv[0] + offset) * scale}px ${-uv[1] * scale}px`,
						transform: `${transform} translateZ(${size / 2}px)`,
						filter: `brightness(${light})`,
					}}
				/>
			))}
		</div>
	);
}

/** Small 3D head of a skin, tilted like the heads in the inventory; Steve until a skin is loaded. */
export default function SkinHead({ url }: { url: string | null }) {
	const skin = url ?? "/armor/steve.png";
	return (
		<span aria-hidden className="relative block size-7 shrink-0">
			<span className="absolute inset-0 transform-[rotateX(-25deg)_rotateY(35deg)] transform-3d">
				<Cube url={skin} size={14} offset={0} />
				{/* the hat layer is 0.5px bigger on every side, like in game */}
				<Cube url={skin} size={15.75} offset={32} />
			</span>
		</span>
	);
}
