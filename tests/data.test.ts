/**
 * The game data written by the sync scripts: every file the site loads is there, and the files agree
 * with each other (an item a trade needs has a name, a pattern has its textures...).
 */
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import armor from "@/data/armor.json";
import banner from "@/data/banner.json";
import versions from "@/data/versions.json";
import { LANGUAGES } from "@/i18n/current";
import { PICKABLE } from "@/lib/potions";
import { BOOK_ENCHANTMENTS, PROFESSIONS, WANDERING_TRADER } from "@/lib/villagers";

const publicFile = (path: string) => existsSync(`public${path}`);
const json = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8"));

interface GameText {
	items: Record<string, string>;
	terms: Record<string, string>;
}
const lang = Object.fromEntries(
	LANGUAGES.map(({ id }) => [id, json<GameText>(`src/data/lang/${id}.json`)]),
) as Record<string, GameText>;

describe("item catalog", () => {
	test("versions are unique, newest first and each has its item list", () => {
		const ids = versions.map((v) => v.id);
		expect(new Set(ids).size).toBe(ids.length);
		const numbers = ids.map((id) => id.split(".").map(Number));
		for (let i = 1; i < numbers.length; i++) {
			const [a, b] = [numbers[i - 1], numbers[i]];
			const order = a.map((n, j) => n - (b[j] ?? 0)).find((d) => d !== 0) ?? a.length - b.length;
			expect(order, `${ids[i - 1]} before ${ids[i]}`).toBeGreaterThan(0);
		}
		for (const id of ids) expect(existsSync(`src/data/items/${id}.json`), id).toBe(true);
	});
});

describe("official names", () => {
	// a few game texts are empty on purpose (potion.potency.0, level I shows nothing), so a term is
	// only expected where English has one
	test("every language names the same items and terms, none left blank", () => {
		const [first, ...others] = Object.values(lang);
		for (const text of others) {
			expect(Object.keys(text.items).sort()).toEqual(Object.keys(first.items).sort());
			expect(Object.keys(text.terms).sort()).toEqual(Object.keys(first.terms).sort());
		}
		for (const [id, text] of Object.entries(lang)) {
			for (const [key, value] of Object.entries(text.items))
				expect(value.trim(), `${id} ${key}`).not.toBe("");
			for (const [key, value] of Object.entries(text.terms))
				if (lang.en.terms[key]) expect(value.trim(), `${id} ${key}`).not.toBe("");
		}
	});
});

describe("villager trades", () => {
	const groups = [
		...PROFESSIONS.flatMap((p) => p.levels.map((group) => ({ owner: p.id, group }))),
		...WANDERING_TRADER.map((group) => ({ owner: "wandering_trader", group })),
	];

	test("every profession trades at the five levels and has a job site", () => {
		for (const profession of PROFESSIONS) {
			expect(
				profession.levels.map((l) => l.level),
				profession.id,
			).toEqual([1, 2, 3, 4, 5]);
			expect(lang.en.items[profession.workstation], profession.workstation).toBeTruthy();
		}
	});

	test("a merchant never offers more trades than a level has", () => {
		for (const { owner, group } of groups) {
			expect(group.amount, owner).toBeGreaterThan(0);
			expect(group.amount, owner).toBeLessThanOrEqual(group.trades.length);
		}
	});

	test("trades have valid stacks and every item has an official name", () => {
		for (const { owner, group } of groups) {
			for (const trade of group.trades) {
				const stacks = [trade.wants, trade.also, trade.gives];
				for (const stack of stacks) {
					if (!stack) continue;
					// a librarian's book price is worked out when the offer is made, stored as 0
					const priced = trade.kind === "book" && stack === trade.wants;
					if (!priced) expect(stack.count, trade.id).toBeGreaterThan(0);
					expect(stack.count, trade.id).toBeLessThanOrEqual(64);
					expect(lang.en.items[stack.item], `${owner}: ${stack.item}`).toBeTruthy();
				}
			}
		}
	});

	test("the enchantments librarians sell have names", () => {
		for (const id of BOOK_ENCHANTMENTS)
			expect(lang.en.terms[`enchantment.minecraft.${id}`], id).toBeTruthy();
	});
});

describe("textures", () => {
	test("every banner pattern has its banner and shield texture, and a named recipe", () => {
		for (const file of ["/banner/base.png", "/banner/banner_base.png"])
			expect(publicFile(file), file).toBe(true);
		for (const pattern of banner.patterns) {
			expect(publicFile(`/banner/${pattern.id}.png`), pattern.id).toBe(true);
			expect(publicFile(`/shield/${pattern.id}.png`), pattern.id).toBe(true);
			for (const item of pattern.recipe ?? [])
				expect(lang.en.items[item], `${pattern.id}: ${item}`).toBeTruthy();
		}
	});

	test("every armor and trim has its textures and every trim material a palette", () => {
		expect(publicFile("/armor/armor-stand.png")).toBe(true);
		for (const material of armor.armor) {
			expect(publicFile(`/armor/${material.id}.png`), material.id).toBe(true);
			// the turtle shell is only a helmet
			if (material.slots.includes("leggings"))
				expect(publicFile(`/armor/${material.id}_leggings.png`), material.id).toBe(true);
		}
		for (const pattern of armor.patterns) {
			expect(publicFile(`/armor/trim/${pattern.id}.png`), pattern.id).toBe(true);
			expect(publicFile(`/armor/trim/${pattern.id}_leggings.png`), pattern.id).toBe(true);
		}
		for (const material of armor.materials)
			expect(armor.palettes, material.id).toHaveProperty(material.id);
	});

	test("every potion effect has its icon", () => {
		for (const potion of PICKABLE)
			for (const effect of potion.effects ?? [])
				expect(publicFile(`/potion/effect/${effect.icon}.png`), effect.icon).toBe(true);
	});
});
