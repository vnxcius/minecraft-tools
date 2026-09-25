/**
 * PNGs the sync scripts write, recompressed with oxipng: lossless, the pixels stay the same (the
 * colour of transparent pixels too), only the file gets smaller.
 */
import { writeFile } from "node:fs/promises";
import { optimise } from "@jsquash/oxipng";

export async function optimisePng(png: Uint8Array) {
	const bytes = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
	const smaller = await optimise(bytes, { level: 6, optimiseAlpha: false, interlace: false });
	// never bigger than what came in (the jar's own files are often optimal already)
	return smaller.byteLength < png.byteLength ? new Uint8Array(smaller) : png;
}

export async function writePng(path: string, png: Uint8Array) {
	await writeFile(path, await optimisePng(png));
}
