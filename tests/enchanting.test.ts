/**
 * The enchanting table odds, checked against minecraft.wiki and against chances worked out by hand.
 * scripts/sync-enchanting.ts also checks them against the game itself when it runs.
 */
import { describe, expect, test } from "vitest";
import {
	candidates,
	costOdds,
	enchantValues,
	ERAS,
	itemsOfType,
	pickOdds,
	PRUNE,
	slotCosts,
	splitItem,
} from "@/lib/enchanting";

const latest = ERAS.at(-1)!;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe("enchanting table", () => {
	test("slot costs span what minecraft.wiki lists for every bookshelf count", () => {
		// https://minecraft.wiki/w/Enchanting_table_mechanics#Experience_cost
		const wiki = {
			top: "1-2 1-3 1-3 1-4 1-4 1-5 1-5 1-6 1-6 1-7 2-7 2-8 2-8 2-9 2-9 2-10",
			middle: "1-6 1-7 2-8 2-9 3-10 3-11 3-12 3-13 4-14 4-15 5-16 5-17 5-18 5-19 6-20 6-21",
			bottom:
				"1-8 2-9 4-11 6-12 8-14 10-15 12-17 14-18 16-20 18-21 20-23 22-24 24-26 26-27 28-29 30",
		};
		Object.values(wiki).forEach((row, slot) => {
			row.split(" ").forEach((range, shelves) => {
				const [low, high = low] = range.split("-").map(Number);
				const dist = slotCosts(shelves)[slot];
				expect(sum(dist)).toBeCloseTo(1, 12);
				const shown = dist.flatMap((p, cost) => (p > 0 && cost > 0 ? [cost] : []));
				expect(Math.max(...shown), `${slot} ${shelves}`).toBe(high);
				// a cost below the slot's number leaves the slot empty (index 0) instead
				if (!dist[0]) expect(Math.min(...shown), `${slot} ${shelves}`).toBe(low);
				else expect(low).toBeLessThanOrEqual(slot);
			});
		});
	});

	test("the value spread adds up and stays within ±15% of the raised cost", () => {
		const dist = enchantValues(30, 10);
		expect(sum(dist)).toBeCloseTo(1, 12);
		// 30 + 1 + 0..2 + 0..2 = 31..35, times 0.85..1.15
		const reachable = dist.flatMap((p, v) => (p > 0 ? [v] : []));
		expect(Math.min(...reachable)).toBe(Math.round(31 * 0.85));
		expect(Math.max(...reachable)).toBe(Math.round(35 * 1.15));
	});

	test("a single candidate is always the one enchantment", () => {
		expect(candidates(latest, "minecraft:fishing_rod", 10)).toEqual([
			{ id: "minecraft:unbreaking", level: 1, weight: 5 },
		]);
		const odds = pickOdds(latest, "minecraft:fishing_rod", 10);
		expect(odds.enchantments.get("minecraft:unbreaking 1")).toBeCloseTo(1, 12);
		expect(odds.counts[1]).toBeCloseTo(1, 12);
	});

	test("three candidates match the odds worked out by hand", () => {
		// at 16 a fishing rod gets Unbreaking II (weight 5), Luck of the Sea I and Lure I (weight 2)
		expect(
			candidates(latest, "minecraft:fishing_rod", 16).map((c) => [c.id, c.level, c.weight]),
		).toEqual([
			["minecraft:luck_of_the_sea", 1, 2],
			["minecraft:lure", 1, 2],
			["minecraft:unbreaking", 2, 5],
		]);
		const odds = pickOdds(latest, "minecraft:fishing_rod", 16);
		// a second pick while rand(0..49) <= 16, a third while rand(0..49) <= 8
		const second = 17 / 50;
		const third = 9 / 50;
		expect(odds.counts[1]).toBeCloseTo(1 - second, 12);
		expect(odds.counts[2]).toBeCloseTo(second * (1 - third), 12);
		expect(odds.counts[3]).toBeCloseTo(second * third, 12);
		// Unbreaking first, or after Lure or Luck of the Sea: second, or third after the other one
		const unbreaking = 5 / 9 + (4 / 9) * second * (5 / 7 + (2 / 7) * third);
		expect(odds.enchantments.get("minecraft:unbreaking 2")).toBeCloseTo(unbreaking, 12);
	});

	test("a book loses one of several enchantments", () => {
		const game = pickOdds(latest, "minecraft:book", 30, false);
		const table = pickOdds(latest, "minecraft:book", 30);
		// two picks become one, three become two...
		expect(table.counts[1]).toBeCloseTo((game.counts[1] ?? 0) + (game.counts[2] ?? 0), 9);
		expect(table.counts[2]).toBeCloseTo(game.counts[3] ?? 0, 9);
		expect(sum(table.counts)).toBeCloseTo(1, 9);
	});

	test("following only likely paths changes no chance by more than 0.01 points", () => {
		const exact = (() => {
			const saved = PRUNE.value;
			PRUNE.value = 1e-10;
			try {
				return costOdds(latest, "minecraft:book", 15);
			} finally {
				PRUNE.value = saved;
			}
		})();
		const fast = costOdds(latest, "minecraft:book", 15);
		for (const [key, p] of exact.enchantments)
			expect(Math.abs(p - (fast.enchantments.get(key) ?? 0)), key).toBeLessThan(1e-4);
	}, 60_000);

	test("items split into their kind and material", () => {
		expect(splitItem("minecraft:golden_helmet")).toEqual({ type: "helmet", material: "golden" });
		expect(splitItem("minecraft:turtle_helmet")).toEqual({ type: "helmet", material: "turtle" });
		expect(splitItem("minecraft:fishing_rod")).toEqual({ type: "fishing_rod", material: null });
		expect(splitItem("minecraft:book")).toEqual({ type: "book", material: null });
		expect(itemsOfType(latest, "sword")[0]).toBe("minecraft:wooden_sword");
		expect(itemsOfType(latest, "sword").at(-1)).toBe("minecraft:netherite_sword");
	});
});

