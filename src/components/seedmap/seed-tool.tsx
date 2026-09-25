import {
	Check as CheckIcon,
	Close as CloseIcon,
	Copy as CopyIcon,
	Minus as MinusIcon,
	Plus as PlusIcon,
	Shuffle as ShuffleIcon,
} from "pixelarticons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { SeedEngine } from "@/lib/seedmap/engine";
import {
	biomeDim,
	biomeName,
	DEFAULT_FEATURES,
	DIMENSIONS,
	FEATURES,
	featureName,
	SPAWN_ICON,
	STRONGHOLD_ICON,
	VERSIONS,
	versionName,
} from "@/lib/seedmap/features";
import { useI18n } from "@/i18n";
import type { Dim, EngineInfo } from "@/lib/seedmap/protocol";
import { displaySeed, parseSeed, randomSeed } from "@/lib/seedmap/seed";
import { cn } from "@/lib/utils";
import ChunkDetails from "./chunk-details";
import SeedMap, { type Hover, type MapPoint, type Selection, type SeedMapHandle } from "./seed-map";

interface World {
	engine: SeedEngine;
	info: EngineInfo;
	/** counts the loaded worlds, the map drops its caches when it changes */
	epoch: number;
	spawn: MapPoint;
	strongholds: Int32Array;
}

const DEFAULT_SEED = "";

type FindResult =
	| { found: { x: number; z: number; distance: number } }
	| { notFound: true }
	| { error: string };

function CoordsRow({
	label,
	x,
	z,
	onGo,
}: {
	label: string;
	x: number;
	z: number;
	onGo: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onGo}
			className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent"
		>
			<span>{label}</span>
			<span className="text-muted-foreground tabular-nums">
				{x}, {z}
			</span>
		</button>
	);
}

interface Props {
	/** item id -> icon url */
	icons: Record<string, string>;
	/** start with the slime chunks shown */
	slime?: boolean;
}

/** both fields hold a whole number (a lone "-" while typing does not count yet) */
function toPoint(x: string, z: string): MapPoint | null {
	if (!/^\s*-?\d+\s*$/.test(x) || !/^\s*-?\d+\s*$/.test(z)) return null;
	return { x: Number(x), z: Number(z) };
}

