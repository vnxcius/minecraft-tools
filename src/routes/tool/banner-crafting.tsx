import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import BannerDesigner from "@/components/banner/banner-designer";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/banner-crafting")({
	// item icons (wool, dyes, pattern items) come from the latest version of the CDN catalog
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => pageHead("/tool/banner-crafting"),
	component: BannerPage,
});

function BannerPage() {
	const { icons } = Route.useLoaderData();
	return <BannerDesigner icons={icons} />;
}
