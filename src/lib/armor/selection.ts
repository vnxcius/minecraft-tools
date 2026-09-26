/** What the armor stand wears, apart from the 3D scene: the page shows its choices before three.js loads. */
export const SLOTS = ["helmet", "chestplate", "leggings", "boots"] as const;
export type Slot = (typeof SLOTS)[number];

/** armor material id per slot, null = empty slot */
export type ArmorSelection = Record<Slot, string | null>;

export interface SlotTrim {
	/** null = no trim */
	pattern: string | null;
	material: string;
}

/** trim of each armor piece */
export type TrimSelection = Record<Slot, SlotTrim>;

/** player skin worn instead of the armor stand */
export interface Skin {
	url: string;
	/** "Alex" model: 3px wide arms */
	slim: boolean;
}
