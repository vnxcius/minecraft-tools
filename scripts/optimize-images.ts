/**
 * Recompresses the pictures made by hand (the tool pictures in public/tools/, the link preview og.png
 * and the favicon) the same lossless way the sync scripts write theirs. Run it after adding or
 * changing one:
 *
 *   bun run images:optimize
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";
import { optimisePng, writePng } from "./lib/png";

/** a 32 bit bitmap as an icon holds it (rows bottom up, blue green red alpha) as a png */
function bitmapToPng(bitmap: Buffer) {
	const width = bitmap.readInt32LE(4);
	const height = bitmap.readInt32LE(8) / 2;
	if (bitmap.readUInt16LE(14) !== 32) throw new Error("only 32 bit icon bitmaps are supported");
	const start = bitmap.readUInt32LE(0);
	const png = new PNG({ width, height });
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const from = start + ((height - 1 - y) * width + x) * 4;
			const to = (y * width + x) * 4;
			png.data[to] = bitmap[from + 2];
			png.data[to + 1] = bitmap[from + 1];
			png.data[to + 2] = bitmap[from];
			png.data[to + 3] = bitmap[from + 3];
		}
	return new Uint8Array(PNG.sync.write(png));
}

/** every size of the icon stored as a small png instead of an uncompressed bitmap */
async function optimizeIcon(path: string) {
	const icon = await readFile(path);
	const count = icon.readUInt16LE(4);
	const images: Uint8Array[] = [];
	for (let i = 0; i < count; i++) {
		const size = icon.readUInt32LE(6 + i * 16 + 8);
		const offset = icon.readUInt32LE(6 + i * 16 + 12);
		const image = icon.subarray(offset, offset + size);
		const isPng = image.readUInt32BE(0) === 0x89504e47;
		images.push(await optimisePng(isPng ? new Uint8Array(image) : bitmapToPng(image)));
	}
	const header = Buffer.from(icon.subarray(0, 6 + count * 16));
	let offset = header.length;
	images.forEach((image, i) => {
		header.writeUInt32LE(image.length, 6 + i * 16 + 8);
		header.writeUInt32LE(offset, 6 + i * 16 + 12);
		offset += image.length;
	});
	await writeFile(path, Buffer.concat([header, ...images]));
}

const files = [
	"public/og.png",
	...(await readdir("public/tools"))
		.filter((f) => f.endsWith(".png"))
		.map((f) => join("public/tools", f)),
];
for (const file of files) await writePng(file, await readFile(file));
await optimizeIcon("public/favicon.ico");
console.log(`Optimized ${files.length} pictures and the favicon.`);
