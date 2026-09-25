/**
 * The language of the site, kept apart from the rest of i18n: plain TypeScript with no browser or
 * Vite imports, so src/lib/seo.ts can read it and the prerender script can still import seo.ts.
 */
export const LANGUAGES = [
	{ id: "en", name: "English" },
	{ id: "pt-BR", name: "Português (Brasil)" },
	{ id: "es", name: "Español (España)" },
] as const;

export type Language = (typeof LANGUAGES)[number]["id"];

let current: Language = "en";

export const currentLanguage = () => current;

export function setCurrentLanguage(language: Language) {
	current = language;
}

export const isLanguage = (value: unknown): value is Language =>
	LANGUAGES.some((language) => language.id === value);
