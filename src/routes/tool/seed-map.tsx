import { createFileRoute } from "@tanstack/react-router";
import SeedTool from "@/components/seedmap/seed-tool";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/seed-map")({
	// item icons that mark the structures on the map come from the latest version of the CDN catalog
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => ({
		meta: [
			{ title: "Seed Map | Useful Minecraft Tools" },
			{
				name: "description",
				content:
					"Explore the world of any seed: biomes, structures, strongholds and slime chunks, generated in your browser.",
			},
		],
	}),
	component: SeedPage,
});

function SeedPage() {
	const { icons } = Route.useLoaderData();
	return <SeedTool icons={icons} />;
}
