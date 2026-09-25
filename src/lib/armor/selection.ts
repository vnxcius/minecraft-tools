/** What the armor stand wears, apart from the 3D scene: the page shows its choices before three.js loads. */
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