describe("enchanting data", () => {
	test("versions follow each other without gaps, the latest last", () => {
		expect(ERAS[0].from).toBe("1.14.4");
		expect(ERAS.at(-1)!.to).toBeNull();
		for (const era of ERAS.slice(0, -1)) expect(era.to).not.toBeNull();
	});

	test("every item is a kind the page offers, and takes only known enchantments", () => {
		for (const era of ERAS) {
			for (const [id, item] of Object.entries(era.items)) {
				expect(splitItem(id), id).not.toBeNull();
				expect(item.enchantability, id).toBeGreaterThan(0);
				for (const e of item.enchantments)
					expect(era.enchantments[e], `${era.from} ${id} ${e}`).toBeDefined();
			}
			for (const [id, e] of Object.entries(era.enchantments)) {
				expect(e.weight, id).toBeGreaterThan(0);
				for (const other of e.incompatible)
					expect(era.enchantments[other].incompatible, id).toContain(id);
			}
		}
	});

	test("enchantability matches minecraft.wiki", () => {
		// https://minecraft.wiki/w/Enchanting_table_mechanics#Enchantability
		const wiki: Record<string, number> = {
			golden_chestplate: 25,
			golden_sword: 22,
			leather_boots: 15,
			mace: 15,
			netherite_helmet: 15,
			wooden_pickaxe: 15,
			iron_axe: 14,
			copper_shovel: 13,
			chainmail_leggings: 12,
			diamond_sword: 10,
			diamond_boots: 10,
			iron_helmet: 9,
			turtle_helmet: 9,
			copper_chestplate: 8,
			stone_hoe: 5,
			book: 1,
			bow: 1,
			crossbow: 1,
			fishing_rod: 1,
			trident: 1,
		};
		for (const [id, value] of Object.entries(wiki))
			expect(latest.items[`minecraft:${id}`]?.enchantability, id).toBe(value);
	});
});
