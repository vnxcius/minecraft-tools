"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { EyeClosedIcon, EyeIcon } from "@/components/ui/icons";
import { useHeaderHeight } from "@/hooks/use-header-height";

export default function StackCalculator() {
	const [items, setItems] = useState<string>("0");
	const [stackSize, setStackSize] = useState<16 | 64>(64);
	const [result, setResult] = useState({ stacks: 0, remainingItems: 0 });
	const [shulkers, setShulkers] = useState<number>(0);
	const [chests, setChests] = useState<number>(0);
	const [showStorage, setShowStorage] = useState<boolean>(true);

	const { headerHeight } = useHeaderHeight();

	const collapse = {
		opacity: 0,
		translateY: -40,
		height: 0,
		marginBlock: 0,
	};

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
		<section
			className="px-12"
			style={{ height: `calc(100svh - ${headerHeight}px)` }}
		>
			<div className="relative h-full border-x py-12">
				<h1 className="mb-2.5 text-center text-4xl text-primary">
					Stack Calculator
				</h1>
				<p className="text-center text-gray-500 text-lg">
					Calculate how many stacks are a given number of items.
				</p>

				<hr className="mx-auto my-4 max-w-lg" />

				<button
					type="button"
					className="group mx-auto mb-3 flex w-fit items-center gap-2 duration-150 hover:text-primary hover:underline"
					onClick={() => setShowStorage(!showStorage)}
				>
					<span className="rounded-sm p-1 group-hover:bg-background">
						{showStorage ? <EyeIcon size={16} /> : <EyeClosedIcon size={16} />}
					</span>
					<p>{showStorage ? "Storage needed" : "View necessary storage"}</p>
				</button>

				<AnimatePresence>
					{showStorage && (
						<motion.div
							initial={collapse}
							exit={collapse}
							animate={{
								translateY: 0,
								opacity: 1,
								height: "fit-content",
								marginBlock: "1rem",
							}}
							transition={{ duration: 0.25, type: "spring" }}
							className="mt-2 mb-5 flex flex-wrap items-center justify-center gap-10"
						>
							<div className="flex items-center gap-3 text-lg">
								<Image
									src="/minecraft/shulker_box.webp"
									alt="Shulker Box Icon"
									className="select-none"
									draggable={false}
									width={36}
									height={36}
								/>
								<p className="lowercase">
									{shulkers || "0"} shulker boxes
									<span className="block text-gray-500 text-xs">
										27 stacks per shulker box
									</span>
								</p>
							</div>
							<div className="flex items-center gap-3 text-lg">
								<Image
									src="/minecraft/chest.webp"
									alt="Chest Icon"
									className="select-none"
									draggable={false}
									width={36}
									height={36}
								/>
								<p className="lowercase">
									{chests || "0"} double chests
									<span className="block text-gray-500 text-xs">
										54 stacks per double chest
									</span>
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<div className="mx-auto max-w-2xl rounded-lg border bg-card p-4">
					<div className="mx-auto flex w-fit items-center gap-3.5 py-2.5">
						<div className="flex items-center gap-2">
							<Image
								src="/minecraft/spruce_planks_stack.webp"
								alt="Stack Spruce Planks Icon"
								className="select-none"
								draggable={false}
								width={39}
								height={39}
							/>
							<span className="text-lg lowercase">{result.stacks} stacks</span>
						</div>
						<div className="flex items-center gap-2">
							<Image
								src="/minecraft/spruce_planks.webp"
								alt="Spruce Planks Icon"
								className="select-none"
								draggable={false}
								width={37}
								height={37}
							/>
							<span className="text-lg lowercase">
								{result.remainingItems} items
							</span>
						</div>
					</div>
					<div className="flex flex-col gap-1">
						<label htmlFor="items" className="text-lg">
							Items
						</label>
						<input
							type="number"
							name="items"
							value={items}
							onChange={(e) => setItems(e.target.value)}
							placeholder="456"
							className="rounded-sm border border-input bg-card px-2 py-1.5 text-lg focus:outline-0 focus:ring-2 focus:ring-primary/80"
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
							64 items/stack
						</label>
						<label>
							<input
								type="radio"
								checked={stackSize === 16}
								onChange={() => setStackSize(16)}
								className="size-3 appearance-none border border-neutral-500 p-0.5 checked:bg-primary"
							/>{" "}
							16 items/stack
						</label>
					</div>
				</div>
			</div>
		</section>
	);
}
