import { useState } from "react";
import { ItemIcon } from "@/components/tool-parts";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";

type Coords = { x: string; y: string; z: string };

const AXES = ["x", "y", "z"] as const;

/** a whole number, or null while the field is empty or half typed */
const toNumber = (text: string) => (/^\s*-?\d+\s*$/.test(text) ? Number(text) : null);

/** the other dimension: X and Z scale by 8 (rounded down into the Nether), Y stays */
function convert(from: Coords, toNether: boolean): Coords {
	const scale = (text: string) => {
		const n = toNumber(text);
		if (n === null) return "";
		return String(toNether ? Math.floor(n / 8) : n * 8);
	};
	return { x: scale(from.x), y: from.y, z: scale(from.z) };
}

function Side({
	title,
	icon,
	value,
	onChange,
	icons,
	prefix,
}: {
	title: string;
	icon: string;
	value: Coords;
	onChange: (value: Coords) => void;
	icons: Record<string, string>;
	prefix: string;
}) {
	return (
		<div className="flex flex-col gap-3 section-box p-4">
			<h2 className="flex items-center gap-2 text-lg font-bold">
				<ItemIcon icons={icons} item={icon} className="size-7" />
				{title}
			</h2>
			<div className="grid grid-cols-3 gap-2">
				{AXES.map((axis) => (
					<label key={axis} className="flex flex-col gap-1 text-sm">
						<span className="font-semibold uppercase">{axis}</span>
						<Input
							id={`${prefix}-${axis}`}
							inputMode="numeric"
							placeholder="0"
							value={value[axis]}
							onChange={(event) => onChange({ ...value, [axis]: event.target.value })}
							className="text-lg tabular-nums"
						/>
					</label>
				))}
			</div>
		</div>
	);
}

export default function NetherPortal({ icons }: { icons: Record<string, string> }) {
	const { t, term } = useI18n();
	const [overworld, setOverworld] = useState<Coords>({ x: "800", y: "64", z: "-240" });
	const [nether, setNether] = useState<Coords>(() =>
		convert({ x: "800", y: "64", z: "-240" }, true),
	);

	return (
		<section className="flex flex-col gap-4">
			<div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
				<Side
					title={term("flat_world_preset.minecraft.overworld")}
					icon="grass_block"
					value={overworld}
					prefix="overworld"
					icons={icons}
					onChange={(value) => {
						setOverworld(value);
						setNether(convert(value, true));
					}}
				/>
				<span className="text-center text-sm font-semibold text-muted-foreground">
					÷ 8
					<br />⇄<br />× 8
				</span>
				<Side
					title={term("advancements.nether.root.title")}
					icon="netherrack"
					value={nether}
					prefix="nether"
					icons={icons}
					onChange={(value) => {
						setNether(value);
						setOverworld(convert(value, false));
					}}
				/>
			</div>

			<div className="flex flex-col gap-2 section-box p-4 text-sm">
				<h2 className="font-bold">{t("portal.howTitle")}</h2>
				<ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
					<li>{t("portal.tipBuild")}</li>
					<li>{t("portal.tipRange")}</li>
					<li>{t("portal.tipSpacing")}</li>
				</ul>
			</div>
		</section>
	);
}
