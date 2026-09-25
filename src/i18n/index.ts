/**
 * Translations. Two sources:
 *   - the site's own text, written by hand in ./messages (typed: every language has every key)
 *   - game names (items, biomes, enchantments...) taken from Minecraft's official language files by
 *     `bun run lang:sync` into src/data/lang, so they read exactly like in game
 *
 * Components call `useI18n()`, which re-renders them when the language changes. Plain functions
 * (`t`, `term`, `itemName`) read the same state for data code that builds names.
 */
import { useMemo, useSyncExternalStore } from "react";
import {
	currentLanguage,
	isLanguage,
	LANGUAGES,
	type Language,
	setCurrentLanguage,
} from "./current";
import { MESSAGES, type MessageKey } from "./messages";

export { LANGUAGES, type Language, type MessageKey };

interface GameText {
	version: string;
	/** item id -> official name */
	items: Record<string, string>;
	/** language key -> official text, e.g. "biome.minecraft.plains" */
	terms: Record<string, string>;
}

const STORAGE_KEY = "language";
const loaders = import.meta.glob<GameText>("../data/lang/*.json", { import: "default" });
const loaded = new Map<Language, GameText>();
let game: GameText = { version: "", items: {}, terms: {} };

const listeners = new Set<() => void>();
let snapshot = { language: currentLanguage() };

async function loadGame(language: Language) {
	const cached = loaded.get(language);
	if (cached) return cached;
	const text = await loaders[`../data/lang/${language}.json`]();
	loaded.set(language, text);
	return text;
}

/** saved choice, else the browser's language, else English */
function detect(): Language {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (isLanguage(saved)) return saved;
	} catch {
		// storage blocked, fall through
	}
	for (const tag of navigator.languages ?? [navigator.language]) {
		const lower = tag.toLowerCase();
		if (lower.startsWith("pt")) return "pt-BR";
		if (lower.startsWith("es")) return "es";
		if (lower.startsWith("en")) return "en";
	}
	return "en";
}

function apply(language: Language, text: GameText) {
	game = text;
	setCurrentLanguage(language);
	document.documentElement.lang = language;
	snapshot = { language };
	for (const listener of listeners) listener();
}

/** before the first render, so every name is ready and nothing flashes in English */
export async function initI18n() {
	const language = detect();
	apply(language, await loadGame(language));
}

async function setLanguage(language: Language) {
	const text = await loadGame(language);
	try {
		localStorage.setItem(STORAGE_KEY, language);
	} catch {
		// not remembered, still switched
	}
	apply(language, text);
}

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

/** "Hello {name}" with vars; a key missing in a language falls back to English */
export function t(key: MessageKey, vars?: Record<string, string | number>) {
	const template = MESSAGES[currentLanguage()][key] ?? MESSAGES.en[key];
	return vars
		? template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`))
		: template;
}

/** keys that come as a ".one" / ".other" pair */
type PluralBase = MessageKey extends infer K ? (K extends `${infer B}.one` ? B : never) : never;

/** a count with the right plural form: tn("stack.items", 1) -> "1 item", 2 -> "2 items" */
function tn(base: PluralBase, count: number, vars?: Record<string, string | number>) {
	// Portuguese plural rules count 0 as singular ("0 pilha"); people write "0 packs"
	const one = count !== 0 && new Intl.PluralRules(currentLanguage()).select(count) === "one";
	const form = one ? "one" : "other";
	return t(`${base}.${form}` as MessageKey, { count, ...vars });
}

/** an official game text by its language key, e.g. term("biome.minecraft.plains") */
export const term = (key: string) => game.terms[key] ?? key;

export const maybeTerm = (key: string): string | undefined => game.terms[key];

export const itemName = (id: string) => game.items[id] ?? id.replace(/_/g, " ");

/** lowercase without accents, so "pocao" finds "Poção" */
export const fold = (text: string) =>
	text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();

/**
 * The language and its lookups. The functions get a new identity when the language changes, so a
 * useMemo / useEffect that lists them runs again for the new language.
 */
export function useI18n() {
	const { language } = useSyncExternalStore(subscribe, () => snapshot);
	return useMemo(
		() => ({
			language,
			setLanguage,
			t: ((...args) => t(...args)) as typeof t,
			tn: ((...args) => tn(...args)) as typeof tn,
			term: (key: string) => term(key),
			itemName: (id: string) => itemName(id),
		}),
		[language],
	);
}
