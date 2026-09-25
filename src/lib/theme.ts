/**
 * Light, dark or the system's choice, saved as "theme" in localStorage. index.html applies it before
 * the first paint; this keeps it applied and follows the system when set to "system".
 */
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const KEY = "theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

function saved(): Theme {
	try {
		const value = localStorage.getItem(KEY);
		return value === "light" || value === "dark" ? value : "system";
	} catch {
		return "system";
	}
}

let state = resolve(saved());

function resolve(theme: Theme) {
	const dark = theme === "dark" || (theme === "system" && media.matches);
	return { theme, resolvedTheme: dark ? ("dark" as const) : ("light" as const) };
}

function apply() {
	const root = document.documentElement;
	root.classList.toggle("dark", state.resolvedTheme === "dark");
	root.style.colorScheme = state.resolvedTheme;
	for (const listener of listeners) listener();
}

function setTheme(theme: Theme) {
	try {
		localStorage.setItem(KEY, theme);
	} catch {
		// not remembered, still applied
	}
	state = resolve(theme);
	apply();
}

media.addEventListener("change", () => {
	if (state.theme !== "system") return;
	state = resolve("system");
	apply();
});

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export function useTheme() {
	const current = useSyncExternalStore(subscribe, () => state);
	return { ...current, setTheme };
}
