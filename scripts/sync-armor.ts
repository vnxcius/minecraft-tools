/**
 * Extracts everything the 3D armor trim viewer needs from the official client jar.
 *
 *   bun run armor:sync            # latest release
 *   bun run armor:sync 26.3       # specific version
 *
 * Writes:
 *   public/armor/<material>[_leggings].png     armor layer textures
 *   public/armor/trim/<pattern>[_leggings].png trim pattern textures (grayscale)
 *   public/armor/armor-stand.png               armor stand texture
 *   src/data/armor.json                        materials, patterns, palettes, names
 *
 * The client jar is downloaded once and cached in .cache/.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { PNG } from "pngjs";

const MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
const CACHE_DIR = ".cache";
const OUT_DIR = "public/armor";
const ASSETS = "assets/minecraft/";

// trim material -> item shown as its icon
const MATERIAL_ITEMS: Record<string, string> = {
	amethyst: "amethyst_shard",
	copper: "copper_ingot",
	diamond: "diamond",
	emerald: "emerald",
	gold: "gold_ingot",
	iron: "iron_ingot",
	lapis: "lapis_lazuli",
	netherite: "netherite_ingot",
	quartz: "quartz",
	redstone: "redstone",
	resin: "resin_brick",
};

interface Manifest {
	latest: { release: string };
	versions: { id: string; url: string }[];
}

async function getJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
	return (await res.json()) as T;
}

async function getClientJar(version: string): Promise<Uint8Array> {
	const cached = join(CACHE_DIR, `client-${version}.jar`);
	if (existsSync(cached)) return new Uint8Array(await readFile(cached));

	const manifest = await getJson<Manifest>(MANIFEST_URL);
	const entry = manifest.versions.find((v) => v.id === version);
	if (!entry) throw new Error(`Unknown Minecraft version "${version}"`);
	const meta = await getJson<{ downloads: { client: { url: string } } }>(entry.url);

	console.log(`Downloading client ${version}...`);
	const res = await fetch(meta.downloads.client.url);
	if (!res.ok) throw new Error(`Client jar download failed: ${res.status}`);
	const jar = new Uint8Array(await res.arrayBuffer());
	await mkdir(CACHE_DIR, { recursive: true });
	await writeFile(cached, jar);
	return jar;
}

const hex = (r: number, g: number, b: number) =>
	`#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

/** an 8x1 palette png -> ["#rrggbb", ...] */
function readPalette(data: Uint8Array): string[] {
	const png = PNG.sync.read(Buffer.from(data));
	return Array.from({ length: png.width }, (_, x) => {
		const i = x * 4;
		return hex(png.data[i], png.data[i + 1], png.data[i + 2]);
	});
}

const titleCase = (id: string) => id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

