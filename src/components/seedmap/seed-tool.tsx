import { CheckIcon, CopyIcon, DicesIcon, MinusIcon, PlusIcon, SearchIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Heading, ItemIcon } from "@/components/tool-parts";
import { SeedEngine } from "@/lib/seedmap/engine";
import {
	biomeDim,
	DEFAULT_FEATURES,
	DIMENSIONS,
	FEATURES,
	SPAWN_ICON,
	STRONGHOLD_ICON,
	VERSIONS,
} from "@/lib/seedmap/features";
import type { Dim, EngineInfo } from "@/lib/seedmap/protocol";
import { displaySeed, parseSeed, randomSeed } from "@/lib/seedmap/seed";
import { cn } from "@/lib/utils";
import SeedMap, { type Hover, type MapPoint, type Selection, type SeedMapHandle } from "./seed-map";

interface World {
	engine: SeedEngine;
	info: EngineInfo;
	/** counts the loaded worlds, the map drops its caches when it changes */
	epoch: number;
	spawn: MapPoint;
	strongholds: Int32Array;
}

const DEFAULT_SEED = "12345";

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
}

export default function SeedTool({ icons }: Props) {
	const map = useRef<SeedMapHandle>(null);
	const engineRef = useRef<SeedEngine | null>(null);
	const [world, setWorld] = useState<World | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [seedInput, setSeedInput] = useState(DEFAULT_SEED);
	const [applied, setApplied] = useState({ seed: DEFAULT_SEED, version: VERSIONS[0].id });
	const [dim, setDim] = useState<Dim>(0);

	const [features, setFeatures] = useState<Set<string>>(new Set(DEFAULT_FEATURES));
	const [showSlime, setShowSlime] = useState(false);
	const [showGrid, setShowGrid] = useState(true);
	const [showStrongholds, setShowStrongholds] = useState(true);
	const [showSpawn, setShowSpawn] = useState(true);

	const [hover, setHover] = useState<Hover | null>(null);
	const [selection, setSelection] = useState<Selection | null>(null);
	const [pin, setPin] = useState<MapPoint | null>(null);
	const [copied, setCopied] = useState(false);

	const [goX, setGoX] = useState("0");
	const [goZ, setGoZ] = useState("0");
	const [biome, setBiome] = useState<number | null>(null);
	const [finding, setFinding] = useState(false);
	const [findResult, setFindResult] = useState<string | null>(null);

	// the worker lives as long as the page
	useEffect(
		() => () => {
			engineRef.current?.terminate();
			engineRef.current = null;
		},
		[],
	);

	// (re)generate the world whenever the seed or version is applied
	useEffect(() => {
		let stale = false;
		const engine = (engineRef.current ??= new SeedEngine());
		(async () => {
			const info = await engine.init({ version: applied.version, seed: parseSeed(applied.seed) });
			const [spawn, strongholds] = await Promise.all([engine.spawn(), engine.strongholds(128)]);
			if (stale) return;
			setError(null);
			setWorld((previous) => ({
				engine,
				info,
				epoch: (previous?.epoch ?? 0) + 1,
				spawn: { x: spawn[0], z: spawn[1] },
				strongholds,
			}));
			setSelection(null);
			setPin(null);
			setBiome(null);
			setFindResult(null);
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
			.map(([id, name]) => ({ id: Number(id), name }))
			.filter(({ id, name }) => biomeDim(id) === dim && name !== "the_void")
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [world, dim]);

	const toggleFeature = (id: string) =>
		setFeatures((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const go = (x: number, z: number, blocksPerPixel?: number) =>
		map.current?.goTo(x, z, blocksPerPixel);

	const findBiome = async () => {
		if (!world || biome === null) return;
		setFinding(true);
		setFindResult(null);
		try {
			const center = map.current?.center() ?? { x: 0, z: 0 };
			const found = await world.engine.findBiome({
				dim,
				biome,
				x: center.x,
				z: center.z,
				radius: 20000,
			});
			if (!found) {
				setFindResult("Not found within 20,000 blocks");
			} else {
				const distance = Math.round(Math.hypot(found.x - center.x, found.z - center.z));
				setPin(found);
				go(found.x, found.z, 4);
				setFindResult(`Found at ${found.x}, ${found.z} (${distance} blocks away)`);
			}
		} catch (e) {
			setFindResult(String(e));
		} finally {
			setFinding(false);
		}
	};

	const copyTeleport = async () => {
		if (!selection) return;
		await navigator.clipboard.writeText(`/tp @s ${selection.x} ~ ${selection.z}`);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	};

	const seedNumber = displaySeed(applied.seed);
	const nearestStrongholds = useMemo(() => {
		if (!world) return [];
		const list: { x: number; z: number }[] = [];
		for (let i = 0; i < world.strongholds.length; i += 2) {
			list.push({ x: world.strongholds[i], z: world.strongholds[i + 1] });
		}
		return list.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z)).slice(0, 8);
	}, [world]);

	return (
		<section className="py-12">
			<h1 className="display mb-2 text-center text-4xl">Seed Map</h1>
			<p className="text-center text-muted-foreground">
				Explore the world of any seed: biomes, structures, strongholds and slime chunks.
			</p>

			<Separator className="mx-auto my-4 max-w-lg" />

			<div className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
				<div className="flex min-w-0 flex-col gap-3">
					<Heading
						aside={
							<span className="text-muted-foreground text-sm tabular-nums">Seed {seedNumber}</span>
						}
					>
						Map
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
								icons={icons}
								onHover={setHover}
								onSelect={setSelection}
							/>
						)}
						{(!world || error) && (
							<div className="absolute inset-0 flex items-center justify-center bg-card/80 text-muted-foreground text-sm">
								{error ?? "Generating world..."}
							</div>
						)}

						<div className="absolute top-2 right-2 flex flex-col gap-1">
							<Button
								variant="outline"
								size="icon-sm"
								aria-label="Zoom in"
								onClick={() => map.current?.zoom(1)}
							>
								<PlusIcon />
							</Button>
							<Button
								variant="outline"
								size="icon-sm"
								aria-label="Zoom out"
								onClick={() => map.current?.zoom(-1)}
							>
								<MinusIcon />
							</Button>
						</div>

						<div className="pointer-events-none absolute top-2 left-2 rounded bg-background/80 px-2 py-1 text-xs tabular-nums">
							{hover ? (
								<>
									X {hover.x}, Z {hover.z}
									{hover.biome && <span className="text-muted-foreground"> · {hover.biome}</span>}
								</>
							) : (
								"Drag to pan · scroll to zoom · click for details"
							)}
						</div>
					</div>

					{selection && (
						<div className="flex flex-wrap items-center gap-3 rounded border bg-card p-3 text-sm">
							<div className="min-w-0 flex-1">
								<p className="font-semibold">{selection.label}</p>
								<p className="text-muted-foreground tabular-nums">
									X {selection.x}, Z {selection.z}
									{selection.biome && ` · ${selection.biome}`}
								</p>
							</div>
							<Button variant="outline" size="sm" onClick={copyTeleport}>
								{copied ? <CheckIcon /> : <CopyIcon />}
								Copy /tp
							</Button>
						</div>
					)}
				</div>

				<div className="flex min-w-0 flex-col gap-3">
					<Heading>World</Heading>
					<div className="space-y-4 rounded border p-3">
						<div className="space-y-2">
							<label htmlFor="seed" className="text-muted-foreground text-sm">
								Seed (number or text)
							</label>
							<div className="flex gap-2">
								<Input
									id="seed"
									value={seedInput}
									spellCheck={false}
									onChange={(e) => setSeedInput(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && apply()}
								/>
								<Button
									variant="outline"
									size="icon"
									aria-label="Random seed"
									onClick={() => {
										const seed = randomSeed();
										setSeedInput(seed);
										apply(seed);
									}}
								>
									<DicesIcon />
								</Button>
							</div>
							<div className="flex gap-2">
								<Select
									value={applied.version}
									onValueChange={(version) => version && apply(seedInput, version)}
								>
									<SelectTrigger aria-label="Minecraft version" className="min-w-0 flex-1">
										<SelectValue>
											{(value: string) => VERSIONS.find((v) => v.id === value)?.name}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{VERSIONS.map((v) => (
											<SelectItem key={v.id} value={v.id}>
												{v.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button onClick={() => apply()}>Go</Button>
							</div>
						</div>

						<div role="radiogroup" aria-label="Dimension" className="flex gap-1">
							{DIMENSIONS.map((d) => (
								<button
									key={d.id}
									type="button"
									role="radio"
									aria-checked={dim === d.id}
									onClick={() => {
										setDim(d.id);
										setBiome(null);
										setPin(null);
									}}
									className={cn(
										"flex-1 rounded border px-2 py-1.5 text-sm hover:bg-accent",
										dim === d.id && "border-primary bg-primary/20 hover:bg-primary/30",
									)}
								>
									{d.name}
								</button>
							))}
						</div>

						<div className="space-y-2">
							<h3 className="text-muted-foreground text-sm">Go to</h3>
							<div className="flex gap-2">
								<Input
									aria-label="X"
									placeholder="X"
									inputMode="numeric"
									value={goX}
									onChange={(e) => setGoX(e.target.value)}
								/>
								<Input
									aria-label="Z"
									placeholder="Z"
									inputMode="numeric"
									value={goZ}
									onChange={(e) => setGoZ(e.target.value)}
								/>
								<Button variant="outline" onClick={() => go(Number(goX) || 0, Number(goZ) || 0)}>
									Go
								</Button>
							</div>
						</div>
					</div>

					<Heading>Features</Heading>
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
								{feature.name}
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
									Strongholds
								</label>
								<label
									htmlFor="opt-spawn"
									className="flex cursor-pointer items-center gap-2 text-sm"
								>
									<Checkbox id="opt-spawn" checked={showSpawn} onCheckedChange={setShowSpawn} />
									<ItemIcon icons={icons} item={SPAWN_ICON} className="size-5" />
									World spawn
								</label>
								<label
									htmlFor="opt-slime"
									className="flex cursor-pointer items-center gap-2 text-sm"
								>
									<Checkbox id="opt-slime" checked={showSlime} onCheckedChange={setShowSlime} />
									<span className="inline-block size-3 rounded-sm bg-[#6edc5a]" />
									Slime chunks
								</label>
							</>
						)}
						<label htmlFor="opt-grid" className="flex cursor-pointer items-center gap-2 text-sm">
							<Checkbox id="opt-grid" checked={showGrid} onCheckedChange={setShowGrid} />
							<span className="inline-block size-3 rounded-sm border" />
							Chunk grid (zoomed in)
						</label>
					</div>

					<Heading>Biome finder</Heading>
					<div className="space-y-2 rounded border p-3">
						<Select
							value={biome === null ? "" : String(biome)}
							onValueChange={(value) => value && setBiome(Number(value))}
						>
							<SelectTrigger aria-label="Biome" className="w-full">
								<SelectValue placeholder="Pick a biome">
									{(value: string) =>
										value ? (world?.info.names[Number(value)] ?? "").replace(/_/g, " ") : null
									}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{biomes.map(({ id, name }) => (
									<SelectItem key={id} value={String(id)}>
										<span
											className="inline-block size-3 rounded-sm"
											style={{
												backgroundColor: world
													? `rgb(${world.info.colors[id * 3]} ${world.info.colors[id * 3 + 1]} ${world.info.colors[id * 3 + 2]})`
													: undefined,
											}}
										/>
										{name.replace(/_/g, " ")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							variant="outline"
							className="w-full"
							disabled={biome === null || finding}
							onClick={findBiome}
						>
							<SearchIcon />
							{finding ? "Searching..." : "Find nearest to the map center"}
						</Button>
						{findResult && <p className="text-muted-foreground text-xs">{findResult}</p>}
					</div>

					{dim === 0 && world && (
						<>
							<Heading>Locations</Heading>
							<div className="rounded border p-1">
								<CoordsRow
									label="World spawn"
									x={world.spawn.x}
									z={world.spawn.z}
									onGo={() => go(world.spawn.x, world.spawn.z)}
								/>
								{nearestStrongholds.map((s, i) => (
									<CoordsRow
										key={`${s.x},${s.z}`}
										label={`Stronghold ${i + 1}`}
										x={s.x}
										z={s.z}
										onGo={() => go(s.x, s.z)}
									/>
								))}
							</div>
						</>
					)}

					<p className="text-muted-foreground text-xs leading-relaxed">
						Java Edition. World generation is done by cubiomes and matches the game up to 1.21.4;
						newer versions use the closest match.
					</p>
				</div>
			</div>
		</section>
	);
}
