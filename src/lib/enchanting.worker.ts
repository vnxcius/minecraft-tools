/**
 * Works out enchanting table odds off the main thread: a book has dozens of candidates and takes a
 * second or two the first time. Requests are { id, era, item, costs } where `costs` is the chance
 * of each level cost (index = cost); the answer is { id, odds } or { id, error }.
 */
import { costOdds, ERAS, type Odds } from "./enchanting";

export interface OddsRequest {
	id: number;
	era: number;
	item: string;
	costs: number[];
}

export interface OddsResponse {
	id: number;
	/** chance of each enchantment, by "id level" and by id alone */
	enchantments?: [string, number][];
	counts?: number[];
	error?: string;
}

const ctx = self as unknown as {
	postMessage: (message: OddsResponse) => void;
	onmessage: ((event: MessageEvent<OddsRequest>) => void) | null;
};

// the odds of each value, kept per item for as long as the page is open
const caches = new Map<string, Map<number, Odds>>();

ctx.onmessage = ({ data: { id, era, item, costs } }) => {
	try {
		const key = `${era}:${item}`;
		let cache = caches.get(key);
		if (!cache) caches.set(key, (cache = new Map()));
		const enchantments = new Map<string, number>();
		const counts: number[] = [];
		const total = costs.reduce((a, b) => a + b, 0);
		costs.forEach((chance, cost) => {
			if (!chance || !cost) return;
			const odds = costOdds(ERAS[era], item, cost, cache);
			const weight = chance / total;
			for (const [name, p] of odds.enchantments)
				enchantments.set(name, (enchantments.get(name) ?? 0) + p * weight);
			odds.counts.forEach((p, n) => (counts[n] = (counts[n] ?? 0) + p * weight));
		});
		ctx.postMessage({
			id,
			enchantments: [...enchantments],
			counts: Array.from(counts, (p) => p ?? 0),
		});
	} catch (error) {
		ctx.postMessage({ id, error: String(error) });
	}
};