async function main() {
	const manifest = await getJson<Manifest>(MANIFEST_URL);
	const version = process.argv[2] ?? manifest.latest.release;
	console.log(`Minecraft version: ${version}`);

	const jar = unzipSync(await getClientJar(version), {
		filter: (f) =>
			f.name.startsWith(`${ASSETS}textures/entity/equipment/humanoid`) ||
			f.name.startsWith(`${ASSETS}textures/trims/entity/`) ||
			f.name.startsWith(`${ASSETS}textures/palettes/`) ||
			f.name.startsWith(`${ASSETS}equipment/`) ||
			f.name === `${ASSETS}textures/entity/armorstand/armorstand.png` ||
			f.name === `${ASSETS}lang/en_us.json`,
	});
	const file = (path: string) => {
		const data = jar[ASSETS + path];
		if (!data) throw new Error(`Missing ${path} in the client jar`);
		return data;
	};
	const list = (dir: string) =>
		Object.keys(jar)
			.filter((f) => f.startsWith(ASSETS + dir) && f.endsWith(".png"))
			.map((f) => f.slice((ASSETS + dir).length, -".png".length))
			.sort();
	const decoder = new TextDecoder();
	const readJson = <T>(path: string): T => JSON.parse(decoder.decode(file(path)));

	const lang = readJson<Record<string, string>>("lang/en_us.json");
	await mkdir(join(OUT_DIR, "trim"), { recursive: true });

	// armor layers
	const armorIds = list("textures/entity/equipment/humanoid/").filter(
		(id) => id !== "leather_overlay",
	);
	const armor = [];
	for (const id of armorIds) {
		const equipment = readJson<{
			layers: { humanoid: { dyeable?: { color_when_undyed: number } }[] };
			trim_overrides?: { palette: string; when: { material: string } }[];
		}>(`equipment/${id}.json`);
		const dye = equipment.layers.humanoid.find((l) => l.dyeable)?.dyeable;
		const leggings = `textures/entity/equipment/humanoid_leggings/${id}.png`;
		const hasLeggingsLayer = ASSETS + leggings in jar;

		await writeFile(
			join(OUT_DIR, `${id}.png`),
			file(`textures/entity/equipment/humanoid/${id}.png`),
		);
		if (hasLeggingsLayer) await writeFile(join(OUT_DIR, `${id}_leggings.png`), file(leggings));
		if (dye) {
			await writeFile(
				join(OUT_DIR, "leather_overlay.png"),
				file("textures/entity/equipment/humanoid/leather_overlay.png"),
			);
			await writeFile(
				join(OUT_DIR, "leather_overlay_leggings.png"),
				file("textures/entity/equipment/humanoid_leggings/leather_overlay.png"),
			);
		}

		armor.push({
			id,
			// the turtle helmet is the only piece using the "turtle_scute" layer
			name: id === "turtle_scute" ? "Turtle" : titleCase(id),
			// item id prefix used for the icons (gold armor items are called "golden_*")
			itemPrefix: id === "gold" ? "golden" : id === "turtle_scute" ? "turtle" : id,
			slots: hasLeggingsLayer ? ["helmet", "chestplate", "leggings", "boots"] : ["helmet"],
			...(dye && { dye: `#${(dye.color_when_undyed & 0xffffff).toString(16).padStart(6, "0")}` }),
			// e.g. iron armor + iron trim uses the "iron_darker" palette
			trimOverrides: Object.fromEntries(
				(equipment.trim_overrides ?? []).map((o) => [
					o.when.material.replace("minecraft:", ""),
					o.palette.replace("minecraft:trim/", ""),
				]),
			),
		});
	}

	// trim patterns
	const patternIds = list("textures/trims/entity/humanoid/");
	for (const id of patternIds) {
		await writeFile(
			join(OUT_DIR, "trim", `${id}.png`),
			file(`textures/trims/entity/humanoid/${id}.png`),
		);
		await writeFile(
			join(OUT_DIR, "trim", `${id}_leggings.png`),
			file(`textures/trims/entity/humanoid_leggings/${id}.png`),
		);
	}
	const patterns = patternIds.map((id) => ({
		id,
		name: (lang[`trim_pattern.minecraft.${id}`] ?? titleCase(id)).replace(/ Armor Trim$/, ""),
		item: `${id}_armor_trim_smithing_template`,
	}));

	// trim palettes: every entry maps the 8 gray levels of the base palette to colors
	const paletteIds = list("textures/palettes/trim/");
	const palettes = Object.fromEntries(
		paletteIds.map((id) => [id, readPalette(file(`textures/palettes/trim/${id}.png`))]),
	);
	const materials = paletteIds
		.filter((id) => !id.endsWith("_darker"))
		.map((id) => ({
			id,
			name: (lang[`trim_material.minecraft.${id}`] ?? titleCase(id)).replace(/ Material$/, ""),
			item: MATERIAL_ITEMS[id] ?? id,
		}));

	await writeFile(
		join(OUT_DIR, "armor-stand.png"),
		file("textures/entity/armorstand/armorstand.png"),
	);

	const data = {
		version,
		baseKey: readPalette(file("textures/palettes/trim_base.png")),
		armor,
		patterns,
		materials,
		palettes,
	};
	await writeFile("src/data/armor.json", `${JSON.stringify(data, null, "\t")}\n`);

	console.log(
		`Armor: ${armor.length} materials, ${patterns.length} trim patterns, ${materials.length} trim materials.`,
	);
}

await main();
