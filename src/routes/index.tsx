import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import SectionSeparator from "@/components/section-separator";
import { TOOLS } from "@/components/tools";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Home | Useful Minecraft Tools" }] }),
	component: Home,
});

function Home() {
	return (
		<>
			<section className="relative overflow-hidden px-6 py-24 text-center">
				<div
					aria-hidden
					className="pixelated absolute inset-0 -z-10 bg-[url(/decor/stone.png)] bg-[length:64px] opacity-[0.07] [mask-image:linear-gradient(to_bottom,black,transparent)]"
				/>
				<h1 className="display mx-auto max-w-3xl text-5xl leading-tight sm:text-6xl">
					Useful tools for Minecraft
				</h1>
				<p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
					A small collection of calculators, designers and viewers for the things you do in game
					every day.
				</p>
				<div className="mt-8 flex flex-wrap justify-center gap-3">
					<Button nativeButton={false} render={<Link to="/" hash="tools" />}>
						Explore tools
						<ArrowRightIcon />
					</Button>
					<Button
						variant="outline"
						nativeButton={false}
						render={
							<a
								href="https://github.com/vnxcius/vnciusdev"
								target="_blank"
								rel="noopener noreferrer"
							/>
						}
					>
						View source
					</Button>
				</div>
			</section>

			<SectionSeparator />

			<section id="tools" className="scroll-mt-16">
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 [&>*]:border-b [&>*]:border-border sm:[&>*:nth-child(odd)]:border-r lg:[&>*:nth-child(odd)]:border-r-0 lg:[&>*:not(:nth-child(3n))]:border-r">
					{TOOLS.map(({ to, title, description, icon: Icon }) => (
						<Link key={to} to={to} className="group flex flex-col gap-3 p-6 hover:bg-card">
							<div className="flex items-center gap-2">
								<Icon size={18} className="text-brand" />
								<h2 className="font-pixel text-lg">{title}</h2>
								<ArrowRightIcon className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
							</div>
							<p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
						</Link>
					))}
					<div className="flex flex-col gap-3 p-6 text-muted-foreground text-sm">
						<h2 className="font-pixel text-lg">More on the way</h2>
						<p className="leading-relaxed">Got an idea for a tool? Open an issue on GitHub.</p>
					</div>
				</div>
			</section>

			<SectionSeparator />
		</>
	);
}
