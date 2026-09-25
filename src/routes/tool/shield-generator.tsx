import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import BannerDesigner from "@/components/banner/banner-designer";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/shield-generator")({
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => pageHead("/tool/shield-generator"),
	component: ShieldPage,
});

function ShieldPage() {
	const { icons } = Route.useLoaderData();
	return <BannerDesigner icons={icons} kind="shield" />;
}
