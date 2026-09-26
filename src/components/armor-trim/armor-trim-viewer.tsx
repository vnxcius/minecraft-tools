import { Cancel as CancelIcon, Close as CloseIcon } from "pixelarticons/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import armorData from "@/data/armor.json";
import { loadSaved, save, type SavedViewer } from "@/lib/armor/saved";
import {
	type ArmorSelection,
	SLOTS,
	type Slot,
	type SlotTrim,
	type TrimSelection,
} from "@/lib/armor/selection";
import { lookupSkin, NICKNAME, SkinLookupError, type SkinError } from "@/lib/armor/skin";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import SkinHead from "./skin-head";

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

/** which pieces the trim choices edit */
type Target = "all" | Slot;

const DEFAULT_TRIM: SlotTrim = { pattern: "coast", material: "gold" };

const NO_ARMOR: ArmorSelection = { helmet: null, chestplate: null, leggings: null, boots: null };

const DEFAULTS: SavedViewer = {
	armor: {
		helmet: "netherite",
		chestplate: "netherite",
		leggings: "netherite",
		boots: "netherite",
	},
	trim: {
		helmet: DEFAULT_TRIM,
		chestplate: DEFAULT_TRIM,
		leggings: DEFAULT_TRIM,
		boots: DEFAULT_TRIM,
	},
	skin: null,
};

