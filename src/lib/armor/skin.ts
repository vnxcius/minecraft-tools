import type { Skin } from "./selection";

export const NICKNAME = /^\w{1,16}$/;

export type SkinError = "notFound" | "noSkin" | "network";

export class SkinLookupError extends Error {
	constructor(readonly reason: SkinError) {
		super(reason);
	}
}

interface Textures {
	textures?: { SKIN?: { url: string; metadata?: { model?: string } } };
}

/**
 * Skin of a Java Edition player. Mojang's API has no CORS headers, playerdb.co proxies the profile;
 * the texture itself comes straight from textures.minecraft.net, which allows cross-origin reads.
 */
export async function lookupSkin(nickname: string, signal?: AbortSignal): Promise<Skin> {
	let res: Response;
	try {
		res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(nickname)}`, {
			signal,
		});
	} catch (error) {
		if (signal?.aborted) throw error;
		throw new SkinLookupError("network");
	}
	// unknown names answer 400 with code "minecraft.invalid_username"
	if (res.status === 400 || res.status === 404) throw new SkinLookupError("notFound");
	if (!res.ok) throw new SkinLookupError("network");

	const body = (await res.json()) as {
		data?: { player?: { properties?: { name: string; value: string }[] } };
	};
	const property = body.data?.player?.properties?.find((p) => p.name === "textures");
	if (!property) throw new SkinLookupError("notFound");
	const skin = (JSON.parse(atob(property.value)) as Textures).textures?.SKIN;
	if (!skin) throw new SkinLookupError("noSkin");
	const url = skin.url.replace(/^http:/, "https:");
	await preload(url);
	return { url, slim: skin.metadata?.model === "slim" };
}

/** fails the lookup, instead of the 3D scene, when the texture can't be read; the scene then hits the cache */
function preload(url: string) {
	return new Promise<void>((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve();
		img.onerror = () => reject(new SkinLookupError("network"));
		img.src = url;
	});
}
