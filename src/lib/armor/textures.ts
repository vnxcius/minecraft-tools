import * as THREE from "three";

const images = new Map<string, Promise<HTMLImageElement>>();

function loadImage(url: string): Promise<HTMLImageElement> {
	let image = images.get(url);
	if (!image) {
		image = new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error(`Failed to load ${url}`));
			img.src = url;
		});
		images.set(url, image);
	}
	return image;
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;
	texture.generateMipmaps = false;
	return texture;
}

async function draw(url: string) {
	const img = await loadImage(url);
	const canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
	ctx.drawImage(img, 0, 0);
	return { canvas, ctx };
}

const hexToRgb = (hex: string): [number, number, number] => {
	const n = Number.parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** plain image as a nearest-filtered texture (armor stand) */
export async function plainTexture(url: string) {
	return toTexture((await draw(url)).canvas);
}

/** armor layer; dyeable armor (leather) is tinted and gets its untinted overlay on top */
export async function armorTexture(id: string, leggings: boolean, dye?: string) {
	const suffix = leggings ? "_leggings" : "";
	const { canvas, ctx } = await draw(`/armor/${id}${suffix}.png`);
	if (dye) {
		const [tr, tg, tb] = hexToRgb(dye);
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		for (let i = 0; i < data.data.length; i += 4) {
			data.data[i] = (data.data[i] * tr) / 255;
			data.data[i + 1] = (data.data[i + 1] * tg) / 255;
			data.data[i + 2] = (data.data[i + 2] * tb) / 255;
		}
		ctx.putImageData(data, 0, 0);
		ctx.drawImage(await loadImage(`/armor/leather_overlay${suffix}.png`), 0, 0);
	}
	return toTexture(canvas);
}

/**
 * Trim pattern textures are grayscale: every gray level is a slot of the trim
 * palette. Recoloring swaps each level for the matching color of the material.
 */
export async function trimTexture(
	pattern: string,
	leggings: boolean,
	palette: string[],
	baseKey: string[],
) {
	const { canvas, ctx } = await draw(`/armor/trim/${pattern}${leggings ? "_leggings" : ""}.png`);
	const keys = baseKey.map((c) => hexToRgb(c)[0]);
	const colors = palette.map(hexToRgb);
	const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < data.data.length; i += 4) {
		if (data.data[i + 3] === 0) continue;
		const gray = data.data[i];
		let best = 0;
		for (let k = 1; k < keys.length; k++) {
			if (Math.abs(keys[k] - gray) < Math.abs(keys[best] - gray)) best = k;
		}
		[data.data[i], data.data[i + 1], data.data[i + 2]] = colors[best];
	}
	ctx.putImageData(data, 0, 0);
	return toTexture(canvas);
}
