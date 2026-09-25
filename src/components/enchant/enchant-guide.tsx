import { Check as CheckIcon, Copy as CopyIcon } from "pixelarticons/react";
import { useState } from "react";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type MessageKey, useI18n } from "@/i18n";
import { rich } from "@/i18n/rich";
import {
	buildName,
	enchantmentById,
	enchantmentName,
	GEAR,
	GIVE_ITEM,
	GROUPS,
	gearById,
	gearName,
	giveCommand,
	groupName,
	levelName,
	levelOf,
} from "@/lib/enchantments";
import { cn } from "@/lib/utils";

/** fills the {enchantment_id} placeholders of a tip with the official names, colored as in game */
function WithEnchantments({ template }: { template: MessageKey }) {
	const { t } = useI18n();
	const text = t(template);
	const ids = [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
	return rich(
		text,
		Object.fromEntries(
			ids.map((id) => [
				id,
				<span key={id} className="text-[#b8a2ff]">
					{enchantmentName(id)}
				</span>,
			]),
		),
	);
}

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
}

function label(id: string, level: number) {
	const name = enchantmentName(id);
	return enchantmentById(id).max === 1 ? name : `${name} ${levelName(level)}`;
}

export default function EnchantGuide({ icons }: Props) {
	const [gearId, setGearId] = useState("chestplate");
	const [buildIndex, setBuildIndex] = useState(0);
	const [copied, setCopied] = useState(false);
	const { t, itemName } = useI18n();

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
		<section>
			<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{t("enchant.item")}</Heading>
					<div className="space-y-4 rounded border p-3">
						{GROUPS.map((group) => (
							<div key={group} className="space-y-1.5">
								<h3 className="text-sm text-muted-foreground">{groupName(group)}</h3>
								<div className="flex flex-wrap gap-1">
									{GEAR.filter((g) => g.group === group).map((g) => (
										<Tooltip key={g.id}>
											<TooltipTrigger
												aria-label={gearName(g)}
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
											<TooltipContent>{gearName(g)}</TooltipContent>
										</Tooltip>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading>{t("enchant.enchantments")}</Heading>

					<div className="flex items-center gap-4 rounded border bg-card p-4">
						<ItemIcon icons={icons} item={gear.icon} className="size-14" />
						<div className="min-w-0">
							<p className="font-pixel text-xl">{gearName(gear)}</p>
							<p className="mt-1 font-pixel text-sm text-[#b8a2ff]">{summary}</p>
						</div>
					</div>

					{gear.builds.length > 1 && (
						<div
							role="radiogroup"
							aria-label={t("enchant.buildLabel")}
							className="flex flex-wrap gap-1"
						>
							{gear.builds.map((b, i) => (
								<button
									key={buildName(b)}
									type="button"
									role="radio"
									aria-checked={build === b}
									onClick={() => setBuildIndex(i)}
									className={cn(
										"tile bg-secondary px-3 pt-1.5 pb-2 text-sm hover:bg-accent",
										build === b &&
											"border-primary bg-primary/25 hover:border-primary hover:bg-primary/35",
									)}
								>
									{buildName(b)}
								</button>
							))}
						</div>
					)}

					<ul className="divide-y rounded border">
						{build.picks.map((pick) => {
							const level = levelOf(pick);
							return (
								<li key={pick.id} className="flex items-center gap-3 px-3 py-2">
									<img
										src="/tools/enchanted_book.png"
										className="size-7"
										width={28}
										height={28}
										alt={itemName("enchanted_book")}
									/>
									<div className="min-w-0 flex-1">
										<p className="font-pixel text-base">{enchantmentName(pick.id)}</p>
										<p className="text-xs text-muted-foreground">
											<WithEnchantments template={pick.why} />
										</p>
									</div>
									<span className="rounded bg-[#8a5cf5]/20 px-2 py-0.5 font-pixel text-sm text-[#b8a2ff] tabular-nums">
										{enchantmentById(pick.id).max === 1 ? t("enchant.max") : levelName(level)}
									</span>
								</li>
							);
						})}
					</ul>

					{build.note && (
						<p className="text-xs text-muted-foreground">
							{rich(t("enchant.tip"), { text: <WithEnchantments template={build.note} /> })}
						</p>
					)}

					{gear.conflicts && (
						<div className="space-y-1 rounded border border-dashed p-3">
							<h3 className="text-sm font-medium text-muted-foreground/80">
								{t("enchant.cannotGoTogether")}
							</h3>
							<ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
								{gear.conflicts.map((conflict) => (
									<li key={conflict}>
										<WithEnchantments template={conflict} />
									</li>
								))}
							</ul>
						</div>
					)}

					<Heading>{t("enchant.command")}</Heading>
					<div className="flex items-start gap-2 rounded border bg-card p-3">
						<code className="min-w-0 flex-1 text-xs leading-relaxed break-all">{command}</code>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label={t("enchant.copyCommand")}
							onClick={copy}
						>
							{copied ? <CheckIcon /> : <CopyIcon />}
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
