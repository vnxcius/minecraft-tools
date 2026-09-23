import * as THREE from "three";

/**
 * Minecraft "cuboid" model parts. Coordinates follow the game's model space
 * (y points down, front is -z, pixels) and are converted to three.js space
 * (y up, front is +z) when the geometry is built.
 */
export interface BoxSpec {
	/** pivot of the part, in model space */
	pivot: [number, number, number];
	/** box origin relative to the pivot */
	origin: [number, number, number];
	/** width, height, depth */
	size: [number, number, number];
	/** texture offset in pixels */
	uv: [number, number];
	/** texture size in pixels */
	tex: [number, number];
	/** grows the box on every side without touching the UV layout (armor layers) */
	inflate?: number;
	/** left arm / left leg reuse the right side texture flipped horizontally */
	mirror?: boolean;
}

type FaceName = "front" | "back" | "right" | "left" | "top" | "bottom";

// corners as (sx, sy, sz) in 0..1 along the box axes, sz = 0 is the front
const FACES: {
	name: FaceName;
	normal: [number, number, number];
	corners: [number, number, number][];
}[] = [
	{
		name: "front",
		normal: [0, 0, -1],
		corners: [
			[0, 0, 0],
			[1, 0, 0],
			[1, 1, 0],
			[0, 1, 0],
		],
	},
	{
		name: "back",
		normal: [0, 0, 1],
		corners: [
			[1, 0, 1],
			[0, 0, 1],
			[0, 1, 1],
			[1, 1, 1],
		],
	},
	{
		name: "right",
		normal: [-1, 0, 0],
		corners: [
			[0, 0, 1],
			[0, 0, 0],
			[0, 1, 0],
			[0, 1, 1],
		],
	},
	{
		name: "left",
		normal: [1, 0, 0],
		corners: [
			[1, 0, 0],
			[1, 0, 1],
			[1, 1, 1],
			[1, 1, 0],
		],
	},
	{
		name: "top",
		normal: [0, -1, 0],
		corners: [
			[0, 0, 1],
			[1, 0, 1],
			[1, 0, 0],
			[0, 0, 0],
		],
	},
	{
		name: "bottom",
		normal: [0, 1, 0],
		corners: [
			[0, 1, 0],
			[1, 1, 0],
			[1, 1, 1],
			[0, 1, 1],
		],
	},
];

/** the standard Minecraft box texture layout: [top|bottom] over [right|front|left|back] */
function faceUv(
	face: FaceName,
	sx: number,
	sy: number,
	sz: number,
	w: number,
	h: number,
	d: number,
) {
	switch (face) {
		case "front":
			return [d + sx * w, d + sy * h];
		case "back":
			return [2 * d + w + (1 - sx) * w, d + sy * h];
		case "right":
			return [(1 - sz) * d, d + sy * h];
		case "left":
			return [d + w + sz * d, d + sy * h];
		case "top":
			return [d + sx * w, (1 - sz) * d];
		case "bottom":
			return [d + w + sx * w, sz * d];
	}
}

export function buildBox(spec: BoxSpec): THREE.BufferGeometry {
	const { origin, size, uv, tex, inflate = 0, mirror = false } = spec;
	const [w, h, d] = size;
	const positions: number[] = [];
	const normals: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];

	for (const face of FACES) {
		const start = positions.length / 3;
		const n3 = new THREE.Vector3(face.normal[0], -face.normal[1], -face.normal[2]);
		const pts: THREE.Vector3[] = [];

		// mirrored parts read the opposite side face and flip along x
		const name: FaceName =
			mirror && face.name === "right"
				? "left"
				: mirror && face.name === "left"
					? "right"
					: face.name;

		for (const [sx, sy, sz] of face.corners) {
			const x = origin[0] - inflate + sx * (w + 2 * inflate);
			const y = origin[1] - inflate + sy * (h + 2 * inflate);
			const z = origin[2] - inflate + sz * (d + 2 * inflate);
			pts.push(new THREE.Vector3(x, -y, -z)); // model space -> three.js space

			const [u, v] = faceUv(name, mirror ? 1 - sx : sx, sy, sz, w, h, d);
			uvs.push((uv[0] + u) / tex[0], 1 - (uv[1] + v) / tex[1]);
			normals.push(n3.x, n3.y, n3.z);
		}
		for (const p of pts) positions.push(p.x, p.y, p.z);

		// make sure the triangles face outwards
		const facing = new THREE.Vector3()
			.subVectors(pts[1], pts[0])
			.cross(new THREE.Vector3().subVectors(pts[2], pts[0]))
			.dot(n3);
		if (facing >= 0) indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
		else indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
	geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	return geometry;
}
