import { useEffect, useSyncExternalStore } from "react";
import { type Tool, TOOLS } from "./tools";

const KEY = "recent-tools";
const KEEP = 5;

/** most recent first; paths that are no longer tools are dropped */
function load(): string[] {
	try {
		const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
		return Array.isArray(saved)
			? saved.filter((path) => TOOLS.some((tool) => tool.to === path))
			: [];
	} catch {
		return [];
	}
}

// in-memory copy of the localStorage history
let recent: string[] | null = null;
const listeners = new Set<() => void>();

const snapshot = () => (recent ??= load());

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function record(path: string) {
	const previous = snapshot();
	if (previous[0] === path) return;
	recent = [path, ...previous.filter((to) => to !== path)].slice(0, KEEP);
	try {
		localStorage.setItem(KEY, JSON.stringify(recent));
	} catch {
		// storage blocked: it is still remembered until the page closes
	}
	for (const listener of listeners) listener();
}

/** the tool used before the one on screen (the last one, on other pages) */
export function useLastUsedTool(current: Tool | undefined): Tool | undefined {
	const history = useSyncExternalStore(subscribe, snapshot);

	useEffect(() => {
		if (current) record(current.to);
	}, [current]);

	const path = history.find((to) => to !== current?.to);
	return TOOLS.find((tool) => tool.to === path);
}
