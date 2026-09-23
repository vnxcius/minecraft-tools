import * as THREE from "three";
import armorData from "@/data/armor.json";
import { type BoxSpec, buildBox } from "./geometry";
import { armorTexture, plainTexture, trimTexture } from "./textures";

export const SLOTS = ["helmet", "chestplate", "leggings", "boots"] as const;
export type Slot = (typeof SLOTS)[number];

/** armor material id per slot, null = empty slot */
export type ArmorSelection = Record<Slot, string | null>;

export interface TrimSelection {
	pattern: string;
	material: string;
	/** slots that get the trim */
	slots: Slot[];
}

const ARMOR_TEX: [number, number] = [64, 32];
const STAND_TEX: [number, number] = [64, 64];

type PartName = "head" | "body" | "rightArm" | "leftArm" | "rightLeg" | "leftLeg";

// humanoid model parts the armor layers are drawn on
const HUMANOID: Record<PartName, Omit<BoxSpec, "tex" | "inflate">> = {
	head: { pivot: [0, 0, 0], origin: [-4, -8, -4], size: [8, 8, 8], uv: [0, 0] },
	body: { pivot: [0, 0, 0], origin: [-4, 0, -2], size: [8, 12, 4], uv: [16, 16] },
	rightArm: { pivot: [-5, 2, 0], origin: [-3, -2, -2], size: [4, 12, 4], uv: [40, 16] },
	leftArm: { pivot: [5, 2, 0], origin: [-1, -2, -2], size: [4, 12, 4], uv: [40, 16], mirror: true },
	rightLeg: { pivot: [-1.9, 12, 0], origin: [-2, 0, -2], size: [4, 12, 4], uv: [0, 16] },
	leftLeg: {
		pivot: [1.9, 12, 0],
		origin: [-2, 0, -2],
		size: [4, 12, 4],
		uv: [0, 16],
		mirror: true,
	},
};

// outer layer (helmet, chestplate, boots) grows by 1px, the leggings layer by 0.5px
const SLOT_PARTS: Record<Slot, { parts: PartName[]; inflate: number; leggings: boolean }> = {
	helmet: { parts: ["head"], inflate: 1, leggings: false },
	chestplate: { parts: ["body", "rightArm", "leftArm"], inflate: 1, leggings: false },
	leggings: { parts: ["body", "rightLeg", "leftLeg"], inflate: 0.5, leggings: true },
	boots: { parts: ["rightLeg", "leftLeg"], inflate: 1, leggings: false },
};

const STAND_PARTS: (BoxSpec & { pose?: PartName })[] = [
	{ pivot: [0, 1, 0], origin: [-1, -7, -1], size: [2, 7, 2], uv: [0, 0], tex: STAND_TEX },
	{ pivot: [0, 0, 0], origin: [-6, 0, -1.5], size: [12, 3, 3], uv: [0, 26], tex: STAND_TEX },
	{
		pivot: [-5, 2, 0],
		origin: [-2, -2, -1],
		size: [2, 12, 2],
		uv: [24, 0],
		tex: STAND_TEX,
		pose: "rightArm",
	},
	{
		pivot: [5, 2, 0],
		origin: [0, -2, -1],
		size: [2, 12, 2],
		uv: [32, 16],
		tex: STAND_TEX,
		mirror: true,
		pose: "leftArm",
	},
	{ pivot: [-1.9, 12, 0], origin: [-1, 0, -1], size: [2, 11, 2], uv: [8, 0], tex: STAND_TEX },
	{
		pivot: [1.9, 12, 0],
		origin: [-1, 0, -1],
		size: [2, 11, 2],
		uv: [40, 16],
		tex: STAND_TEX,
		mirror: true,
	},
	{ pivot: [0, 0, 0], origin: [-3, 3, -1], size: [2, 7, 2], uv: [16, 0], tex: STAND_TEX },
	{ pivot: [0, 0, 0], origin: [1, 3, -1], size: [2, 7, 2], uv: [48, 16], tex: STAND_TEX },
	{ pivot: [0, 0, 0], origin: [-4, 10, -1], size: [8, 2, 2], uv: [0, 48], tex: STAND_TEX },
	// the armor legs reach 2px lower than the stand legs: extend the legs and sink the base plate
	// so boots rest on top of it instead of poking through
	{ pivot: [-1.9, 12, 0], origin: [-1, 11, -1], size: [2, 2, 2], uv: [8, 0], tex: STAND_TEX },
	{ pivot: [1.9, 12, 0], origin: [-1, 11, -1], size: [2, 2, 2], uv: [8, 0], tex: STAND_TEX },
	{ pivot: [0, 14.1, 0], origin: [-6, 11, -6], size: [12, 1, 12], uv: [0, 32], tex: STAND_TEX },
];

