/**
 * Brewing data (Java Edition). Brewing recipes are hard-coded in the game and are not part of the
 * client assets, so they are described here. Textures come from `bun run potions:sync`.
 */

export type Form = "potion" | "splash" | "lingering" | "arrow";
export type Upgrade = "none" | "extended" | "enhanced";

export const FORMS: { id: Form; name: string }[] = [
	{ id: "potion", name: "Potion" },
	{ id: "splash", name: "Splash" },
	{ id: "lingering", name: "Lingering" },
	{ id: "arrow", name: "Tipped Arrow" },
];

export interface PotionEffect {
	/** texture id in public/potion/effect */
	icon: string;
	name: string;
}

export interface Potion {
	id: string;
	/** short name used in the picker */
	name: string;
	/** the "X" in "Potion of X" */
	label: string;
	/** liquid color */
	color: string;
	/** the potion this one is brewed from and the ingredients that do it (first one is the classic) */
	from?: { potion: string; ingredients: string[] };
	effects?: PotionEffect[];
	/** seconds of the drinkable potion, missing for instant potions and potions without effect */
	duration?: number;
	instant?: boolean;
	/** duration with redstone */
	extended?: number;
	/** what glowstone dust changes */
	enhanced?: { level: string; duration?: number };
	/** other way to brew it, shown as a tip */
	note?: string;
	/** extra detail shown with the effect, e.g. the levels of a two effect potion */
	detail?: string;
}

const WATER_COLOR = "#385dc6";

