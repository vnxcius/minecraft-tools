/**
 * Extracts the block textures behind the page: deepslate all around, dirt under the sky.
 *
 *   bun run decor:sync            # latest release
 *
 * Writes public/decor/<block>.png.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { openClientJar, resolveVersion } from "./lib/jar";
import { writePng } from "./lib/png";

const OUT_DIR = "public/decor";
const BLOCKS = ["dirt", "deepslate"];

const version = await resolveVersion();
console.log(`Minecraft version: ${version}`);
const jar = await openClientJar(version, (f) =>
	BLOCKS.some((b) => f === `textures/block/${b}.png`),
);

await mkdir(OUT_DIR, { recursive: true });
for (const block of BLOCKS) {
	await writePng(join(OUT_DIR, `${block}.png`), jar.file(`textures/block/${block}.png`));
}
console.log(`Decor: ${BLOCKS.length} block textures.`);
