/**
 * Pixel circles, ellipses and spheres for building. A block belongs to the shape when its center is
 * inside it. Outlines keep the blocks that touch the outside: through a side ("thin", a line you
 * can walk along) or also through a corner ("thick", no diagonal gaps).
 */

export type Outline = "filled" | "thin" | "thick";

/** rows of cells, true where a block goes */
export type Grid = boolean[][];

const SIDES = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];
const CORNERS = [...SIDES, [1, 1], [1, -1], [-1, 1], [-1, -1]];

function outline(inside: (x: number, y: number) => boolean, w: number, h: number, mode: Outline) {
	const grid: Grid = [];
	for (let y = 0; y < h; y++) {
		const row: boolean[] = [];
		for (let x = 0; x < w; x++) {
			if (!inside(x, y)) row.push(false);
			else if (mode === "filled") row.push(true);
			else {
				const around = mode === "thin" ? SIDES : CORNERS;
				row.push(around.some(([dx, dy]) => !inside(x + dx, y + dy)));
			}
		}
		grid.push(row);
	}
	return grid;
}

/** a circle when width equals height, an ellipse otherwise */
export function ellipse(width: number, height: number, mode: Outline): Grid {
	const rx = width / 2;
	const ry = height / 2;
	const inside = (x: number, y: number) =>
		x >= 0 &&
		y >= 0 &&
		x < width &&
		y < height &&
		((x + 0.5 - rx) / rx) ** 2 + ((y + 0.5 - ry) / ry) ** 2 <= 1;
	return outline(inside, width, height, mode);
}

/** one horizontal layer (0 is the bottom) of a sphere; hollow keeps the blocks you can see */
export function sphereLayer(diameter: number, layer: number, hollow: boolean): Grid {
	const r = diameter / 2;
	const inside3 = (x: number, y: number, z: number) =>
		x >= 0 &&
		y >= 0 &&
		z >= 0 &&
		x < diameter &&
		y < diameter &&
		z < diameter &&
		(x + 0.5 - r) ** 2 + (y + 0.5 - r) ** 2 + (z + 0.5 - r) ** 2 <= r * r;
	const grid: Grid = [];
	for (let z = 0; z < diameter; z++) {
		const row: boolean[] = [];
		for (let x = 0; x < diameter; x++) {
			const solid = inside3(x, layer, z);
			// a hollow shell drops blocks buried on all six sides
			const buried =
				inside3(x + 1, layer, z) &&
				inside3(x - 1, layer, z) &&
				inside3(x, layer + 1, z) &&
				inside3(x, layer - 1, z) &&
				inside3(x, layer, z + 1) &&
				inside3(x, layer, z - 1);
			row.push(solid && !(hollow && buried));
		}
		grid.push(row);
	}
	return grid;
}

export const countBlocks = (grid: Grid) =>
	grid.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
