import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * A unique id for list keys. crypto.randomUUID only exists on secure pages (https or localhost), so it
 * breaks on a phone opening the dev server by its network address; getRandomValues works anywhere.
 */
export function uid() {
	return Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(36)).join("");
}
