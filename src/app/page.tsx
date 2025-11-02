import { BoxIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { JSX } from "react";
import Footer from "@/components/footer";
import SectionSeparator from "@/components/section-separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	CalculatorIcon,
	ExternalLinkIcon,
	ListDetailsIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface ToolCard {
	icon: JSX.Element;
	title: string;
	description: string;
	href: Route;
}

export const metadata: Metadata = {
	title: "Home | Useful Minecraft Tools",
};

const ExploreButton = dynamic(() => import("./_components/explore-button"));

export default function Home() {
	const tools: ToolCard[] = [
		{
			icon: <CalculatorIcon />,
			title: "Stack Calculator",
			description:
				"Discover how a given amount of blocks are in item stacks or even chests and shulkers boxes. How many stacks are 456 blocks? Click to know!",
			href: "/tool/stack-calculator",
		},
		{
			icon: <BoxIcon />,
			title: "3D Armor Trim Viewer",
			description:
				"Visualize the armor trims before actually going before them. Go ahead and make some fashion!",
			href: "/tool/3d-armor-trim-viewer",
		},
		{
			icon: <ListDetailsIcon />,
			title: "Items Checklist",
			description:
				"You can make a blocks checklist for your next amazing building!",
			href: "/tool/item-checklist",
		},
	];
	return (
		<>
			<section className="px-12">
				<div className="relative border-x py-12">
					<div
						className={cn(
							"mask-[linear-gradient(to_bottom,transparent,black_50%,black)]",
							"-z-10 absolute inset-0 h-full w-full bg-position-[10px_0,0_14px] bg-size-[14px_14px]",
							"bg-[linear-gradient(to_right,#73737320_1px,transparent_1px),linear-gradient(to_bottom,#73737320_1px,transparent_1px)]",
						)}
					/>

					<Image
						src={"/minecraft_tools.webp"}
						width={794}
						height={216}
						alt="Minecraft Tools Logo"
						className="mx-auto block w-96"
					/>

					<div className="mx-auto my-6 w-fit max-w-2xl space-y-3 text-center">
						<p className="text-5xl text-green-600">
							Useful tools for Minecraft
						</p>
						<p className="text-gray-500 text-xl">
							This is a collection of Minecraft tools you can use for many in
							game purposes in Minecraft
						</p>

						<ExploreButton />
					</div>
				</div>
			</section>
			<SectionSeparator />
			<section className="px-12">
				<div className="border-x pb-56">
					<div className="mx-auto w-fit py-12 text-center">
						<h2 id="tools" className="text-3xl text-green-600">
							Tools
						</h2>
						<p className="text-gray-500">Just pick one</p>
					</div>

					<div className="mx-auto flex max-w-7xl flex-wrap items-stretch gap-6 px-6 *:flex-1">
						{tools.map((tool) => (
							<Link key={tool.title} href={tool.href} className="group block">
								<Card className="h-full">
									<CardHeader className="flex flex-nowrap items-center [&_svg]:min-h-5 [&_svg]:min-w-5 [&_svg]:text-primary">
										{tool.icon}
										<p className="truncate text-xl">{tool.title}</p>
										<ExternalLinkIcon className="size-5 min-w-5" />
									</CardHeader>
									<hr className="group-hover:border-primary/50" />
									<CardContent>
										<p className="min-w-48 text-justify">{tool.description}</p>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			</section>
			<SectionSeparator />
			<Footer />
		</>
	);
}
