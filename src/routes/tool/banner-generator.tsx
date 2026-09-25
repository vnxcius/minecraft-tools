import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import BannerDesigner from "@/components/banner/banner-designer";
import { iconMap, latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/banner-generator")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: iconMap(items) };
	},
	head: () => pageHead("/tool/banner-generator"),
	component: BannerPage,
});

function BannerPage() {
	const { icons } = Route.useLoaderData();
	return <BannerDesigner icons={icons} />;
}
