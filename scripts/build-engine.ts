/**
 * Builds the world generation engine (cubiomes, MIT) to WebAssembly.
 *
 *   pip install ziglang     # zig is only used as a C compiler, nothing else is needed
 *   bun run engine:build
 *
 * cubiomes is downloaded at a pinned commit into .cache/cubiomes, compiled together with
 * native/engine.c and written to public/engine/engine.wasm (committed, so the site does not need a
 * toolchain). Bump COMMIT to update the engine.
 */
import { existsSync } from "node:fs";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync } from "fflate";

const COMMIT = "e61f90580cbdd883214a8054670dacae655e59c0";
const CACHE = join(".cache", `cubiomes-${COMMIT}`);
const OUT_DIR = "public/engine";
// quadbase.c is only needed for quad-hut searches (and pulls in pthreads)
const SOURCES = ["biomenoise", "biomes", "finders", "generator", "layers", "noise", "util"];

async function download() {
	if (existsSync(join(CACHE, "finders.c"))) return;
	console.log(`Downloading cubiomes ${COMMIT.slice(0, 7)}...`);
	const res = await fetch(`https://github.com/Cubitect/cubiomes/archive/${COMMIT}.zip`);
	if (!res.ok) throw new Error(`Download failed: ${res.status}`);
	const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
	await mkdir(CACHE, { recursive: true });
	for (const [path, data] of Object.entries(files)) {
		if (path.endsWith("/")) continue;
		// drop the top level folder of the archive
		const rel = path.slice(path.indexOf("/") + 1);
		const target = join(CACHE, rel);
		await mkdir(join(target, ".."), { recursive: true });
		await writeFile(target, data);
	}
}

async function main() {
	await download();
	await mkdir(OUT_DIR, { recursive: true });

	const args = [
		"-m",
		"ziglang",
		"cc",
		"-target",
		"wasm32-wasi",
		"-O2",
		"-mexec-model=reactor",
		`-I${CACHE}`,
		"-o",
		join(OUT_DIR, "engine.wasm"),
		"native/engine.c",
		...SOURCES.map((s) => join(CACHE, `${s}.c`)),
		"-Wl,--export-dynamic",
	];
	const proc = Bun.spawn(["python", ...args], { stdout: "inherit", stderr: "inherit" });
	if ((await proc.exited) !== 0)
		throw new Error("Compiling failed. Is ziglang installed (pip install ziglang)?");

	await copyFile(join(CACHE, "LICENSE"), join(OUT_DIR, "LICENSE-cubiomes.txt"));
	console.log(`Engine built: ${OUT_DIR}/engine.wasm (cubiomes ${COMMIT.slice(0, 7)})`);
}

await main();
