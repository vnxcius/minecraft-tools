/**
 * Brewing data (Java Edition). Brewing recipes are hard-coded in the game and are not part of the
 * client assets, so they are described here. Textures come from `bun run potions:sync`.
 * Every name is the game's own, looked up by id in its language files (see src/i18n).
 */
import { itemName, type MessageKey, t, term } from "@/i18n";

export type Form = "potion" | "splash" | "lingering" | "arrow";
export type Upgrade = "none" | "extended" | "enhanced";

export const FORMS: { id: Form; item: string }[] = [
	{ id: "potion", item: "potion" },
	{ id: "splash", item: "splash_potion" },
	{ id: "lingering", item: "lingering_potion" },
	{ id: "arrow", item: "tipped_arrow" },
];

const FORM_ITEM = Object.fromEntries(FORMS.map((f) => [f.id, f.item])) as Record<Form, string>;

export interface PotionEffect {
	/** effect id, also the texture in public/potion/effect */
	icon: string;
}

export interface Potion {
	/** potion id of the game, e.g. "swiftness" */
	id: string;
	color: string;
	/** the potion this one is brewed from and the ingredients that do it (first one is the classic) */
	from?: { potion: string; ingredients: string[] };
	effects?: PotionEffect[];
	/** seconds of the drinkable potion, missing for instant potions and potions without effect */
	duration?: number;
	instant?: boolean;
	/** duration with redstone */
	extended?: number;
	/** what glowstone dust changes: the effect level (2 for "II") and the new duration */
	enhanced?: { level: number; duration?: number };
	/** other way to brew it, shown as a tip */
	note?: MessageKey;
	/** extra detail shown with the effect, e.g. the levels of a two effect potion */
	detail?: MessageKey;
}

const WATER_COLOR = "#385dc6";