export default function ArmorTrimViewer({ icons }: Props) {
	const [saved] = useState(() => loadSaved(DEFAULTS));
	const [armor, setArmor] = useState<ArmorSelection>(saved.armor);
	const { t, term, itemName } = useI18n();
	const slotName = (slot: Slot) => t(`armor.slot.${slot}`);
	const patternName = (id: string) => term(`trim_pattern.minecraft.${id}`);
	const materialName = (id: string) => term(`trim_material.minecraft.${id}`);
	const [trim, setTrim] = useState<TrimSelection>(saved.trim);
	// hides the armor to see the skin; picking a piece or a trim shows it again
	const [armorHidden, setArmorHidden] = useState(false);
	const pickArmor = (slot: Slot, id: string | null) => {
		setArmorHidden(false);
		setArmor((prev) => ({ ...prev, [slot]: id }));
	};
	const [target, setTarget] = useState<Target>("all");
	const targets = target === "all" ? SLOTS : [target];

	// the value every targeted piece has, undefined when they differ
	const shared = <K extends keyof SlotTrim>(key: K): SlotTrim[K] | undefined => {
		const value = trim[targets[0]][key];
		return targets.every((slot) => trim[slot][key] === value) ? value : undefined;
	};
	const pattern = shared("pattern");
	const material = shared("material");
	const updateTrim = (change: Partial<SlotTrim>) => {
		setArmorHidden(false);
		setTrim((prev) => {
			const next = { ...prev };
			for (const slot of targets) next[slot] = { ...prev[slot], ...change };
			return next;
		});
	};

	const [nickname, setNickname] = useState(saved.skin?.nickname ?? "");
	const [skin, setSkin] = useState<SavedViewer["skin"]>(saved.skin);
	const [skinLoading, setSkinLoading] = useState(false);
	const [skinError, setSkinError] = useState<SkinError | "invalid" | null>(null);
	const lookup = useRef<AbortController | null>(null);
	useEffect(() => () => lookup.current?.abort(), []);

	const loadSkin = async (event: React.FormEvent) => {
		event.preventDefault();
		const name = nickname.trim();
		if (!NICKNAME.test(name)) return setSkinError("invalid");
		lookup.current?.abort();
		const controller = new AbortController();
		lookup.current = controller;
		setSkinError(null);
		setSkinLoading(true);
		try {
			setSkin({ ...(await lookupSkin(name, controller.signal)), nickname: name });
		} catch (error) {
			if (controller.signal.aborted) return;
			setSkinError(error instanceof SkinLookupError ? error.reason : "network");
		} finally {
			if (lookup.current === controller) setSkinLoading(false);
		}
	};

	const removeSkin = () => {
		lookup.current?.abort();
		setSkinLoading(false);
		setSkinError(null);
		setSkin(null);
	};

	useEffect(() => save({ armor, trim, skin }), [armor, trim, skin]);

	return (
		<section>
			<div className="relative">
				<div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_34rem]">
					<div className="flex min-w-0 flex-col gap-3">
						<div className="flex h-9 items-center">
							<h2 className="font-bold">{t("armor.armor")}</h2>
						</div>

						<Suspense fallback={<div className="h-[55svh] min-h-80 rounded-md border bg-viewer" />}>
							<ArmorViewer
								armor={armorHidden ? NO_ARMOR : armor}
								trim={trim}
								skin={skin}
								armorHidden={armorHidden}
								onArmorHiddenChange={setArmorHidden}
								onSkinError={() => {
									// a remembered skin that no longer loads
									setSkin(null);
									setSkinError("network");
								}}
								className="h-[55svh] min-h-80"
							/>
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
											onClick={() => pickArmor(slot, null)}
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
													onClick={() => pickArmor(slot, a.id)}
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
								{pattern === undefined || material === undefined
									? t("armor.mixed")
									: pattern
										? `${patternName(pattern)} · ${materialName(material)}`
										: t("armor.noTrim")}
							</span>
						</div>

						<div className="space-y-4 rounded-md border p-3">
							<div className="space-y-1.5">
								<h3 className="text-sm text-muted-foreground">{t("armor.applyTo")}</h3>
								<div className="flex flex-wrap gap-1 lg:flex-nowrap">
									{(["all", ...SLOTS] as const).map((value) => {
										const slotPattern = value === "all" ? null : trim[value].pattern;
										return (
											<button
												key={value}
												type="button"
												aria-pressed={target === value}
												onClick={() => setTarget(value)}
												className={cn(
													"flex h-8 items-center justify-center gap-1.5 rounded-sm border px-2 text-sm whitespace-nowrap hover:bg-accent lg:flex-auto",
													target === value &&
														"bg-primary/30 ring-1 ring-primary hover:bg-primary/40",
												)}
											>
												{value === "all" ? t("armor.allPieces") : slotName(value)}
												{slotPattern && (
													<img
														src={
															icons[
																armorData.patterns.find((p) => p.id === slotPattern)?.item ?? ""
															]
														}
														alt=""
														width={16}
														height={16}
														className="size-4"
													/>
												)}
											</button>
										);
									})}
								</div>
							</div>

							<div className="space-y-1.5">
								<h3 className="text-sm text-muted-foreground">{t("armor.pattern")}</h3>
								<div className="flex flex-wrap gap-0.5">
									<IconButton
										label={t("armor.none")}
										selected={pattern === null}
										onClick={() => updateTrim({ pattern: null })}
									>
										<NoneIcon />
									</IconButton>
									{armorData.patterns.map((p) => (
										<IconButton
											key={p.id}
											label={patternName(p.id)}
											selected={pattern === p.id}
											onClick={() => updateTrim({ pattern: p.id })}
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
											onClick={() => updateTrim({ material: m.id })}
										>
											<img src={icons[m.item]} alt="" width={32} height={32} className="size-8" />
										</IconButton>
									))}
								</div>
							</div>

							<hr />

							<form onSubmit={loadSkin} className="space-y-1.5">
								<label
									htmlFor="armor-skin"
									className="flex items-center gap-2 text-sm font-semibold text-foreground"
								>
									<SkinHead url={skin?.url ?? null} />
									{t("armor.skin")}
								</label>
								<div className="space-y-1.5">
									<div className="flex gap-2">
										<Input
											id="armor-skin"
											value={nickname}
											onChange={(e) => setNickname(e.target.value)}
											placeholder={t("armor.nickname")}
											maxLength={16}
											autoComplete="off"
											spellCheck={false}
											aria-invalid={skinError !== null}
											aria-describedby={skinError ? "armor-skin-error" : undefined}
											className="h-8 max-w-56"
										/>
										<Button type="submit" size="sm" disabled={skinLoading}>
											{skinLoading ? t("armor.loadingSkin") : t("armor.loadSkin")}
										</Button>
										{skin && (
											<Tooltip>
												<TooltipTrigger
													render={
														<Button
															type="button"
															variant="ghost"
															size="icon-sm"
															aria-label={t("armor.removeSkin")}
															onClick={removeSkin}
														/>
													}
												>
													<CloseIcon />
												</TooltipTrigger>
												<TooltipContent>{t("armor.removeSkin")}</TooltipContent>
											</Tooltip>
										)}
									</div>
									{skinError && (
										<p id="armor-skin-error" className="text-sm text-destructive">
											{t(`armor.skinError.${skinError}`)}
										</p>
									)}
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
