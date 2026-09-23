import versionsData from "@/data/versions.json";
import itemNames from "@/data/item-names.json";

export interface McVersion {
	id: string;
	source: string;
}

export interface Item {
	id: string;
	name: string;
	/** URL of the item icon on the mcitemgallery.com CDN */
	src: string;
}

const CDN = "https://mcitemgallery.com";

/** newest first */
export const versions: McVersion[] = versionsData;
export const latestVersion = versions[0];

// id -> icon folder, one lazily loaded chunk per version
const loaders = import.meta.glob<Record<string, string>>("../data/items/*.json", {
	import: "default",
});

export function resolveVersion(id?: string): McVersion {
	return versions.find((v) => v.id === id) ?? latestVersion;
}

export async function loadItems(version: McVersion): Promise<Item[]> {
	const folders = await loaders[`../data/items/${version.id}.json`]();
	return Object.entries(folders).map(([id, folder]) => ({
		id,
		name: (itemNames as Record<string, string>)[id] ?? id,
		src: `${CDN}/${version.source}/${folder}/${id}.png`,
	}));
}