const POTIONS: Potion[] = [
	{ id: "water", color: WATER_COLOR },
	{
		id: "awkward",
		color: WATER_COLOR,
		from: { potion: "water", ingredients: ["nether_wart"] },
	},
	{
		id: "mundane",
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
		note: "potion.note.mundane",
	},
	{
		id: "thick",
		color: WATER_COLOR,
		from: { potion: "water", ingredients: ["glowstone_dust"] },
	},
	{
		id: "night_vision",
		color: "#1f1fa1",
		from: { potion: "awkward", ingredients: ["golden_carrot"] },
		effects: [{ icon: "night_vision" }],
		duration: 180,
		extended: 480,
	},
	{
		id: "invisibility",
		color: "#7f8392",
		from: { potion: "night_vision", ingredients: ["fermented_spider_eye"] },
		effects: [{ icon: "invisibility" }],
		duration: 180,
		extended: 480,
	},
	{
		id: "leaping",
		color: "#22ff4c",
		from: { potion: "awkward", ingredients: ["rabbit_foot"] },
		effects: [{ icon: "jump_boost" }],
		duration: 180,
		extended: 480,
		enhanced: { level: 2, duration: 90 },
	},
	{
		id: "fire_resistance",
		color: "#e49a3a",
		from: { potion: "awkward", ingredients: ["magma_cream"] },
		effects: [{ icon: "fire_resistance" }],
		duration: 180,
		extended: 480,
	},
	{
		id: "swiftness",
		color: "#33ebff",
		from: { potion: "awkward", ingredients: ["sugar"] },
		effects: [{ icon: "speed" }],
		duration: 180,
		extended: 480,
		enhanced: { level: 2, duration: 90 },
	},
	{
		id: "slowness",
		color: "#8bafe0",
		// swiftness or leaping, both work
		from: { potion: "swiftness", ingredients: ["fermented_spider_eye"] },
		note: "potion.note.slowness",
		effects: [{ icon: "slowness" }],
		duration: 90,
		extended: 240,
		enhanced: { level: 4, duration: 20 },
	},
	{
		id: "water_breathing",
		color: "#2e5299",
		from: { potion: "awkward", ingredients: ["pufferfish"] },
		effects: [{ icon: "water_breathing" }],
		duration: 180,
		extended: 480,
	},
	{
		id: "healing",
		color: "#f82423",
		from: { potion: "awkward", ingredients: ["glistering_melon_slice"] },
		effects: [{ icon: "instant_health" }],
		instant: true,
		enhanced: { level: 2 },
	},
	{
		id: "harming",
		color: "#a9656a",
		// healing or poison, both work
		from: { potion: "healing", ingredients: ["fermented_spider_eye"] },
		note: "potion.note.harming",
		effects: [{ icon: "instant_damage" }],
		instant: true,
		enhanced: { level: 2 },
	},
	{
		id: "poison",
		color: "#87a363",
		from: { potion: "awkward", ingredients: ["spider_eye"] },
		effects: [{ icon: "poison" }],
		duration: 45,
		extended: 90,
		enhanced: { level: 2, duration: 21 },
	},
	{
		id: "regeneration",
		color: "#cd5cab",
		from: { potion: "awkward", ingredients: ["ghast_tear"] },
		effects: [{ icon: "regeneration" }],
		duration: 45,
		extended: 90,
		enhanced: { level: 2, duration: 22 },
	},
	{
		id: "strength",
		color: "#932423",
		from: { potion: "awkward", ingredients: ["blaze_powder"] },
		effects: [{ icon: "strength" }],
		duration: 180,
		extended: 480,
		enhanced: { level: 2, duration: 90 },
	},
	{
		id: "weakness",
		color: "#484d48",
		from: { potion: "water", ingredients: ["fermented_spider_eye"] },
		effects: [{ icon: "weakness" }],
		duration: 90,
		extended: 240,
	},
	{
		id: "turtle_master",
		color: "#8bafe0",
		from: { potion: "awkward", ingredients: ["turtle_helmet"] },
		effects: [{ icon: "slowness" }, { icon: "resistance" }],
		duration: 20,
		extended: 40,
		enhanced: { level: 2, duration: 20 },
		detail: "potion.detail.turtleMaster",
	},
	{
		id: "slow_falling",
		color: "#f3cfb9",
		from: { potion: "awkward", ingredients: ["phantom_membrane"] },
		effects: [{ icon: "slow_falling" }],
		duration: 90,
		extended: 240,
	},
	{
		id: "wind_charged",
		color: "#bdc9ff",
		from: { potion: "awkward", ingredients: ["breeze_rod"] },
		effects: [{ icon: "wind_charged" }],
		duration: 180,
	},
	{
		id: "weaving",
		color: "#78695a",
		from: { potion: "awkward", ingredients: ["cobweb"] },
		effects: [{ icon: "weaving" }],
		duration: 180,
	},
	{
		id: "oozing",
		color: "#99ffa3",
		from: { potion: "awkward", ingredients: ["slime_block"] },
		effects: [{ icon: "oozing" }],
		duration: 180,
	},
	{
		id: "infested",
		color: "#8c9b8c",
		from: { potion: "awkward", ingredients: ["stone"] },
		effects: [{ icon: "infested" }],
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

function formatDuration(seconds: number) {
	const total = Math.round(seconds);
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** official name of the plain potion, "Potion of Swiftness" / "Awkward Potion" */
export const potionName = (potion: Potion) => term(`item.minecraft.potion.effect.${potion.id}`);

export const effectName = (effect: PotionEffect) => term(`effect.minecraft.${effect.icon}`);

/** the game's numeral for an effect level: 2 -> "II" */
export const potency = (level: number) => term(`potion.potency.${level - 1}`);

/** a message whose {id} placeholders are filled by `name(id)` */
function fill(key: MessageKey, name: (id: string) => string) {
	const ids = [...t(key).matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
	return t(key, Object.fromEntries(ids.map((id) => [id, name(id)])));
}

/** the tip of a potion, its {potion} placeholders filled with official potion names */
export const potionNote = (potion: Potion) =>
	potion.note && fill(potion.note, (id) => potionName(potionById(id)));

/** the detail of a potion, its {effect} placeholders filled with official effect names */
export const potionDetail = (potion: Potion) =>
	potion.detail && fill(potion.detail, (id) => term(`effect.minecraft.${id}`));

/** final effect summary for the selected potion, e.g. { level: "II", time: "1:30" } */
export function effectSummary(potion: Potion, upgrade: Upgrade, form: Form) {
	if (!potion.effects) return null;
	const amplifier = upgrade === "enhanced" ? potion.enhanced?.level : undefined;
	const level = amplifier ? potency(amplifier) : undefined;
	if (potion.instant) return { level, time: t("potion.instant") };
	const base =
		upgrade === "extended"
			? potion.extended
			: upgrade === "enhanced"
				? (potion.enhanced?.duration ?? potion.duration)
				: potion.duration;
	return { level, time: formatDuration((base ?? 0) * DURATION_FACTOR[form]) };
}

/** the name the game gives the item, "Splash Potion of Swiftness II" in every language */
export function fullName(potion: Potion, upgrade: Upgrade, form: Form) {
	const name = term(`item.minecraft.${FORM_ITEM[form]}.effect.${potion.id}`);
	return upgrade === "enhanced" && potion.enhanced
		? `${name} ${potency(potion.enhanced.level)}`
		: name;
}

interface StageIcon {
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
			upgrade === "extended"
				? t("potion.extendedName", { name: fullName(potion, upgrade, "potion") })
				: fullName(potion, upgrade, "potion");
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

export const ingredientName = (id: string) => itemName(id);
