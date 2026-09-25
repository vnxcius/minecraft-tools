/** Firework rockets and stars (Java Edition). Names come from the game (see src/i18n). */
import { itemName, term } from "@/i18n";

export type Shape = "small_ball" | "large_ball" | "star" | "creeper" | "burst";

export interface ShapeInfo {
	id: Shape;
	/** item that gives the shape when crafting the star, none for the small ball */
	item?: string;
}

export const SHAPES: ShapeInfo[] = [
	{ id: "small_ball" },
	{ id: "large_ball", item: "fire_charge" },
	{ id: "star", item: "gold_nugget" },
	{ id: "creeper", item: "creeper_head" },
	{ id: "burst", item: "feather" },
];

const shapeById = (id: Shape) => SHAPES.find((s) => s.id === id) as ShapeInfo;

export const shapeName = (id: Shape) => term(`item.minecraft.firework_star.shape.${id}`);

export interface FireworkColor {
	id: string;
	/** color of the particles, the value the game stores for the dye */
	rgb: number;
}

// the colors of the dyes as fireworks use them (not the same as the dye or banner colors)
export const COLORS: FireworkColor[] = [
	{ id: "white", rgb: 0xf0f0f0 },
	{ id: "light_gray", rgb: 0xababab },
	{ id: "gray", rgb: 0x434343 },
	{ id: "black", rgb: 0x1e1b1b },
	{ id: "brown", rgb: 0x51301a },
	{ id: "red", rgb: 0xb3312c },
	{ id: "orange", rgb: 0xeb8844 },
	{ id: "yellow", rgb: 0xdecf2a },
	{ id: "lime", rgb: 0x41cd34 },
	{ id: "green", rgb: 0x3b511a },
	{ id: "cyan", rgb: 0x287697 },
	{ id: "light_blue", rgb: 0x6689d3 },
	{ id: "blue", rgb: 0x253192 },
	{ id: "purple", rgb: 0x7b2fbe },
	{ id: "magenta", rgb: 0xc354cd },
	{ id: "pink", rgb: 0xd88198 },
];

export const colorById = (id: string) => COLORS.find((c) => c.id === id) as FireworkColor;

/** a color by the name of its dye, "Light Blue Dye" */
export const colorName = (id: string) => itemName(`${id}_dye`);

/** a color as the star's tooltip words it, "light blue" in "fades to light blue" */
export const starColorName = (id: string) => term(`item.minecraft.firework_star.${id}`);

export const hex = (rgb: number) => `#${rgb.toString(16).padStart(6, "0")}`;

export interface Star {
	/** stable key for React, not part of the design */
	key: string;
	shape: Shape;
	colors: string[];
	fade: string[];
	trail: boolean;
	twinkle: boolean;
}

export interface Firework {
	/** 1 to 3, one gunpowder each */
	flight: number;
	stars: Star[];
}

/** the crafting grid has 9 slots: paper + gunpowder + stars for the rocket */
export const maxStars = (flight: number) => 9 - 1 - flight;

/** the grid also holds the gunpowder and the shape / trail / twinkle items of a star */
export function maxColors(star: Pick<Star, "shape" | "trail" | "twinkle">) {
	const extras =
		Number(Boolean(shapeById(star.shape).item)) + Number(star.trail) + Number(star.twinkle);
	return 8 - extras;
}

/** a star with the fade colors goes back into the grid with them, next to itself */
export const MAX_FADE = 8;

const rgbList = (ids: string[]) => `[I;${ids.map((id) => colorById(id).rgb).join(",")}]`;

function explosion(star: Star) {
	const parts = [`shape:"${star.shape}"`, `colors:${rgbList(star.colors)}`];
	if (star.fade.length) parts.push(`fade_colors:${rgbList(star.fade)}`);
	if (star.trail) parts.push("has_trail:true");
	if (star.twinkle) parts.push("has_twinkle:true");
	return `{${parts.join(",")}}`;
}

/** `/give` command for the rocket (1.20.5+ item component syntax) */
export function giveCommand(firework: Firework) {
	const explosions = firework.stars.map(explosion).join(",");
	return `/give @p minecraft:firework_rocket[fireworks={flight_duration:${firework.flight},explosions:[${explosions}]}]`;
}

export interface Material {
	item: string;
	count: number;
}

/** everything to craft the rocket: paper, gunpowder, and for each star the dyes and extras */
export function materials(firework: Firework): Material[] {
	const list: Material[] = [];
	const add = (item: string, count = 1) => {
		const existing = list.find((m) => m.item === item);
		if (existing) existing.count += count;
		else list.push({ item, count });
	};
	add("paper");
	// one gunpowder per level of flight duration, and one per star
	add("gunpowder", firework.flight);
	for (const star of firework.stars) {
		add("gunpowder", 1);
		for (const color of star.colors) add(`${color}_dye`);
		const shape = shapeById(star.shape).item;
		if (shape) add(shape);
		if (star.trail) add("diamond");
		if (star.twinkle) add("glowstone_dust");
		for (const color of star.fade) add(`${color}_dye`);
	}
	return list;
}

export interface StarStep {
	/** items for the first crafting step of the star */
	craft: string[];
	/** dyes for the second step, that adds the fade colors */
	fade: string[];
}

export function starSteps(star: Star): StarStep {
	const craft = ["gunpowder", ...star.colors.map((c) => `${c}_dye`)];
	const shape = shapeById(star.shape).item;
	if (shape) craft.push(shape);
	if (star.trail) craft.push("diamond");
	if (star.twinkle) craft.push("glowstone_dust");
	return { craft, fade: star.fade.map((c) => `${c}_dye`) };
}
