/** The rules the tools compute with, checked against values worked out by hand from the game. */
import { describe, expect, test } from "vitest";
import { penalty, planOrder, TOO_EXPENSIVE } from "@/lib/anvil";
import { parseSaved, type SavedViewer } from "@/lib/armor/saved";
import { countBlocks, ellipse, sphereLayer } from "@/lib/circle";
import { displaySeed, parseSeed } from "@/lib/seedmap/seed";
import { bookPrice } from "@/lib/villagers";
import { embedUrl, parseYouTube, watchUrl } from "@/lib/youtube";

describe("anvil order", () => {
	test("prior work penalty doubles with every use", () => {
		expect([0, 1, 2, 3, 6].map(penalty)).toEqual([0, 1, 3, 7, 63]);
	});

	test("nothing to plan without books", () => {
		expect(planOrder([])).toBeNull();
	});

	test("one book costs its level times its multiplier plus the item's penalty", () => {
		expect(planOrder([{ enchantment: "sharpness", level: 5 }])).toMatchObject({
			total: 5,
			max: 5,
			uses: 1,
		});
		// mending has a book multiplier of 2; an item used 3 times adds 7
		expect(planOrder([{ enchantment: "mending", level: 1 }], 3)).toMatchObject({
			total: 9,
			uses: 4,
		});
	});

	test("two books go on one at a time, the bigger one first", () => {
		// Sharpness V then Unbreaking III: 5, then 3 + 1 of penalty. Merging the books first costs 12.
		const plan = planOrder([
			{ enchantment: "unbreaking", level: 3 },
			{ enchantment: "sharpness", level: 5 },
		]);
		expect(plan).toMatchObject({ total: 9, max: 5, uses: 2 });
		expect(plan?.steps.map((s) => s.cost)).toEqual([5, 4]);
	});

	test("the plan adds up and is flagged when a step is too expensive", () => {
		const books = ["protection", "unbreaking", "mending", "thorns", "respiration"].map(
			(enchantment) => ({ enchantment, level: 3 }),
		);
		const plan = planOrder(books);
		expect(plan).not.toBeNull();
		if (!plan) return;
		expect(plan.total).toBe(plan.steps.reduce((sum, step) => sum + step.cost, 0));
		expect(plan.max).toBe(Math.max(...plan.steps.map((step) => step.cost)));
		expect(plan.steps).toHaveLength(books.length);
		expect(planOrder([{ enchantment: "sharpness", level: 1 }], 6)?.max).toBeGreaterThanOrEqual(
			TOO_EXPENSIVE,
		);
	});
});

describe("circles", () => {
	test("a block counts when its center is inside", () => {
		expect(ellipse(1, 1, "filled")).toEqual([[true]]);
		// rows of 3, 5, 5, 5, 3
		expect(countBlocks(ellipse(5, 5, "filled"))).toBe(21);
	});

	test("circles are symmetric and outlines only keep blocks of the filled shape", () => {
		for (const size of [6, 9, 16]) {
			const filled = ellipse(size, size, "filled");
			expect(
				filled.map((row) => [...row].reverse()),
				`${size}`,
			).toEqual(filled);
			expect([...filled].reverse(), `${size}`).toEqual(filled);
			const thin = ellipse(size, size, "thin");
			const thick = ellipse(size, size, "thick");
			for (let y = 0; y < size; y++)
				for (let x = 0; x < size; x++) {
					if (thin[y][x]) expect(thick[y][x]).toBe(true);
					if (thick[y][x]) expect(filled[y][x]).toBe(true);
				}
			expect(countBlocks(thin)).toBeLessThan(countBlocks(filled));
		}
	});

	test("a hollow sphere has fewer blocks than a solid one, the same middle outline", () => {
		const d = 11;
		let solid = 0;
		let hollow = 0;
		for (let layer = 0; layer < d; layer++) {
			solid += countBlocks(sphereLayer(d, layer, false));
			hollow += countBlocks(sphereLayer(d, layer, true));
		}
		expect(hollow).toBeLessThan(solid);
		expect(countBlocks(sphereLayer(d, 0, true))).toBe(countBlocks(sphereLayer(d, 0, false)));
	});
});

