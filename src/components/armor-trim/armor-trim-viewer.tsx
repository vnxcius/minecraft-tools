import { Cancel as CancelIcon } from "pixelarticons/react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import armorData from "@/data/armor.json";
import { type ArmorSelection, SLOTS, type Slot, type TrimSelection } from "@/lib/armor/selection";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

// three.js is most of the page's code: the choices show while it loads
const ArmorViewer = lazy(() => import("./armor-viewer"));

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
}

function IconButton({
	label,
	selected,
	onClick,
	children,
}: {
	label: string;
	selected: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<Tooltip>
			<TooltipTrigger
				aria-label={label}
				aria-pressed={selected}
				onClick={onClick}
				className={cn(
					"flex size-10 items-center justify-center rounded-sm p-1 hover:bg-accent",
					selected && "bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
				)}
			>
				{children}
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

const NoneIcon = () => <CancelIcon className="size-5 text-muted-foreground" />;

export default function ArmorTrimViewer({ icons }: Props) {
	const [armor, setArmor] = useState<ArmorSelection>({
		helmet: "diamond",
		chestplate: "diamond",
		leggings: "diamond",
		boots: "diamond",
	});
	const { t, term, itemName } = useI18n();
	const slotName = (slot: Slot) => t(`armor.slot.${slot}`);
	const patternName = (id: string) => term(`trim_pattern.minecraft.${id}`);
	const materialName = (id: string) => term(`trim_material.minecraft.${id}`);
	const [pattern, setPattern] = useState<string | null>("coast");
	const [material, setMaterial] = useState("gold");
	const [trimSlots, setTrimSlots] = useState<Slot[]>([...SLOTS]);

	const trim = useMemo<TrimSelection | null>(
		() => (pattern ? { pattern, material, slots: trimSlots } : null),
		[pattern, material, trimSlots],
	);

	const toggleSlot = (slot: Slot) =>
		setTrimSlots((prev) =>
			prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
		);

	return (
		<section>
			<div className="relative">
				<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
					<div className="flex min-w-0 flex-col gap-3">
						<div className="flex h-9 items-center">
							<h2 className="font-bold">{t("armor.armor")}</h2>
						</div>

						<Suspense fallback={<div className="h-[55svh] min-h-80 rounded-md border bg-card" />}>
							<ArmorViewer armor={armor} trim={trim} className="h-[55svh] min-h-80" />
						</Suspense>

						<div className="space-y-2 rounded-md border p-3">
							{SLOTS.map((slot) => (
								<div key={slot} className="flex items-center gap-3">
									<span className="w-24 shrink-0 text-sm text-muted-foreground">
										{slotName(slot)}
									</span>
									<div className="flex flex-wrap gap-0.5">
										<IconButton
											label={t("armor.none")}
											selected={armor[slot] === null}
											onClick={() => setArmor((prev) => ({ ...prev, [slot]: null }))}
										>
											<NoneIcon />
										</IconButton>
										{armorData.armor
											.filter((a) => (a.slots as string[]).includes(slot))
											.map((a) => (
												<IconButton
													key={a.id}
													label={itemName(`${a.itemPrefix}_${slot}`)}
													selected={armor[slot] === a.id}
													onClick={() => setArmor((prev) => ({ ...prev, [slot]: a.id }))}
												>
													<img
														src={icons[`${a.itemPrefix}_${slot}`]}
														alt=""
														width={32}
														height={32}
														className="size-8"
													/>
												</IconButton>
											))}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="flex min-w-0 flex-col gap-3">
						<div className="flex h-9 items-center justify-between">
							<h2 className="font-bold">{t("armor.trim")}</h2>
							<span className="text-sm text-muted-foreground">
								{pattern
									? `${patternName(pattern)} · ${materialName(material)}`
									: t("armor.noTrim")}
							</span>
						</div>

						<div className="space-y-4 rounded-md border p-3">
							<div className="space-y-1.5">
								<h3 className="text-sm text-muted-foreground">{t("armor.pattern")}</h3>
								<div className="flex flex-wrap gap-0.5">
									<IconButton
										label={t("armor.none")}
										selected={pattern === null}
										onClick={() => setPattern(null)}
									>
										<NoneIcon />
									</IconButton>
									{armorData.patterns.map((p) => (
										<IconButton
											key={p.id}
											label={patternName(p.id)}
											selected={pattern === p.id}
											onClick={() => setPattern(p.id)}
										>
											<img src={icons[p.item]} alt="" width={32} height={32} className="size-8" />
										</IconButton>
									))}
								</div>
							</div>

							<div className="space-y-1.5">
								<h3 className="text-sm text-muted-foreground">{t("armor.material")}</h3>
								<div className="flex flex-wrap gap-0.5">
									{armorData.materials.map((m) => (
										<IconButton
											key={m.id}
											label={materialName(m.id)}
											selected={material === m.id}
											onClick={() => setMaterial(m.id)}
										>
											<img src={icons[m.item]} alt="" width={32} height={32} className="size-8" />
										</IconButton>
									))}
								</div>
							</div>

							<div className="space-y-1.5">
								<h3 className="text-sm text-muted-foreground">{t("armor.applyTo")}</h3>
								<div className="grid grid-cols-2 gap-2">
									{SLOTS.map((slot) => (
										<label key={slot} className="flex cursor-pointer items-center gap-2 text-sm">
											<Checkbox
												checked={trimSlots.includes(slot)}
												onCheckedChange={() => toggleSlot(slot)}
											/>
											{slotName(slot)}
										</label>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
