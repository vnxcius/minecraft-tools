import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	enchantmentById,
	GEAR,
	GIVE_ITEM,
	GROUPS,
	gearById,
	giveCommand,
	levelOf,
	ROMAN,
} from "@/lib/enchantments";
import { cn } from "@/lib/utils";

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
}

/** "Protection IV" / "Mending" */
function label(id: string, level: number) {
	const { name, max } = enchantmentById(id);
	return max === 1 ? name : `${name} ${ROMAN[level]}`;
}

export default function EnchantGuide({ icons }: Props) {
	const [gearId, setGearId] = useState("chestplate");
	const [buildIndex, setBuildIndex] = useState(0);
	const [copied, setCopied] = useState(false);

	const gear = gearById(gearId);
	const build = gear.builds[Math.min(buildIndex, gear.builds.length - 1)];
	const summary = build.picks.map((pick) => label(pick.id, levelOf(pick))).join(", ");
	const command = giveCommand(GIVE_ITEM[gear.id], build);

	const copy = async () => {
		await navigator.clipboard.writeText(command);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	};

	return (
		<section className="py-12">
			<h1 className="display mb-2 text-center text-4xl">Best Enchantments</h1>
			<p className="text-center text-muted-foreground">
				Pick an armor piece, tool or weapon and see the enchantments worth putting on it.
			</p>

			<Separator className="mx-auto my-4 max-w-lg" />

			<div className="mx-auto grid w-full max-w-5xl gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>Item</Heading>
					<div className="space-y-4 rounded border p-3">
						{GROUPS.map((group) => (
							<div key={group} className="space-y-1.5">
								<h3 className="text-muted-foreground text-sm">{group}</h3>
								<div className="flex flex-wrap gap-1">
									{GEAR.filter((g) => g.group === group).map((g) => (
										<Tooltip key={g.id}>
											<TooltipTrigger
												aria-label={g.name}
												aria-pressed={g.id === gearId}
												onClick={() => {
													setGearId(g.id);
													setBuildIndex(0);
												}}
												className={cn(
													"flex size-12 items-center justify-center rounded-sm hover:bg-accent",
													g.id === gearId &&
														"bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
												)}
											>
												<ItemIcon icons={icons} item={g.icon} className="size-9" />
											</TooltipTrigger>
											<TooltipContent>{g.name}</TooltipContent>
										</Tooltip>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading>Enchantments</Heading>

					<div className="flex items-center gap-4 rounded border bg-card p-4">
						<ItemIcon icons={icons} item={gear.icon} className="size-14" />
						<div className="min-w-0">
							<p className="font-pixel text-xl">{gear.name}</p>
							<p className="mt-1 text-[#b8a2ff] text-sm">{summary}</p>
						</div>
					</div>

					{gear.builds.length > 1 && (
						<div role="radiogroup" aria-label="Build" className="flex flex-wrap gap-1">
							{gear.builds.map((b, i) => (
								<button
									key={b.name}
									type="button"
									role="radio"
									aria-checked={build === b}
									onClick={() => setBuildIndex(i)}
									className={cn(
										"rounded border px-3 py-1.5 text-sm hover:bg-accent",
										build === b && "border-primary bg-primary/20 hover:bg-primary/30",
									)}
								>
									{b.name}
								</button>
							))}
						</div>
					)}

					<ul className="divide-y rounded border">
						{build.picks.map((pick) => {
							const level = levelOf(pick);
							return (
								<li key={pick.id} className="flex items-center gap-3 px-3 py-2">
									<ItemIcon icons={icons} item="book" className="size-7" />
									<div className="min-w-0 flex-1">
										<p className="text-sm">{enchantmentById(pick.id).name}</p>
										<p className="text-muted-foreground text-xs">{pick.why}</p>
									</div>
									<span className="rounded bg-[#8a5cf5]/20 px-2 py-0.5 text-[#b8a2ff] text-sm tabular-nums">
										{enchantmentById(pick.id).max === 1 ? "Max" : ROMAN[level]}
									</span>
								</li>
							);
						})}
					</ul>

					{build.note && <p className="text-muted-foreground text-xs">Tip: {build.note}</p>}

					{gear.conflicts && (
						<div className="space-y-1 rounded border border-dashed p-3">
							<h3 className="text-muted-foreground text-sm">Cannot go together</h3>
							<ul className="list-disc space-y-0.5 pl-5 text-muted-foreground text-xs">
								{gear.conflicts.map((conflict) => (
									<li key={conflict}>{conflict}</li>
								))}
							</ul>
						</div>
					)}

					<Heading>Command</Heading>
					<div className="flex items-start gap-2 rounded border bg-card p-3">
						<code className="min-w-0 flex-1 break-all text-xs leading-relaxed">{command}</code>
						<Button variant="outline" size="icon-sm" aria-label="Copy command" onClick={copy}>
							{copied ? <CheckIcon /> : <CopyIcon />}
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
