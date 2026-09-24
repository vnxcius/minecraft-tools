import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import StackCalculator from "@/components/stack-calculator";

export const Route = createFileRoute("/tool/stack-calculator")({
	head: () => pageHead("/tool/stack-calculator"),
	component: StackCalculator,
});
