import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import BannerDesigner from "@/components/banner/banner-designer";
import { iconMap, latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/shield-generator")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: iconMap(items) };
	},
	head: () => pageHead("/tool/shield-generator"),
	component: ShieldPage,
});

function ShieldPage() {
	const { icons } = Route.useLoaderData();
	return <BannerDesigner icons={icons} kind="shield" />;
}