export const POTIONS: Potion[] = [
	{ id: "water", name: "Water Bottle", label: "Water", color: WATER_COLOR },
	{
		id: "awkward",
		name: "Awkward",
		label: "Awkward",
		color: WATER_COLOR,
		from: { potion: "water", ingredients: ["nether_wart"] },
	},
	{
		id: "mundane",
		name: "Mundane",
		label: "Mundane",
		color: WATER_COLOR,
		from: {
			potion: "water",
			ingredients: [
				"redstone",
				"sugar",
				"ghast_tear",
				"spider_eye",
				"blaze_powder",
				"magma_cream",
				"glistering_melon_slice",
				"rabbit_foot",
			],
		},
		note: "Any of the ingredients works.",
	},
	{
		id: "thick",
		name: "Thick",
		label: "Thick",
		color: WATER_COLOR,
		from: { potion: "water", ingredients: ["glowstone_dust"] },
	},
	{
		id: "night_vision",
		name: "Night Vision",
		label: "Night Vision",
		color: "#1f1fa1",
		from: { potion: "awkward", ingredients: ["golden_carrot"] },
		effects: [{ icon: "night_vision", name: "Night Vision" }],
		duration: 180,
		extended: 480,
	},
	{
		id: "invisibility",
		name: "Invisibility",
		label: "Invisibility",
		color: "#7f8392",
		from: { potion: "night_vision", ingredients: ["fermented_spider_eye"] },
		effects: [{ icon: "invisibility", name: "Invisibility" }],
		duration: 180,
		extended: 480,
	},
	{
		id: "leaping",
		name: "Leaping",
		label: "Leaping",
		color: "#22ff4c",
		from: { potion: "awkward", ingredients: ["rabbit_foot"] },
		effects: [{ icon: "jump_boost", name: "Jump Boost" }],
		duration: 180,
		extended: 480,
		enhanced: { level: "II", duration: 90 },
	},
	{
		id: "fire_resistance",
		name: "Fire Resistance",
		label: "Fire Resistance",
		color: "#e49a3a",
		from: { potion: "awkward", ingredients: ["magma_cream"] },
		effects: [{ icon: "fire_resistance", name: "Fire Resistance" }],
		duration: 180,
		extended: 480,
	},
	{
		id: "swiftness",
		name: "Swiftness",
		label: "Swiftness",
		color: "#33ebff",
		from: { potion: "awkward", ingredients: ["sugar"] },
		effects: [{ icon: "speed", name: "Speed" }],
		duration: 180,
		extended: 480,
		enhanced: { level: "II", duration: 90 },
	},
	{
		id: "slowness",
		name: "Slowness",
		label: "Slowness",
		color: "#8bafe0",
		// swiftness or leaping, both work
		from: { potion: "swiftness", ingredients: ["fermented_spider_eye"] },
		note: "A Potion of Leaping works instead of Swiftness.",
		effects: [{ icon: "slowness", name: "Slowness" }],
		duration: 90,
		extended: 240,
		enhanced: { level: "IV", duration: 20 },
	},
	{
		id: "water_breathing",
		name: "Water Breathing",
		label: "Water Breathing",
		color: "#2e5299",
		from: { potion: "awkward", ingredients: ["pufferfish"] },
		effects: [{ icon: "water_breathing", name: "Water Breathing" }],
		duration: 180,
		extended: 480,
	},
	{
		id: "healing",
		name: "Healing",
		label: "Healing",
		color: "#f82423",
		from: { potion: "awkward", ingredients: ["glistering_melon_slice"] },
		effects: [{ icon: "instant_health", name: "Instant Health" }],
		instant: true,
		enhanced: { level: "II" },
	},
	{
		id: "harming",
		name: "Harming",
		label: "Harming",
		color: "#a9656a",
		// healing or poison, both work
		from: { potion: "healing", ingredients: ["fermented_spider_eye"] },
		note: "A Potion of Poison works instead of Healing.",
		effects: [{ icon: "instant_damage", name: "Instant Damage" }],
		instant: true,
		enhanced: { level: "II" },
	},
	{
		id: "poison",
		name: "Poison",
		label: "Poison",
		color: "#87a363",
		from: { potion: "awkward", ingredients: ["spider_eye"] },
		effects: [{ icon: "poison", name: "Poison" }],
		duration: 45,
		extended: 90,
		enhanced: { level: "II", duration: 21 },
	},
	{
		id: "regeneration",
		name: "Regeneration",
		label: "Regeneration",
		color: "#cd5cab",
		from: { potion: "awkward", ingredients: ["ghast_tear"] },
		effects: [{ icon: "regeneration", name: "Regeneration" }],
		duration: 45,
		extended: 90,
		enhanced: { level: "II", duration: 22 },
	},
	{
		id: "strength",
		name: "Strength",
		label: "Strength",
		color: "#932423",
		from: { potion: "awkward", ingredients: ["blaze_powder"] },
		effects: [{ icon: "strength", name: "Strength" }],
		duration: 180,
		extended: 480,
		enhanced: { level: "II", duration: 90 },
	},
	{
		id: "weakness",
		name: "Weakness",
		label: "Weakness",
		color: "#484d48",
		from: { potion: "water", ingredients: ["fermented_spider_eye"] },
		effects: [{ icon: "weakness", name: "Weakness" }],
		duration: 90,
		extended: 240,
	},
	{
		id: "turtle_master",
		name: "Turtle Master",
		label: "the Turtle Master",
		color: "#8bafe0",
		from: { potion: "awkward", ingredients: ["turtle_helmet"] },
		effects: [
			{ icon: "slowness", name: "Slowness" },
			{ icon: "resistance", name: "Resistance" },
		],
		duration: 20,
		extended: 40,
		enhanced: { level: "II", duration: 20 },
		detail: "Slowness IV and Resistance III (Slowness VI and Resistance IV when enhanced)",
	},
	{
		id: "slow_falling",
		name: "Slow Falling",
		label: "Slow Falling",
		color: "#f3cfb9",
		from: { potion: "awkward", ingredients: ["phantom_membrane"] },
		effects: [{ icon: "slow_falling", name: "Slow Falling" }],
		duration: 90,
		extended: 240,
	},
	{
		id: "wind_charged",
		name: "Wind Charged",
		label: "Wind Charging",
		color: "#bdc9ff",
		from: { potion: "awkward", ingredients: ["breeze_rod"] },
		effects: [{ icon: "wind_charged", name: "Wind Charged" }],
		duration: 180,
	},
	{
		id: "weaving",
		name: "Weaving",
		label: "Weaving",
		color: "#78695a",
		from: { potion: "awkward", ingredients: ["cobweb"] },
		effects: [{ icon: "weaving", name: "Weaving" }],
		duration: 180,
	},
	{
		id: "oozing",
		name: "Oozing",
		label: "Oozing",
		color: "#99ffa3",
		from: { potion: "awkward", ingredients: ["slime_block"] },
		effects: [{ icon: "oozing", name: "Oozing" }],
		duration: 180,
	},
	{
		id: "infested",
		name: "Infested",
		label: "Infestation",
		color: "#8c9b8c",
		from: { potion: "awkward", ingredients: ["stone"] },
		effects: [{ icon: "infested", name: "Infested" }],
		duration: 180,
	},
];

/** potions you can pick (the water bottle is only the starting point) */
export const PICKABLE = POTIONS.filter((p) => p.id !== "water");

export const potionById = (id: string) => POTIONS.find((p) => p.id === id) as Potion;

/** what the effect of splash / lingering potions and tipped arrows last, compared to a potion */
const DURATION_FACTOR: Record<Form, number> = {
	potion: 1,
	splash: 0.75,
	lingering: 0.25,
	arrow: 0.125,
};

export function canExtend(potion: Potion) {
	return potion.extended !== undefined;
}
export function canEnhance(potion: Potion) {
	return potion.enhanced !== undefined;
}