describe("seeds", () => {
	test("numbers are used as they are, as unsigned 64 bit", () => {
		expect(parseSeed(" 42 ")).toBe("42");
		expect(parseSeed("-1")).toBe("18446744073709551615");
		expect(displaySeed("-1")).toBe("-1");
	});

	test("text is hashed like Java's String.hashCode", () => {
		expect(displaySeed("a")).toBe("97");
		expect(displaySeed("Hello")).toBe("69609650");
		// the classic string that hashes to Integer.MIN_VALUE
		expect(displaySeed("polygenelubricants")).toBe("-2147483648");
	});
});

describe("villager book prices", () => {
	test("2 + 3L to 6 + 13L emeralds, doubled for treasures, capped at a stack", () => {
		expect(bookPrice(1, false)).toEqual([5, 19]);
		expect(bookPrice(1, true)).toEqual([10, 38]);
		expect(bookPrice(5, false)).toEqual([17, 64]);
		expect(bookPrice(3, true)).toEqual([22, 64]);
	});
});

describe("YouTube links", () => {
	const id = "dQw4w9WgXcQ";

	test("every kind of link gives the video", () => {
		for (const link of [
			`https://www.youtube.com/watch?v=${id}`,
			`youtube.com/watch?v=${id}&list=abc`,
			`https://m.youtube.com/watch?v=${id}`,
			`https://youtu.be/${id}`,
			`https://www.youtube.com/shorts/${id}`,
			`https://www.youtube.com/live/${id}`,
			`https://www.youtube-nocookie.com/embed/${id}`,
		])
			expect(parseYouTube(link), link).toEqual({ id, start: undefined });
	});

	test("the start time is read in every format", () => {
		expect(parseYouTube(`https://youtu.be/${id}?t=90`)?.start).toBe(90);
		expect(parseYouTube(`https://youtu.be/${id}?t=1m30s`)?.start).toBe(90);
		expect(parseYouTube(`https://www.youtube.com/watch?v=${id}&t=1h2m3s`)?.start).toBe(3723);
	});

	test("anything else is not a video", () => {
		for (const link of ["", "hello", `https://vimeo.com/${id}`, "https://youtu.be/short"])
			expect(parseYouTube(link), link).toBeNull();
	});

	test("the stored link reads back to the same video", () => {
		const video = { id, start: 42 };
		expect(parseYouTube(watchUrl(video))).toEqual(video);
		expect(embedUrl(video)).toBe(`https://www.youtube-nocookie.com/embed/${id}?rel=0&start=42`);
	});
});

describe("saved armor trim viewer", () => {
	const trim = { pattern: "coast", material: "gold" };
	const defaults: SavedViewer = {
		armor: {
			helmet: "netherite",
			chestplate: "netherite",
			leggings: "netherite",
			boots: "netherite",
		},
		trim: { helmet: trim, chestplate: trim, leggings: trim, boots: trim },
		skin: null,
	};

	test("restores what was left", () => {
		const saved: SavedViewer = {
			armor: { helmet: "diamond", chestplate: null, leggings: "gold", boots: "leather" },
			trim: {
				helmet: { pattern: "silence", material: "diamond" },
				chestplate: { pattern: null, material: "gold" },
				leggings: trim,
				boots: trim,
			},
			skin: { nickname: "jeb_", url: "https://textures.minecraft.net/texture/abc", slim: false },
		};
		expect(parseSaved(JSON.parse(JSON.stringify(saved)), defaults)).toEqual(saved);
	});

	test("falls back per piece on unknown or broken values", () => {
		const parsed = parseSaved(
			{
				armor: { helmet: "unobtainium", boots: "iron" },
				trim: {
					helmet: { pattern: "nope", material: "gold" },
					boots: { pattern: "rib", material: 3 },
				},
				skin: { nickname: "x", url: "https://evil.example/skin.png", slim: false },
			},
			defaults,
		);
		expect(parsed.armor).toEqual({ ...defaults.armor, boots: "iron" });
		expect(parsed.trim).toEqual(defaults.trim);
		expect(parsed.skin).toBeNull();
		expect(parseSaved("garbage", defaults)).toBe(defaults);
	});
});