// Neighbouring parts (both boots, arms and body, ...) share coplanar faces once inflated, which
// z-fights into streaks. A tiny per-part growth makes one of them win consistently.
const LAYER_BIAS: Record<PartName, number> = {
	head: 0,
	body: 0,
	rightArm: 0.002,
	leftArm: 0.004,
	rightLeg: 0.002,
	leftLeg: 0.004,
};

// the default armor stand pose, in degrees (x = pitch, z = roll)
const ARM_POSE: Partial<Record<PartName, { x: number; z: number }>> = {
	rightArm: { x: -15, z: -10 },
	leftArm: { x: -10, z: 10 },
};

const rad = (deg: number) => (deg * Math.PI) / 180;

function partGroup(spec: BoxSpec, material: THREE.Material, pose?: { x: number; z: number }) {
	const group = new THREE.Group();
	// model space (y down, front = -z) -> three.js (y up, front = +z)
	group.position.set(spec.pivot[0], 24 - spec.pivot[1], -spec.pivot[2]);
	if (pose) group.rotation.set(rad(pose.x), 0, rad(pose.z));
	group.add(new THREE.Mesh(buildBox(spec), material));
	return group;
}

const standTexture = plainTexture("/armor/armor-stand.png").then((texture) => {
	texture.userData.shared = true;
	return texture;
});

// The helmet is drawn without culling like the game does, so its inside (the back of the head)
// is visible through the face opening. Other pieces overlap each other (both boots share space
// in the middle), and drawing their inside faces would z-fight.
const armorLayer = (map: THREE.Texture, slot: Slot) =>
	new THREE.MeshLambertMaterial({
		map,
		transparent: true,
		alphaTest: 0.1,
		side: slot === "helmet" ? THREE.DoubleSide : THREE.FrontSide,
	});

/** builds the armor stand wearing the selected armor and trims */
export async function buildAvatar(armor: ArmorSelection, trim: TrimSelection | null) {
	const root = new THREE.Group();

	const stand = await standTexture;
	const standMaterial = new THREE.MeshLambertMaterial({
		map: stand,
		transparent: true,
		alphaTest: 0.1,
	});
	for (const spec of STAND_PARTS) {
		root.add(partGroup(spec, standMaterial, spec.pose && ARM_POSE[spec.pose]));
	}

	for (const slot of SLOTS) {
		const materialId = armor[slot];
		const entry = armorData.armor.find((a) => a.id === materialId);
		if (!entry) continue;
		const { parts, inflate, leggings } = SLOT_PARTS[slot];

		const base = await armorTexture(entry.id, leggings, "dye" in entry ? entry.dye : undefined);
		const layers = [armorLayer(base, slot)];
		if (trim?.slots.includes(slot)) {
			const paletteId =
				(entry.trimOverrides as Record<string, string>)[trim.material] ?? trim.material;
			const palette = (armorData.palettes as Record<string, string[]>)[paletteId];
			const texture = await trimTexture(trim.pattern, leggings, palette, armorData.baseKey);
			const material = armorLayer(texture, slot);
			// the trim sits on the same surface as the armor, pull it slightly towards the camera
			material.polygonOffset = true;
			material.polygonOffsetFactor = -1;
			material.polygonOffsetUnits = -1;
			layers.push(material);
		}

		for (const name of parts) {
			for (const material of layers) {
				root.add(
					partGroup(
						{ ...HUMANOID[name], tex: ARMOR_TEX, inflate: inflate + LAYER_BIAS[name] },
						material,
						ARM_POSE[name],
					),
				);
			}
		}
	}
	return root;
}

export function disposeAvatar(root: THREE.Object3D) {
	root.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		object.geometry.dispose();
		const material = object.material as THREE.MeshLambertMaterial;
		if (material.map && !material.map.userData.shared) material.map.dispose();
		material.dispose();
	});
}
