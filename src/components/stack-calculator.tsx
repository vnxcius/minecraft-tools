import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Eye as EyeIcon, EyeOff as EyeOffIcon } from "pixelarticons/react";
import { useI18n } from "@/i18n";

/** the spring the storage row slides with: 250 ms with a little overshoot, sampled every 10 ms */
const SPRING =
	"linear(0, 0.0642, 0.2112, 0.3887, 0.5629, 0.7146, 0.8357, 0.9248, 0.9849, 1.0214, 1.0399, 1.0459, 1.0439, 1.0376, 1.0296, 1.0215, 1.0143, 1.0084, 1.0041, 1.0011, 0.9992, 0.9983, 0.9979, 0.9979, 0.9982, 1)";
const COLLAPSED: Keyframe = {
	height: "0px",
	opacity: 0,
	transform: "translateY(-40px)",
	marginTop: "0px",
	marginBottom: "0px",
};

/**
 * Slides the row in when it mounts or is shown, and out before it unmounts; toggled halfway, it
 * turns around from where it is. Returns whether to render it and the ref for it.
 */
function useSlide(show: boolean) {
	const ref = useRef<HTMLDivElement>(null);
	// still rendered while sliding out
	const [rendered, setRendered] = useState(show);
	if (show && !rendered) setRendered(true);

	useLayoutEffect(() => {
		const row = ref.current;
		if (!row) return;
		const running = row.getAnimations()[0];
		const style = getComputedStyle(row);
		const from: Keyframe =
			running || !show
				? {
						height: style.height,
						opacity: style.opacity,
						transform: style.transform,
						marginTop: style.marginTop,
						marginBottom: style.marginBottom,
					}
				: COLLAPSED;
		running?.cancel();
		const to: Keyframe = show
			? {
					height: `${row.offsetHeight}px`,
					opacity: 1,
					transform: "none",
					marginTop: "1rem",
					marginBottom: "1rem",
				}
			: COLLAPSED;
		const slide = row.animate([from, to], {
			duration: 250,
			easing: SPRING,
			fill: show ? "none" : "forwards",
		});
		if (!show) slide.onfinish = () => setRendered(false);
	}, [show]);

	return [rendered, ref] as const;
}

export default function StackCalculator() {
	const [items, setItems] = useState<string>("0");
	const [stackSize, setStackSize] = useState<16 | 64>(64);
	const [result, setResult] = useState({ stacks: 0, remainingItems: 0 });
	const [shulkers, setShulkers] = useState<number>(0);
	const [chests, setChests] = useState<number>(0);
	const [showStorage, setShowStorage] = useState<boolean>(true);
	const { t, tn, itemName } = useI18n();
	const [storageRendered, storageRef] = useSlide(showStorage);

	useEffect(() => {
		const value = parseInt(items, 10);
		const normalized = Number.isFinite(value) ? value : 0;

		queueMicrotask(() => {
			setResult({
				stacks: Math.floor(normalized / stackSize),
				remainingItems: normalized % stackSize,
			});
			setShulkers(Math.ceil(normalized / (27 * stackSize)));
			setChests(Math.ceil(normalized / (54 * stackSize)));
		});
	}, [items, stackSize]);
	return (
		<section>
			<div className="relative h-full py-12">
				<button
					type="button"
					className="group mx-auto mb-3 flex w-fit items-center gap-2 duration-150 hover:text-primary hover:underline"
					onClick={() => setShowStorage(!showStorage)}
				>
					<span className="rounded-sm p-1 group-hover:bg-background">
						{showStorage ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
					</span>
					<p>{showStorage ? t("stack.storageNeeded") : t("stack.showStorage")}</p>
				</button>

				{storageRendered && (
					<div ref={storageRef} className="my-4 flex flex-wrap items-center justify-center gap-10">
						<div className="flex items-center gap-3 text-lg">
							<img
								src="/shulker_box.webp"
								alt={itemName("shulker_box")}
								className="select-none"
								draggable={false}
								width={36}
								height={36}
							/>
							<p className="lowercase">
								{tn("stack.shulkers", shulkers)}
								<span className="block text-xs text-muted-foreground">{t("stack.perShulker")}</span>
							</p>
						</div>
						<div className="flex items-center gap-3 text-lg">
							<img
								src="/chest.webp"
								alt={itemName("chest")}
								className="select-none"
								draggable={false}
								width={36}
								height={36}
							/>
							<p className="lowercase">
								{tn("stack.chests", chests)}
								<span className="block text-xs text-muted-foreground">{t("stack.perChest")}</span>
							</p>
						</div>
					</div>
				)}

				<div className="mx-auto max-w-2xl rounded-lg border bg-card p-4">
					<div className="mx-auto flex w-fit items-center gap-3.5 py-2.5">
						<div className="flex items-center gap-2">
							<img
								src="/spruce_planks_stack.webp"
								alt={t("stack.stackOf", { item: itemName("spruce_planks") })}
								className="select-none"
								draggable={false}
								width={39}
								height={39}
							/>
							<span className="text-lg lowercase">{tn("stack.stacks", result.stacks)}</span>
						</div>
						<div className="flex items-center gap-2">
							<img
								src="/spruce_planks.webp"
								alt={itemName("spruce_planks")}
								className="select-none"
								draggable={false}
								width={37}
								height={37}
							/>
							<span className="text-lg lowercase">{tn("stack.items", result.remainingItems)}</span>
						</div>
					</div>
					<div className="flex flex-col gap-1">
						<label htmlFor="items" className="text-lg">
							{t("stack.itemsLabel")}
						</label>
						<input
							type="number"
							id="items"
							name="items"
							value={items}
							onChange={(e) => setItems(e.target.value)}
							placeholder="456"
							className="rounded-sm border border-input bg-card px-2 py-1.5 text-lg focus:ring-2 focus:ring-primary/80 focus:outline-0"
						/>
					</div>

					<div className="my-6 flex justify-center gap-4">
						<label>
							<input
								type="radio"
								checked={stackSize === 64}
								onChange={() => setStackSize(64)}
								className="size-3 appearance-none border border-neutral-500 p-0.5 checked:bg-primary"
							/>{" "}
							{t("stack.perStack", { count: 64 })}
						</label>
						<label>
							<input
								type="radio"
								checked={stackSize === 16}
								onChange={() => setStackSize(16)}
								className="size-3 appearance-none border border-neutral-500 p-0.5 checked:bg-primary"
							/>{" "}
							{t("stack.perStack", { count: 16 })}
						</label>
					</div>
				</div>
			</div>
		</section>
	);
}
