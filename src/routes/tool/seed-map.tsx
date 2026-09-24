import { createFileRoute } from "@tanstack/react-router";
import SeedTool from "@/components/seedmap/seed-tool";

export const Route = createFileRoute("/tool/seed-map")({
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
	component: SeedTool,
});
