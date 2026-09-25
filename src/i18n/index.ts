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
import type { MessageKey, Messages } from "./messages";

export { LANGUAGES, type Language, type MessageKey };

interface GameText {
	version: string;
	/** item id -> official name */
	items: Record<string, string>;
	/** language key -> official text, e.g. "biome.minecraft.plains" */
	terms: Record<string, string>;
}

interface Text {
	messages: Messages;
	game: GameText;
}

const STORAGE_KEY = "language";
const loaders = import.meta.glob<GameText>("../data/lang/*.json", { import: "default" });
// one language's text at a time, the others only load when picked
const messageLoaders: Record<Language, () => Promise<Messages>> = {
	en: () => import("./messages/en").then((module) => module.en),
	"pt-BR": () => import("./messages/pt-BR").then((module) => module.ptBR),
	es: () => import("./messages/es").then((module) => module.es),
};
const loaded = new Map<Language, Promise<Text>>();
let messages = {} as Messages;
let game: GameText = { version: "", items: {}, terms: {} };

const listeners = new Set<() => void>();
let snapshot = { language: currentLanguage() };

/** the site text and the game names together, both requests at once */
function loadText(language: Language) {
	let text = loaded.get(language);
	if (!text) {
		text = Promise.all([
			messageLoaders[language](),
			loaders[`../data/lang/${language}.json`](),
		]).then(([siteText, gameText]) => ({ messages: siteText, game: gameText }));
		// a failed request can be tried again
		text.catch(() => loaded.delete(language));
		loaded.set(language, text);
	}
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

function apply(language: Language, text: Text) {
	messages = text.messages;
	game = text.game;
	setCurrentLanguage(language);
	document.documentElement.lang = language;
	snapshot = { language };
	for (const listener of listeners) listener();
}

/** before the first render, so every name is ready and nothing flashes in English */
export async function initI18n() {
	const language = detect();
	apply(language, await loadText(language));
}

async function setLanguage(language: Language) {
	const text = await loadText(language);
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

/** "Hello {name}" with vars; the type check makes sure every language has every key */
export function t(key: MessageKey, vars?: Record<string, string | number>) {
	const template = messages[key];
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
