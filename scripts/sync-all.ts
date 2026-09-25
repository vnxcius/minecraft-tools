/**
 * Runs every game data sync in one go, all against the same Minecraft version.
 *
 *   bun run sync            # latest release
 *   bun run sync 26.3       # ...or a specific version
 *
 * The version is resolved once and handed to each script, so they cannot end up on different
 * releases. items:sync takes no version: it syncs every version mcitemgallery.com has. lang:sync
 * runs last, it names the items and trades the others wrote. The client jar is downloaded by the
 * first script that needs it and read from .cache/ by the rest. Stops at the first failure.
 */
import { spawnSync } from "node:child_process";
import { resolveVersion } from "./lib/jar";

const version = await resolveVersion();

const STEPS: { name: string; script: string; versioned: boolean }[] = [
	{ name: "items", script: "sync-items.ts", versioned: false },
	{ name: "armor", script: "sync-armor.ts", versioned: true },
	{ name: "banner", script: "sync-banner.ts", versioned: true },
	{ name: "potions", script: "sync-potions.ts", versioned: true },
	{ name: "decor", script: "sync-decor.ts", versioned: true },
	{ name: "enchanting-scene", script: "sync-enchanting-scene.ts", versioned: true },
	{ name: "villagers", script: "sync-villagers.ts", versioned: true },
	{ name: "lang", script: "sync-lang.ts", versioned: true },
];

console.log(`Syncing everything for Minecraft ${version}\n`);
const started = performance.now();

for (const [index, step] of STEPS.entries()) {
	console.log(`[${index + 1}/${STEPS.length}] ${step.name}`);
	const args = [`scripts/${step.script}`, ...(step.versioned ? [version] : [])];
	const code = spawnSync(process.execPath, args, { stdio: "inherit" }).status ?? 1;
	if (code !== 0) {
		console.error(`\n${step.name} failed (exit code ${code}), the steps after it did not run.`);
		process.exit(code);
	}
	console.log();
}

console.log(
	`Done in ${((performance.now() - started) / 1000).toFixed(1)}s. Review and commit the changes.`,
);
