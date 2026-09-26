import armorData from "@/data/armor.json";
import { type ArmorSelection, type Skin, SLOTS, type TrimSelection } from "./selection";

/** What the viewer wears, remembered in this browser so the page opens the way it was left. */
export interface SavedViewer {
	armor: ArmorSelection;
	trim: TrimSelection;
	/** loaded skin and the name it was looked up with */
	skin: (Skin & { nickname: string }) | null;
}

const KEY = "armor-trim-viewer";

const armorIds = new Set(armorData.armor.map((a) => a.id));
const patternIds = new Set(armorData.patterns.map((p) => p.id));
const materialIds = new Set(armorData.materials.map((m) => m.id));

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

/**
 * Keeps only what still makes sense: ids removed by a data sync or a hand-edited value fall back to
 * the defaults, piece by piece.
 */
export function parseSaved(value: unknown, defaults: SavedViewer): SavedViewer {
	if (!isRecord(value)) return defaults;
	const armor = { ...defaults.armor };
	const trim = { ...defaults.trim };
	for (const slot of SLOTS) {
		if (isRecord(value.armor)) {
			const id = value.armor[slot];
			if (id === null || (typeof id === "string" && armorIds.has(id))) armor[slot] = id;
		}
		const saved = isRecord(value.trim) ? value.trim[slot] : undefined;
		if (!isRecord(saved)) continue;
		const { pattern, material } = saved;
		if (typeof material !== "string" || !materialIds.has(material)) continue;
		if (pattern !== null && (typeof pattern !== "string" || !patternIds.has(pattern))) continue;
		trim[slot] = { pattern, material };
	}

	let skin: SavedViewer["skin"] = null;
	const s = value.skin;
	if (
		isRecord(s) &&
		typeof s.nickname === "string" &&
		typeof s.url === "string" &&
		s.url.startsWith("https://textures.minecraft.net/") &&
		typeof s.slim === "boolean"
	) {
		skin = { nickname: s.nickname, url: s.url, slim: s.slim };
	}
	return { armor, trim, skin };
}

export function loadSaved(defaults: SavedViewer): SavedViewer {
	try {
		return parseSaved(JSON.parse(localStorage.getItem(KEY) ?? "null"), defaults);
	} catch {
		return defaults;
	}
}

export function save(state: SavedViewer) {
	try {
		localStorage.setItem(KEY, JSON.stringify(state));
	} catch {
		// private mode or storage disabled: the viewer just is not remembered
	}
}
