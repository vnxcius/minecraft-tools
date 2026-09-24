import { createFileRoute } from "@tanstack/react-router";
import StackCalculator from "@/components/stack-calculator";

export const Route = createFileRoute("/tool/stack-calculator")({
	head: () => ({
		meta: [
			{ title: "Stack Calculator | Useful Minecraft Tools" },
			{
				name: "description",
				content: "Calculate how many stacks are a given number of items.",
			},
		],
	}),
	component: StackCalculator,
});
