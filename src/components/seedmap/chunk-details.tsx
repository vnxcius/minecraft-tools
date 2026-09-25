import { useEffect, useState } from "react";
import { ItemIcon } from "@/components/tool-parts";
import { useI18n } from "@/i18n";
import type { SeedEngine } from "@/lib/seedmap/engine";
import type { Dim } from "@/lib/seedmap/protocol";
import type { Chunk } from "./seed-map";

interface Props {
	chunk: Chunk;
	dim: Dim;
	engine: SeedEngine;
	/** changes with the seed and version, a new world needs a new slime answer */
	epoch: number;
	icons: Record<string, string>;
}

function Fact({
	label,
	children,
	className,
}: {
	label: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={className}>
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className="tabular-nums">{children}</dd>
		</div>
	);
}

export default function ChunkDetails({ chunk, dim, engine, epoch, icons }: Props) {
	const { cx, cz } = chunk;
	const { t } = useI18n();
	const [slime, setSlime] = useState<{ key: string; value: boolean } | null>(null);
	const key = `${epoch}:${cx}:${cz}`;

	// slime chunks only exist in the overworld and depend on the seed, so the engine answers
	useEffect(() => {
		if (dim !== 0) return;
		let stale = false;
		engine
			.slime({ cx, cz, w: 1, h: 1 })
			.then((data) => !stale && setSlime({ key, value: data[0] === 1 }))
			.catch(() => {});
		return () => {
			stale = true;
		};
	}, [engine, dim, cx, cz, key]);

	const x0 = cx * 16;
	const z0 = cz * 16;
	// >> and & round towards negative infinity, so negative chunks land in the same file as in game
	const region = `r.${cx >> 5}.${cz >> 5}.mca`;
	const isSlime = slime?.key === key ? slime.value : null;

	return (
		<dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-2.5 text-sm sm:grid-cols-4">
			<Fact label={t("chunk.from")}>
				<span className="text-muted-foreground">X</span> {x0},{" "}
				<span className="text-muted-foreground">Z</span> {z0}
			</Fact>
			<Fact label={t("chunk.to")}>
				<span className="text-muted-foreground">X</span> {x0 + 15},{" "}
				<span className="text-muted-foreground">Z</span> {z0 + 15}
			</Fact>
			<Fact label={t("chunk.center")}>
				<span className="text-muted-foreground">X</span> {x0 + 8},{" "}
				<span className="text-muted-foreground">Z</span> {z0 + 8}
			</Fact>
			<Fact label={t("chunk.region")}>
				{region}
				<span className="text-muted-foreground">
					{" "}
					· {cx & 31}, {cz & 31}
				</span>
			</Fact>
			{dim === 0 && (
				<Fact label={t("chunk.slime")} className="col-span-2">
					{isSlime === null ? (
						t("chunk.checking")
					) : isSlime ? (
						<span className="flex items-center gap-1">
							<ItemIcon icons={icons} item="slime_ball" className="size-4" />
							<span>
								<b className="text-brand">{t("chunk.yes")}</b>
								<span className="text-muted-foreground">{t("chunk.slimesBelow")}</span>
							</span>
						</span>
					) : (
						t("chunk.no")
					)}
				</Fact>
			)}
			{dim === 0 && (
				<Fact label={t("chunk.inNether")}>
					<span className="text-muted-foreground">X</span> {Math.floor((x0 + 8) / 8)},{" "}
					<span className="text-muted-foreground">Z</span> {Math.floor((z0 + 8) / 8)}
				</Fact>
			)}
			{dim === -1 && (
				<Fact label={t("chunk.inOverworld")}>
					<span className="text-muted-foreground">X</span> {(x0 + 8) * 8},{" "}
					<span className="text-muted-foreground">Z</span> {(z0 + 8) * 8}
				</Fact>
			)}
		</dl>
	);
}
