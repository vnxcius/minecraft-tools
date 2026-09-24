import { createFileRoute } from "@tanstack/react-router";
import BannerDesigner from "@/components/banner/banner-designer";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/banner-crafting")({
	// item icons (wool, dyes, pattern items) come from the latest version of the CDN catalog
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => ({
		meta: [
			{ title: "Banner Designer | Useful Minecraft Tools" },
			{
				name: "description",
				content:
					"Design banners with every pattern and dye, and get the materials list and command.",
			},
		],
	}),
	component: BannerPage,
});

function BannerPage() {
	const { icons } = Route.useLoaderData();
	return <BannerDesigner icons={icons} />;
}