export default function SeedTool({ icons, slime = false }: Props) {
	const map = useRef<SeedMapHandle>(null);
	const engineRef = useRef<SeedEngine | null>(null);
	const [world, setWorld] = useState<World | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [seedInput, setSeedInput] = useState(DEFAULT_SEED);
	const [applied, setApplied] = useState({ seed: DEFAULT_SEED, version: VERSIONS[0].id });
	const [dim, setDim] = useState<Dim>(0);

	const [features, setFeatures] = useState<Set<string>>(new Set(DEFAULT_FEATURES));
	const [showSlime, setShowSlime] = useState(slime);
	const [showGrid, setShowGrid] = useState(true);
	const [showStrongholds, setShowStrongholds] = useState(true);
	const [showSpawn, setShowSpawn] = useState(true);

	const [hover, setHover] = useState<Hover | null>(null);
	const [selection, setSelection] = useState<Selection | null>(null);
	const [copied, setCopied] = useState(false);

	// the "Go to" fields are the pin: clicking the map fills them, typing in them moves the pin
	const [goX, setGoX] = useState("");
	const [goZ, setGoZ] = useState("");
	const pin = useMemo(() => toPoint(goX, goZ), [goX, goZ]);
	const setPin = (point: MapPoint | null) => {
		setGoX(point ? String(point.x) : "");
		setGoZ(point ? String(point.z) : "");
	};
	// the biomes picked in the finder, lit up on the map
	const [pickedBiomes, setPickedBiomes] = useState<number[]>([]);
	const [finding, setFinding] = useState<number | null>(null);
	const [findResults, setFindResults] = useState<Record<number, FindResult>>({});
	const { t, term, language } = useI18n();

	// the worker lives as long as the page
	useEffect(
		() => () => {
			engineRef.current?.terminate();
			engineRef.current = null;
		},
		[],
	);

	useEffect(() => {
		let stale = false;
		const engine = (engineRef.current ??= new SeedEngine());
		(async () => {
			const info = await engine.init({ version: applied.version, seed: parseSeed(applied.seed) });
			// all 128 strongholds take seconds; the first ring and a half (the 8 nearest are among the
			// first 9) come right away, the rest follow without holding up the map
			const [spawn, nearest] = await Promise.all([engine.spawn(), engine.strongholds(9)]);
			if (stale) return;
			setError(null);
			let epoch = 0;
			setWorld((previous) => {
				epoch = (previous?.epoch ?? 0) + 1;
				return { engine, info, epoch, spawn: { x: spawn[0], z: spawn[1] }, strongholds: nearest };
			});
			engine
				.strongholds(128)
				.then((all) => {
					if (!stale)
						setWorld((current) =>
							current?.epoch === epoch ? { ...current, strongholds: all } : current,
						);
				})
				.catch(() => {});
			setSelection(null);
			setGoX("");
			setGoZ("");
			setFindResults({});
		})().catch((e) => !stale && setError(String(e)));
		return () => {
			stale = true;
		};
	}, [applied]);

	const apply = (seed = seedInput, version = applied.version) => setApplied({ seed, version });

	const dimFeatures = useMemo(
		() => (world ? FEATURES.filter((f) => f.dim === dim && world.info.dims[f.type] === dim) : []),
		[world, dim],
	);

	const biomes = useMemo(() => {
		if (!world) return [];
		return Object.entries(world.info.names)
			.filter(([id, name]) => biomeDim(Number(id)) === dim && name !== "the_void")
			.map(([id, name]) => {
				const key = `biome.minecraft.${name}`;
				const official = term(key);
				// old versions have biomes the game no longer names
				return { id: Number(id), name: official === key ? name.replace(/_/g, " ") : official };
			})
			.sort((a, b) => a.name.localeCompare(b.name, language));
	}, [world, dim, term, language]);

	// the picked biomes of this dimension and version, the ones the map highlights
	const shownBiomes = useMemo(
		() => biomes.filter((b) => pickedBiomes.includes(b.id)),
		[biomes, pickedBiomes],
	);
	const highlight = useMemo(() => new Set(shownBiomes.map((b) => b.id)), [shownBiomes]);
	const biomeColor = (id: number) =>
		world
			? `rgb(${world.info.colors[id * 3]} ${world.info.colors[id * 3 + 1]} ${world.info.colors[id * 3 + 2]})`
			: undefined;

	const toggleFeature = (id: string) =>
		setFeatures((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const go = (x: number, z: number, blocksPerPixel?: number) =>
		map.current?.goTo(x, z, blocksPerPixel);

	const findBiome = async (biome: number) => {
		if (!world) return;
		setFinding(biome);
		const result = await (async (): Promise<FindResult> => {
			try {
				const center = map.current?.center() ?? { x: 0, z: 0 };
				const found = await world.engine.findBiome({
					dim,
					biome,
					x: center.x,
					z: center.z,
					radius: 20000,
				});
				if (!found) return { notFound: true };
				setPin(found);
				go(found.x, found.z, 4);
				const distance = Math.round(Math.hypot(found.x - center.x, found.z - center.z));
				return { found: { ...found, distance } };
			} catch (e) {
				return { error: String(e) };
			}
		})();
		setFindResults((prev) => ({ ...prev, [biome]: result }));
		setFinding(null);
	};

	const copyTeleport = async () => {
		if (!selection) return;
		await navigator.clipboard.writeText(`/tp @s ${selection.x} ~ ${selection.z}`);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	};

	const seedNumber = displaySeed(applied.seed);

	const selectionTitle = (picked: Selection) => {
		if (picked.chunk) return t("seed.chunk", { x: picked.chunk.cx, z: picked.chunk.cz });
		if (picked.kind === "stronghold") return t("seed.stronghold");
		if (picked.kind === "spawn") return t("seed.worldSpawn");
		const feature = FEATURES.find((f) => f.id === picked.feature);
		return feature ? featureName(feature) : t("seed.location");
	};
	const nearestStrongholds = useMemo(() => {
		if (!world) return [];
		const list: { x: number; z: number }[] = [];
		for (let i = 0; i < world.strongholds.length; i += 2) {
			list.push({ x: world.strongholds[i], z: world.strongholds[i + 1] });
		}
		return list.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z)).slice(0, 8);
	}, [world]);

	return (
		<section>
			<div className="relative grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
				<div className="flex min-w-0 flex-col gap-1 lg:sticky lg:top-3 lg:self-start">
					<Heading
						aside={
							<span className="font-pixel text-sm text-muted-foreground tabular-nums">
								{seedNumber}
							</span>
						}
					>
						{t("seed.map")}
					</Heading>

					<div className="relative h-[72svh] min-h-96 overflow-hidden rounded border bg-card">
						{world && (
							<SeedMap
								ref={map}
								engine={world.engine}
								info={world.info}
								epoch={world.epoch}
								dim={dim}
								features={features}
								showSlime={showSlime}
								showGrid={showGrid}
								spawn={showSpawn ? world.spawn : null}
								strongholds={showStrongholds ? world.strongholds : null}
								pin={pin}
								highlight={highlight}
								chunk={selection?.chunk ?? null}
								icons={icons}
								scaleLabel={(blocks) => t("seed.scale", { count: blocks })}
								ariaLabel={t("seed.worldMap")}
								onHover={setHover}
								onSelect={(picked) => {
									setSelection(picked);
									setPin(picked);
								}}
							/>
						)}
						{(!world || error) && (
							<div className="absolute inset-0 flex items-center justify-center bg-card/80 text-sm text-muted-foreground">
								{error ?? t("seed.generating")}
							</div>
						)}

						<div className="absolute top-2 right-2 flex flex-col gap-1">
							<Button
								variant="outline"
								size="icon-sm"
								aria-label={t("seed.zoomIn")}
								onClick={() => map.current?.zoom(1)}
							>
								<PlusIcon />
							</Button>
							<Button
								variant="outline"
								size="icon-sm"
								aria-label={t("seed.zoomOut")}
								onClick={() => map.current?.zoom(-1)}
							>
								<MinusIcon />
							</Button>
						</div>

						<div className="pointer-events-none absolute top-2 left-2 rounded bg-background/80 px-2 py-1 text-xs tabular-nums">
							{hover ? (
								<>
									X {hover.x}, Z {hover.z}
									{hover.biome && (
										<span className="text-muted-foreground"> · {biomeName(hover.biome)}</span>
									)}
								</>
							) : (
								t("seed.hint")
							)}
						</div>
					</div>

					{selection && (
						<div className="flex flex-col gap-2.5 rounded border bg-card p-3 text-sm">
							<div className="flex flex-wrap items-center gap-3">
								<div className="min-w-0 flex-1">
									<p className="font-semibold">{selectionTitle(selection)}</p>
									<p className="text-muted-foreground tabular-nums">
										X {selection.x}, Z {selection.z}
										{selection.biome && ` · ${biomeName(selection.biome)}`}
									</p>
								</div>
								<Button variant="outline" size="sm" onClick={copyTeleport}>
									{copied ? <CheckIcon /> : <CopyIcon />}
									{t("seed.copyTp")}
								</Button>
							</div>
							{selection.chunk && world && (
								<ChunkDetails
									chunk={selection.chunk}
									dim={dim}
									engine={world.engine}
									epoch={world.epoch}
									icons={icons}
								/>
							)}
						</div>
					)}
				</div>

				<div className="flex min-w-0 flex-col gap-1">
					<Heading>{t("seed.world")}</Heading>
					<div className="space-y-4 rounded border p-3">
						<div className="space-y-2">
							<label htmlFor="seed" className="block text-sm text-muted-foreground">
								{t("seed.seed")}
							</label>
							<div className="flex gap-2">
								<Input
									id="seed"
									value={seedInput}
									spellCheck={false}
									onChange={(e) => setSeedInput(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && apply()}
									placeholder={t("seed.seedPlaceholder")}
								/>
								<Button
									variant="outline"
									size="icon"
									aria-label={t("seed.randomSeed")}
									onClick={() => {
										const seed = randomSeed();
										setSeedInput(seed);
										apply(seed);
									}}
								>
									<ShuffleIcon />
								</Button>
							</div>
							<div className="flex gap-2">
								<Select
									value={applied.version}
									onValueChange={(version) => version && apply(seedInput, version)}
								>
									<SelectTrigger aria-label={t("seed.version")} className="min-w-0 flex-1">
										<SelectValue>
											{(value: string) => {
												const version = VERSIONS.find((v) => v.id === value);
												return version && versionName(version);
											}}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{VERSIONS.map((v) => (
											<SelectItem key={v.id} value={v.id}>
												{versionName(v)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button onClick={() => apply()}>{t("seed.go")}</Button>
							</div>
						</div>

						<div role="radiogroup" aria-label={t("seed.dimension")} className="flex gap-1">
							{DIMENSIONS.map((d) => (
								<div key={d.id} className="">
									<button
										type="button"
										role="radio"
										aria-checked={dim === d.id}
										onClick={() => {
											setDim(d.id);
											setPin(null);
										}}
										className={cn(
											"flex-1 tile bg-secondary px-2 pt-1.5 pb-2 text-sm hover:bg-accent",
											dim === d.id && "bg-primary/80 hover:border-primary hover:bg-primary/35",
										)}
									>
										{term(d.key)}
									</button>
								</div>
							))}
						</div>

						<div className="space-y-2">
							<h3 className="text-sm text-muted-foreground">{t("seed.goTo")}</h3>
							<div className="flex gap-2">
								<Input
									aria-label="X"
									placeholder="X"
									inputMode="numeric"
									value={goX}
									onChange={(e) => setGoX(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && pin && go(pin.x, pin.z)}
								/>
								<Input
									aria-label="Z"
									placeholder="Z"
									inputMode="numeric"
									value={goZ}
									onChange={(e) => setGoZ(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && pin && go(pin.x, pin.z)}
								/>
								<Button variant="outline" onClick={() => go(pin?.x ?? 0, pin?.z ?? 0)}>
									{t("seed.go")}
								</Button>
							</div>
						</div>
					</div>

					<div className="flex justify-between">
						<Heading>{t("seed.structures")}</Heading>
						<label
							htmlFor="opt-grid"
							className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground/60"
						>
							{t("seed.showGrid")}
							<Checkbox id="opt-grid" checked={showGrid} onCheckedChange={setShowGrid} />
						</label>
					</div>
					<div className="space-y-1 rounded border p-3">
						{dimFeatures.map((feature) => (
							<label
								key={feature.id}
								htmlFor={`feature-${feature.id}`}
								className="flex cursor-pointer items-center gap-2 text-sm"
							>
								<Checkbox
									id={`feature-${feature.id}`}
									checked={features.has(feature.id)}
									onCheckedChange={() => toggleFeature(feature.id)}
								/>
								<ItemIcon icons={icons} item={feature.icon} className="size-5" />
								{featureName(feature)}
							</label>
						))}
						{dim === 0 && (
							<>
								<label
									htmlFor="opt-strongholds"
									className="flex cursor-pointer items-center gap-2 text-sm"
								>
									<Checkbox
										id="opt-strongholds"
										checked={showStrongholds}
										onCheckedChange={setShowStrongholds}
									/>
									<ItemIcon icons={icons} item={STRONGHOLD_ICON} className="size-5" />
									{t("seed.strongholds")}
								</label>
								<label
									htmlFor="opt-spawn"
									className="flex cursor-pointer items-center gap-2 text-sm"
								>
									<Checkbox id="opt-spawn" checked={showSpawn} onCheckedChange={setShowSpawn} />
									<ItemIcon icons={icons} item={SPAWN_ICON} className="size-5" />
									{t("seed.worldSpawn")}
								</label>
								<label
									htmlFor="opt-slime"
									className="flex cursor-pointer items-center gap-2 text-sm"
								>
									<Checkbox id="opt-slime" checked={showSlime} onCheckedChange={setShowSlime} />
									<span className="inline-block size-3 rounded-sm bg-[#6edc5a]" />
									{t("seed.slimeChunks")}
								</label>
							</>
						)}
					</div>

					<Heading>{t("seed.biomeFinder")}</Heading>
					<div className="space-y-2 rounded border p-3">
						<Select
							value=""
							onValueChange={(value) =>
								value && setPickedBiomes((prev) => [...prev, Number(value)])
							}
						>
							<SelectTrigger aria-label={t("seed.addBiome")} className="w-full">
								<SelectValue placeholder={t("seed.addBiome")} />
							</SelectTrigger>
							<SelectContent>
								{biomes
									.filter(({ id }) => !highlight.has(id))
									.map(({ id, name }) => (
										<SelectItem key={id} value={String(id)}>
											<span
												className="mr-2 inline-block size-3 translate-y-0.5 rounded-sm"
												style={{ backgroundColor: biomeColor(id) }}
											/>
											{name}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
						{shownBiomes.length > 0 ? (
							<>
								<ul className="flex flex-col gap-1">
									{shownBiomes.map(({ id, name }) => {
										const result = findResults[id];
										return (
											<li key={id} className="flex gap-1">
												<button
													type="button"
													disabled={finding !== null}
													onClick={() => findBiome(id)}
													aria-label={t("seed.goToNearest", { name })}
													className="flex min-w-0 flex-1 flex-col items-start gap-0.5 tile bg-secondary px-2 pt-1 pb-2 text-left hover:bg-accent disabled:cursor-wait"
												>
													<span className="flex items-center gap-2 text-sm font-bold">
														<span
															className="inline-block size-3 shrink-0 border border-black/40"
															style={{ backgroundColor: biomeColor(id) }}
														/>
														{name}
													</span>
													<span className="text-xs text-muted-foreground">
														{finding === id
															? t("seed.searching")
															: !result
																? t("seed.findNearest")
																: "found" in result
																	? t("seed.found", result.found)
																	: "notFound" in result
																		? t("seed.notFound")
																		: result.error}
													</span>
												</button>
												<button
													type="button"
													onClick={() => setPickedBiomes((prev) => prev.filter((b) => b !== id))}
													aria-label={t("seed.removeBiome", { name })}
													className="tile bg-secondary px-2 pb-1 hover:bg-accent"
												>
													<CloseIcon className="size-4" />
												</button>
											</li>
										);
									})}
								</ul>
								<Button
									variant="outline"
									size="sm"
									className="w-full"
									onClick={() => setPickedBiomes((prev) => prev.filter((b) => !highlight.has(b)))}
								>
									{t("seed.clearBiomes")}
								</Button>
							</>
						) : (
							<p className="text-xs leading-relaxed text-muted-foreground">{t("seed.biomeHint")}</p>
						)}
					</div>

					{dim === 0 && world && (
						<>
							<Heading>{t("seed.locations")}</Heading>
							<div className="rounded border p-1">
								<CoordsRow
									label={t("seed.worldSpawn")}
									x={world.spawn.x}
									z={world.spawn.z}
									onGo={() => go(world.spawn.x, world.spawn.z)}
								/>
								{nearestStrongholds.map((s, i) => (
									<CoordsRow
										key={`${s.x},${s.z}`}
										label={t("seed.strongholdNumber", { number: i + 1 })}
										x={s.x}
										z={s.z}
										onGo={() => go(s.x, s.z)}
									/>
								))}
							</div>
						</>
					)}

					<p className="text-xs leading-relaxed text-muted-foreground">{t("seed.note")}</p>
				</div>
			</div>
		</section>
	);
}
