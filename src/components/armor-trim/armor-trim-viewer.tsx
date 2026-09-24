import { BanIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import armorData from "@/data/armor.json";
import { type ArmorSelection, SLOTS, type Slot, type TrimSelection } from "@/lib/armor/scene";
import { cn } from "@/lib/utils";
import ArmorViewer from "./armor-viewer";

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
}

const SLOT_LABELS: Record<Slot, string> = {
	helmet: "Helmet",
	chestplate: "Chestplate",
	leggings: "Leggings",
	boots: "Boots",
};

/** square icon button with a tooltip, highlighted like the selected cells of the checklist */
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

const NoneIcon = () => <BanIcon className="size-5 text-muted-foreground" />;

export default function ArmorTrimViewer({ icons }: Props) {
	const [armor, setArmor] = useState<ArmorSelection>({
		helmet: "diamond",
		chestplate: "diamond",
		leggings: "diamond",
		boots: "diamond",
	});
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
			<div className="relative py-12">
				<h1 className="display mb-2 text-center text-4xl">3D Armor Trim Viewer</h1>
				<p className="text-center text-muted-foreground">
					Preview every armor and trim combination on an armor stand.
				</p>

				<Separator className="mx-auto my-4 max-w-lg" />

				<div className="mx-auto grid w-full max-w-5xl gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
					<div className="flex min-w-0 flex-col gap-3">
						<div className="flex h-9 items-center">
							<h2 className="text-muted-foreground">Armor</h2>
						</div>

						<ArmorViewer armor={armor} trim={trim} className="h-[55svh] min-h-80" />

						<div className="space-y-2 rounded-md border p-3">
							{SLOTS.map((slot) => (
								<div key={slot} className="flex items-center gap-3">
									<span className="w-24 shrink-0 text-sm text-muted-foreground">
										{SLOT_LABELS[slot]}
									</span>
									<div className="flex flex-wrap gap-0.5">
										<IconButton
											label="None"
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
													label={a.name}
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
							<h2 className="text-muted-foreground">Trim</h2>
							<span className="text-muted-foreground text-sm">
								{pattern
									? `${armorData.patterns.find((p) => p.id === pattern)?.name} · ${
											armorData.materials.find((m) => m.id === material)?.name
										}`
									: "No trim"}
							</span>
						</div>

						<div className="space-y-4 rounded-md border p-3">
							<div className="space-y-1.5">
								<h3 className="text-muted-foreground text-sm">Pattern</h3>
								<div className="flex flex-wrap gap-0.5">
									<IconButton
										label="None"
										selected={pattern === null}
										onClick={() => setPattern(null)}
									>
										<NoneIcon />
									</IconButton>
									{armorData.patterns.map((p) => (
										<IconButton
											key={p.id}
											label={p.name}
											selected={pattern === p.id}
											onClick={() => setPattern(p.id)}
										>
											<img src={icons[p.item]} alt="" width={32} height={32} className="size-8" />
										</IconButton>
									))}
								</div>
							</div>

							<div className="space-y-1.5">
								<h3 className="text-muted-foreground text-sm">Material</h3>
								<div className="flex flex-wrap gap-0.5">
									{armorData.materials.map((m) => (
										<IconButton
											key={m.id}
											label={m.name}
											selected={material === m.id}
											onClick={() => setMaterial(m.id)}
										>
											<img src={icons[m.item]} alt="" width={32} height={32} className="size-8" />
										</IconButton>
									))}
								</div>
							</div>

							<div className="space-y-1.5">
								<h3 className="text-muted-foreground text-sm">Apply to</h3>
								<div className="grid grid-cols-2 gap-2">
									{SLOTS.map((slot) => (
										<label key={slot} className="flex cursor-pointer items-center gap-2 text-sm">
											<Checkbox
												checked={trimSlots.includes(slot)}
												onCheckedChange={() => toggleSlot(slot)}
											/>
											{SLOT_LABELS[slot]}
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
