import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
	title: "Stack Calculator | Useful Minecraft Tools",
	description: "Calculate how many stacks are a given number of items.",
};

const StackCalculator = dynamic(() => import("./_components/stack-calculator"));

export default function Page() {
	return <StackCalculator />;
}
