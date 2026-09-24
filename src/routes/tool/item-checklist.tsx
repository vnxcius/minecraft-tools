import { createFileRoute } from "@tanstack/react-router";
import ItemChecklist from "@/components/item-checklist/item-checklist";
import { loadItems, resolveVersion } from "@/lib/items";

export const Route = createFileRoute("/tool/item-checklist")({
	// `?v=1.21.10`; anything unknown falls back to the latest version
	validateSearch: (search): { v?: string } => ({
		v: typeof search.v === "string" ? search.v : undefined,
	}),
	loaderDeps: ({ search }) => ({ v: search.v }),
	loader: async ({ deps }) => {
		const version = resolveVersion(deps.v);
		return { version, items: await loadItems(version) };
	},
	head: () => ({
		meta: [
			{ title: "Items Checklist | Useful Minecraft Tools" },
			{
				name: "description",
				content: "Make yourself a item list for building something cool!",
			},
		],
	}),
	component: ItemChecklistPage,
});

function ItemChecklistPage() {
	const { version, items } = Route.useLoaderData();
	const navigate = Route.useNavigate();

	return (
		<ItemChecklist
			items={items}
			version={version.id}
			onVersionChange={(v) => navigate({ search: { v }, replace: true })}
		/>
	);
}
