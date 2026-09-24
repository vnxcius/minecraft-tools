import { createFileRoute } from "@tanstack/react-router";
import ArmorTrimViewer from "@/components/armor-trim/armor-trim-viewer";
import { latestVersion, loadItems } from "@/lib/items";

export const Route = createFileRoute("/tool/3d-armor-trim-viewer")({
	// item icons (armor, templates, materials) come from the latest version of the CDN catalog
	loader: async () => {
		const items = await loadItems(latestVersion);
		return { icons: Object.fromEntries(items.map((i) => [i.id, i.src])) };
	},
	head: () => ({
		meta: [
			{ title: "3D Armor Trim Viewer | Useful Minecraft Tools" },
			{
				name: "description",
				content: "Preview every armor and trim combination on an armor stand.",
			},
		],
	}),
	component: ArmorTrimPage,
});

function ArmorTrimPage() {
	const { icons } = Route.useLoaderData();
	return <ArmorTrimViewer icons={icons} />;
}
