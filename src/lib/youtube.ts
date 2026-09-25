export interface YouTubeVideo {
	id: string;
	/** seconds into the video the link points at, from `t=` or `start=` */
	start?: number;
}

const HOSTS = /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtube-nocookie\.com)$/;
const ID = /^[\w-]{11}$/;

/** "90", "90s", "1m30s" or "1h2m3s" to seconds */
function parseTime(value: string | null) {
	if (!value) return undefined;
	const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
	if (!match) return undefined;
	const [, h = "0", m = "0", s = "0"] = match;
	const seconds = Number(h) * 3600 + Number(m) * 60 + Number(s);
	return seconds > 0 ? seconds : undefined;
}

/**
 * The video in a pasted YouTube link: watch pages, youtu.be, shorts, live and embed links, with or
 * without the https://. Null when it is not a YouTube video link.
 */
export function parseYouTube(input: string): YouTubeVideo | null {
	const text = input.trim();
	if (!text) return null;
	let url: URL;
	try {
		url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
	} catch {
		return null;
	}

	const host = url.hostname.toLowerCase();
	const segments = url.pathname.split("/").filter(Boolean);
	let id: string | null = null;
	if (host === "youtu.be" || host === "www.youtu.be") id = segments[0] ?? null;
	else if (HOSTS.test(host)) {
		if (segments[0] === "watch") id = url.searchParams.get("v");
		else if (["shorts", "embed", "live", "v"].includes(segments[0])) id = segments[1] ?? null;
	}
	if (!id || !ID.test(id)) return null;

	return { id, start: parseTime(url.searchParams.get("t") ?? url.searchParams.get("start")) };
}

/** privacy-enhanced embed: YouTube sets no cookies until the video is played */
export function embedUrl({ id, start }: YouTubeVideo) {
	const params = new URLSearchParams({ rel: "0" });
	if (start) params.set("start", String(start));
	return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

/** watch link, used to store the video */
export function watchUrl({ id, start }: YouTubeVideo) {
	return `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}` : ""}`;
}
