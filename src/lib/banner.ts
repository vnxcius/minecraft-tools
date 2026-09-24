import data from "@/data/banner.json";
import { loadImage } from "./image";

export const MAX_LAYERS = 6;

/** shields take the same patterns as banners */
export type Kind = "banner" | "shield";

export interface DyeColor {
	id: string;
	name: string;
	/** color banners are tinted with */
	hex: string;
}

export const COLORS: DyeColor[] = [
	{ id: "white", name: "White", hex: "#f9fffe" },
	{ id: "light_gray", name: "Light Gray", hex: "#9d9d97" },
	{ id: "gray", name: "Gray", hex: "#474f52" },
	{ id: "black", name: "Black", hex: "#1d1d21" },
	{ id: "brown", name: "Brown", hex: "#835432" },
	{ id: "red", name: "Red", hex: "#b02e26" },
	{ id: "orange", name: "Orange", hex: "#f9801d" },
	{ id: "yellow", name: "Yellow", hex: "#fed83d" },
	{ id: "lime", name: "Lime", hex: "#80c71f" },
	{ id: "green", name: "Green", hex: "#5e7c16" },
	{ id: "cyan", name: "Cyan", hex: "#169c9c" },
	{ id: "light_blue", name: "Light Blue", hex: "#3ab3da" },
	{ id: "blue", name: "Blue", hex: "#3c44aa" },
	{ id: "purple", name: "Purple", hex: "#8932b8" },
	{ id: "magenta", name: "Magenta", hex: "#c74ebd" },
	{ id: "pink", name: "Pink", hex: "#f38baa" },
];

export const colorById = (id: string) => COLORS.find((c) => c.id === id) as DyeColor;

export interface BannerPattern {
	id: string;
	name: string;
	/** pattern item the loom needs for this pattern, e.g. "creeper_banner_pattern" */
	item?: string;
	/** crafting ingredients of that item */
	recipe?: string[];
	/** where to get the item when it cannot be crafted */
	obtain?: string;
}

export const PATTERNS: BannerPattern[] = data.patterns;
export const patternById = (id: string) => PATTERNS.find((p) => p.id === id) as BannerPattern;

export interface Layer {
	/** stable key for React, not part of the design */
	key: string;
	pattern: string;
	color: string;
}

export interface BannerDesign {
	base: string;
	layers: Layer[];
}

// the flag is 20x40 texels inside the 64x64 banner textures (front face), the crossbar 20x2
export const FLAG = { x: 1, y: 1, w: 20, h: 40 };
const BAR = { x: 2, y: 44, w: 20, h: 2 };
export const BANNER_SIZE = { w: 20, h: 42 };

function tinted(img: HTMLImageElement, region: typeof FLAG, hex: string) {
	const canvas = document.createElement("canvas");
	canvas.width = region.w;
	canvas.height = region.h;
	const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
	ctx.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h);
	const n = Number.parseInt(hex.slice(1), 16);
	const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	const pixels = ctx.getImageData(0, 0, region.w, region.h);
	for (let i = 0; i < pixels.data.length; i += 4) {
		pixels.data[i] = (pixels.data[i] * r) / 255;
		pixels.data[i + 1] = (pixels.data[i + 1] * g) / 255;
		pixels.data[i + 2] = (pixels.data[i + 2] * b) / 255;
	}
	ctx.putImageData(pixels, 0, 0);
	return canvas;
}

/**
 * Draws the banner like the game does: the base color on the cloth texture, then every pattern
 * (a grayscale mask) tinted with its dye, bottom to top. The crossbar is drawn on top.
 */
export async function drawBanner(
	canvas: HTMLCanvasElement,
	design: { base: string; layers: { pattern: string; color: string }[] },
	options: { bar?: boolean } = { bar: true },
) {
	const [base, sheet, ...masks] = await Promise.all([
		loadImage("/banner/base.png"),
		loadImage("/banner/banner_base.png"),
		...design.layers.map((l) => loadImage(`/banner/${l.pattern}.png`)),
	]);
	const top = options.bar ? BAR.h : 0;
	canvas.width = BANNER_SIZE.w;
	canvas.height = FLAG.h + top;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(tinted(base, FLAG, colorById(design.base).hex), 0, top);
	design.layers.forEach((layer, i) => {
		ctx.drawImage(tinted(masks[i], FLAG, colorById(layer.color).hex), 0, top);
	});
	if (options.bar) ctx.drawImage(sheet, BAR.x, BAR.y, BAR.w, BAR.h, 0, 0, BAR.w, BAR.h);
}

// the shield front (plate and rim) is 14x24 texels inside the 64x64 shield textures
const SHIELD = { x: 0, y: 0, w: 14, h: 24 };
export const SHIELD_SIZE = { w: SHIELD.w, h: SHIELD.h };

/** same idea as `drawBanner`, with the shield textures: tinted base plate, then the tinted masks */
export async function drawShield(
	canvas: HTMLCanvasElement,
	design: { base: string; layers: { pattern: string; color: string }[] },
) {
	const [base, ...masks] = await Promise.all([
		loadImage("/shield/shield_base.png"),
		...design.layers.map((l) => loadImage(`/shield/${l.pattern}.png`)),
	]);
	canvas.width = SHIELD.w;
	canvas.height = SHIELD.h;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(tinted(base, SHIELD, colorById(design.base).hex), 0, 0);
	design.layers.forEach((layer, i) => {
		ctx.drawImage(tinted(masks[i], SHIELD, colorById(layer.color).hex), 0, 0);
	});
}

/** `/give` command for the design (1.20.5+ item component syntax) */
export function giveCommand(design: BannerDesign, kind: Kind = "banner") {
	const patterns = design.layers
		.map((l) => `{pattern:"minecraft:${l.pattern}",color:"${l.color}"}`)
		.join(",");
	if (kind === "shield") {
		const components = [`base_color="${design.base}"`];
		if (design.layers.length) components.push(`banner_patterns=[${patterns}]`);
		return `/give @p minecraft:shield[${components.join(",")}]`;
	}
	const components = design.layers.length ? `[banner_patterns=[${patterns}]]` : "";
	return `/give @p minecraft:${design.base}_banner${components}`;
}

export interface Material {
	/** item id, used for the icon and name */
	item: string;
	count: number;
	note?: string;
}

/** everything you need to craft the design: the banner, dyes and pattern items */
export function materials(design: BannerDesign): Material[] {
	const list: Material[] = [
		{ item: `${design.base}_wool`, count: 6 },
		{ item: "stick", count: 1 },
	];
	const add = (item: string, count = 1, note?: string) => {
		const existing = list.find((m) => m.item === item);
		if (existing) existing.count += count;
		else list.push({ item, count, note });
	};
	for (const layer of design.layers) {
		add(`${layer.color}_dye`);
		const pattern = patternById(layer.pattern);
		if (pattern.item) {
			add(
				pattern.item,
				1,
				pattern.recipe ? pattern.recipe.map(itemName).join(" + ") : pattern.obtain,
			);
		}
	}
	return list;
}

/** a shield is 6 planks and an iron ingot, the design itself comes from a banner */
export function shieldMaterials(design: BannerDesign): Material[] {
	return [
		{ item: "oak_planks", count: 6, note: "Any planks" },
		{ item: "iron_ingot", count: 1 },
		...materials(design),
	];
}

export const itemName = (id: string) =>
	id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
