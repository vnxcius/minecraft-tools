import * as THREE from "three";
import armorData from "@/data/armor.json";
import { type BoxSpec, buildBox } from "./geometry";
import { type ArmorSelection, SLOTS, type Skin, type Slot, type TrimSelection } from "./selection";
import { armorTexture, plainTexture, skinTexture, trimTexture } from "./textures";

const ARMOR_TEX: [number, number] = [64, 32];
const STAND_TEX: [number, number] = [64, 64];

type PartName = "head" | "body" | "rightArm" | "leftArm" | "rightLeg" | "leftLeg";
type PartSpec = Omit<BoxSpec, "tex" | "inflate">;

// humanoid model parts the armor layers are drawn on
const HUMANOID: Record<PartName, PartSpec> = {
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

/**
 * Player model parts for a skin: slim ("Alex") arms are 3px wide and hang 0.5px lower. Legacy
 * 64x32 skins have no left limbs, the game mirrors the right ones, and no overlay but the hat.
 */
function playerParts(slim: boolean, legacy: boolean) {
	const armWidth = slim ? 3 : 4;
	const armY = slim ? 2.5 : 2;
	const rightArm: PartSpec = {
		pivot: [-5, armY, 0],
		origin: [slim ? -2 : -3, -2, -2],
		size: [armWidth, 12, 4],
		uv: [40, 16],
	};
	const base: Record<PartName, PartSpec> = {
		...HUMANOID,
		rightArm,
		leftArm: legacy
			? { ...rightArm, pivot: [5, armY, 0], origin: [-1, -2, -2], mirror: true }
			: { ...rightArm, pivot: [5, armY, 0], origin: [-1, -2, -2], uv: [32, 48] },
		leftLeg: legacy ? HUMANOID.leftLeg : { ...HUMANOID.leftLeg, uv: [16, 48], mirror: false },
	};
	// second skin layer: hat grows by 0.5px, jacket, sleeves and pants by 0.25px
	const overlay: Partial<Record<PartName, { uv: [number, number]; inflate: number }>> = legacy
		? { head: { uv: [32, 0], inflate: 0.5 } }
		: {
				head: { uv: [32, 0], inflate: 0.5 },
				body: { uv: [16, 32], inflate: 0.25 },
				rightArm: { uv: [40, 32], inflate: 0.25 },
				leftArm: { uv: [48, 48], inflate: 0.25 },
				rightLeg: { uv: [0, 32], inflate: 0.25 },
				leftLeg: { uv: [0, 48], inflate: 0.25 },
			};
	return { base, overlay };
}

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

// Armor is drawn without culling like the game does, so the inside of every piece (back of the
// helmet, inside of the shoulders and boots) is visible through openings and transparent texels.
// LAYER_BIAS keeps the overlapping inside faces from z-fighting.
const armorLayer = (map: THREE.Texture) =>
	new THREE.MeshLambertMaterial({ map, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide });

async function addStand(root: THREE.Group) {
	const stand = await standTexture;
	const standMaterial = new THREE.MeshLambertMaterial({
		map: stand,
		transparent: true,
		alphaTest: 0.1,
	});
	for (const spec of STAND_PARTS) {
		root.add(partGroup(spec, standMaterial, spec.pose && ARM_POSE[spec.pose]));
	}
}

async function addPlayer(root: THREE.Group, skin: Skin) {
	const map = await skinTexture(skin.url);
	const tex: [number, number] = [64, map.image.height];
	const { base, overlay } = playerParts(skin.slim, map.image.height === 32);
	// the game draws the first layer fully opaque and cuts out the second one, both unculled
	const baseMaterial = new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide });
	const overlayMaterial = armorLayer(map);
	// both layers share the texture: only the first one's material disposes it
	overlayMaterial.userData.sharedMap = true;
	for (const name of Object.keys(base) as PartName[]) {
		root.add(partGroup({ ...base[name], tex }, baseMaterial, ARM_POSE[name]));
		const layer = overlay[name];
		if (layer)
			root.add(partGroup({ ...base[name], ...layer, tex }, overlayMaterial, ARM_POSE[name]));
	}
}

/** armor stand, or the player when a skin is given, wearing the armor */
export async function buildAvatar(armor: ArmorSelection, trim: TrimSelection, skin: Skin | null) {
	const root = new THREE.Group();
	if (skin) await addPlayer(root, skin);
	else await addStand(root);

	for (const slot of SLOTS) {
		const materialId = armor[slot];
		const entry = armorData.armor.find((a) => a.id === materialId);
		if (!entry) continue;
		const { parts, inflate, leggings } = SLOT_PARTS[slot];

		const base = await armorTexture(entry.id, leggings, "dye" in entry ? entry.dye : undefined);
		const layers = [armorLayer(base)];
		const { pattern, material: trimMaterial } = trim[slot];
		if (pattern) {
			const paletteId =
				(entry.trimOverrides as Record<string, string>)[trimMaterial] ?? trimMaterial;
			const palette = (armorData.palettes as Record<string, string[]>)[paletteId];
			const texture = await trimTexture(pattern, leggings, palette, armorData.baseKey);
			const material = armorLayer(texture);
			// the trim sits on the same surface as the armor, pull it slightly towards the camera
			material.polygonOffset = true;
			material.polygonOffsetFactor = -1;
			material.polygonOffsetUnits = -1;
			layers.push(material);
		}

		for (const name of parts) {
			// armor follows the arms of a slim player, which hang 0.5px lower
			const part = HUMANOID[name];
			const pivot: BoxSpec["pivot"] =
				skin?.slim && (name === "rightArm" || name === "leftArm")
					? [part.pivot[0], 2.5, part.pivot[2]]
					: part.pivot;
			for (const material of layers) {
				root.add(
					partGroup(
						{ ...part, pivot, tex: ARMOR_TEX, inflate: inflate + LAYER_BIAS[name] },
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
		if (material.map && !material.map.userData.shared && !material.userData.sharedMap) {
			material.map.dispose();
		}
		material.dispose();
	});
}