export function formatDuration(seconds: number) {
	const total = Math.round(seconds);
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** final effect summary for the selected potion, e.g. { level: "II", time: "1:30" } */
export function effectSummary(potion: Potion, upgrade: Upgrade, form: Form) {
	if (!potion.effects) return null;
	const level = upgrade === "enhanced" ? potion.enhanced?.level : undefined;
	if (potion.instant) return { level, time: "Instant" };
	const base =
		upgrade === "extended"
			? potion.extended
			: upgrade === "enhanced"
				? (potion.enhanced?.duration ?? potion.duration)
				: potion.duration;
	return { level, time: formatDuration((base ?? 0) * DURATION_FACTOR[form]) };
}

export function fullName(potion: Potion, upgrade: Upgrade, form: Form) {
	const suffix = upgrade === "enhanced" && potion.enhanced ? ` ${potion.enhanced.level}` : "";
	if (!potion.effects) {
		const prefix = form === "splash" ? "Splash " : form === "lingering" ? "Lingering " : "";
		const name = potion.id === "water" ? "Water Bottle" : `${potion.name} Potion`;
		return form === "arrow" ? "Tipped Arrow" : `${prefix}${name}`;
	}
	switch (form) {
		case "splash":
			return `Splash Potion of ${potion.label}${suffix}`;
		case "lingering":
			return `Lingering Potion of ${potion.label}${suffix}`;
		case "arrow":
			return `Arrow of ${potion.label}${suffix}`;
		default:
			return `Potion of ${potion.label}${suffix}`;
	}
}

export interface StageIcon {
	color: string;
	form: Form;
}

export interface RecipeStep {
	/** "brew" in a brewing stand or "craft" in a crafting grid */
	kind: "brew" | "craft";
	input: { name: string; icon: StageIcon };
	/** item ids, any of them works (first one is the usual choice) */
	ingredients: string[];
	/** how many of the ingredient the step uses per operation */
	amount?: number;
	output: { name: string; icon: StageIcon };
}

function pathTo(id: string): Potion[] {
	const potion = potionById(id);
	return potion.from ? [...pathTo(potion.from.potion), potion] : [potion];
}

/** every step from a water bottle to the finished item */
export function recipe(potion: Potion, upgrade: Upgrade, form: Form): RecipeStep[] {
	const steps: RecipeStep[] = [];
	const stage = (p: Potion, f: Form, name: string) => ({
		name,
		icon: { color: p.color, form: f },
	});

	let previous = potionById("water");
	for (const next of pathTo(potion.id).slice(1)) {
		steps.push({
			kind: "brew",
			input: stage(previous, "potion", fullName(previous, "none", "potion")),
			ingredients: (next.from as NonNullable<Potion["from"]>).ingredients,
			output: stage(next, "potion", fullName(next, "none", "potion")),
		});
		previous = next;
	}

	let current = fullName(potion, "none", "potion");
	if (upgrade !== "none") {
		const upgraded =
			fullName(potion, upgrade, "potion") + (upgrade === "extended" ? " (Extended)" : "");
		steps.push({
			kind: "brew",
			input: stage(potion, "potion", current),
			ingredients: [upgrade === "extended" ? "redstone" : "glowstone_dust"],
			output: stage(potion, "potion", upgraded),
		});
		current = upgraded;
	}

	if (form !== "potion") {
		const splash = fullName(potion, upgrade, "splash");
		steps.push({
			kind: "brew",
			input: stage(potion, "potion", current),
			ingredients: ["gunpowder"],
			output: stage(potion, "splash", splash),
		});
		current = splash;
	}
	if (form === "lingering" || form === "arrow") {
		const lingering = fullName(potion, upgrade, "lingering");
		steps.push({
			kind: "brew",
			input: stage(potion, "splash", current),
			ingredients: ["dragon_breath"],
			output: stage(potion, "lingering", lingering),
		});
		current = lingering;
	}
	if (form === "arrow") {
		steps.push({
			kind: "craft",
			input: stage(potion, "lingering", current),
			ingredients: ["arrow"],
			amount: 8,
			output: stage(potion, "arrow", `8 × ${fullName(potion, upgrade, "arrow")}`),
		});
	}
	return steps;
}

/** everything needed to make `bottles` potions (a brewing stand makes up to 3 at once) */
export function totals(steps: RecipeStep[], bottles: number) {
	const brews = Math.ceil(bottles / 3);
	const brewSteps = steps.filter((s) => s.kind === "brew");
	const items = new Map<string, number>();
	for (const step of steps) {
		const id = step.ingredients[0];
		items.set(
			id,
			(items.get(id) ?? 0) + (step.kind === "brew" ? brews : bottles) * (step.amount ?? 1),
		);
	}
	// one blaze powder fuels 20 brewing operations
	const operations = brews * brewSteps.length;
	const fuel = Math.ceil(operations / 20);

	return {
		brews,
		operations,
		fuel,
		items: [...items.entries()].map(([item, count]) => ({ item, count })),
	};
}

const ITEM_NAMES: Record<string, string> = {
	rabbit_foot: "Rabbit's Foot",
	turtle_helmet: "Turtle Shell",
	redstone: "Redstone Dust",
	glistering_melon_slice: "Glistering Melon Slice",
};

export const ingredientName = (id: string) =>
	ITEM_NAMES[id] ?? id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
