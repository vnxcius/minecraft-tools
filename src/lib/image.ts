const images = new Map<string, Promise<HTMLImageElement>>();

/** loads (and caches) an image */
export function loadImage(url: string) {
	let image = images.get(url);
	if (!image) {
		image = new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error(`Failed to load ${url}`));
			img.src = url;
		});
		images.set(url, image);
	}
	return image;
}
