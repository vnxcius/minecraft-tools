"use client";

import { InfoIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Geist } from "next/font/google";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Grid } from "react-window";
import { useDebounce } from "use-debounce";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useHeaderHeight } from "@/hooks/use-header-height";
import CellComponent from "./cell-component";

export interface Item {
	name: string;
	path: string;
}

interface Props {
	items: Item[];
}

interface SelectedItems {
	items: Item[];
}

const geist = Geist({ subsets: ["latin"] });

export default function ItemChecklist({ items }: Props) {
	const { headerHeight } = useHeaderHeight();
	const [selectedItems, setSelectedItems] = useState<SelectedItems>({
		items: [],
	});
	const [search, setSearch] = useState<string>("");
	const [tipVisible, setTipVisible] = useState<boolean>(true);
	const [debouncedSearch] = useDebounce(search, 500);

	const normalizedItems = useMemo(
		() => items.map((i) => ({ ...i, _name: i.name.toLowerCase() })),
		[items],
	);

	const filteredItems = useMemo(() => {
		if (!debouncedSearch) return normalizedItems;
		const q = debouncedSearch.toLowerCase();
		return normalizedItems.filter((item) => item._name.includes(q));
	}, [normalizedItems, debouncedSearch]);

	const collapse = {
		opacity: 0,
		translateY: -40,
		height: 0,
	};

	const handleSelectItem = (item: Item) => {
		// append selected item or remove it if already in the array and prevent duplicates
		setSelectedItems((prev) => ({
			items: prev.items.includes(item)
				? prev.items.filter((i) => i !== item)
				: [...prev.items, item],
		}));
	};

	const handleDismissTip = () => {
		setTipVisible(false);
		localStorage.setItem("show-tip", "false");
	};

	useEffect(() => {
		const showTip = localStorage.getItem("show-tip");
		queueMicrotask(() => {
			if (showTip === "false") {
				setTipVisible(false);
			}
		});
	}, []);
	return (
		<section
			className="px-12"
			style={{ height: `calc(100svh - ${headerHeight}px)` }}
		>
			<div className="relative h-full border-x py-12">
				<h1 className="mb-2.5 text-center text-4xl text-primary">
					Items Checklist
				</h1>
				<p className="text-center text-gray-500 text-lg">
					Make yourself a item list for building something cool!
				</p>

				<Separator className="mx-auto my-4 max-w-lg" />

				<div className="mx-auto w-fit">
					<Dialog>
						<DialogTrigger>Click here to select items</DialogTrigger>
						<DialogContent className="flex max-h-[70svh] flex-col">
							<DialogHeader>
								<DialogTitle className="flex items-center gap-2 text-2xl antialiased">
									<Image
										src={"/minecraft/diamond_pickaxe.gif"}
										alt="Diamond Pickaxe"
										width={26}
										height={26}
										unoptimized
									/>
									Select items
								</DialogTitle>
								<DialogDescription className={geist.className}>
									Here you can select items you need to build something, then
									mark them as completed once you have them.
								</DialogDescription>
								<Separator />
								<AnimatePresence>
									{selectedItems.items.length > 0 && (
										<motion.div
											initial={collapse}
											exit={collapse}
											animate={{
												opacity: 1,
												translateY: 0,
												height: "auto",
											}}
											transition={{ duration: 0.15, type: "tween" }}
											className="space-y-2"
										>
											<div className="flex items-center justify-between">
												<h2 className="text-neutral-600 dark:text-neutral-500">
													Selected items
												</h2>
												{tipVisible && (
													<motion.button
														initial={{ opacity: 0, scale: 0.1 }}
														animate={{
															opacity: 1,
															scale: 1,
															transition: {
																duration: 0.65,
																type: "spring",
																delay: 0.25,
															},
														}}
														className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-green-700 text-xs hover:bg-primary/20"
														onClick={() => handleDismissTip()}
													>
														<InfoIcon className="h-4 w-auto" />
														<p className={geist.className}>
															Click on the item to remove it
														</p>
													</motion.button>
												)}
											</div>
											<ul className="flex max-h-14 flex-wrap items-center gap-0.5 overflow-y-scroll rounded-md border border-input bg-input/30 p-1">
												<AnimatePresence>
													{selectedItems.items.map((item) => (
														<li key={item.path} className="min-w-fit">
															<motion.button
																initial={{ opacity: 0, scale: 0.1 }}
																exit={{ opacity: 0, scale: 0.1 }}
																animate={{
																	opacity: 1,
																	scale: 1,
																	transition: {
																		duration: 0.65,
																		type: "spring",
																		delay: 0.15,
																	},
																}}
																type="button"
																className="group relative block rounded-sm p-1 hover:bg-red-500/20"
																onClick={() => handleSelectItem(item)}
															>
																<XIcon className="-top-1 -right-1 absolute hidden size-3 text-red-500 group-hover:block" />
																<Image
																	src={`/minecraft/1.21.10/${item.path}`}
																	alt={item.name}
																	width={26}
																	height={26}
																	className="min-w-fit"
																/>
															</motion.button>
														</li>
													))}
												</AnimatePresence>
											</ul>
										</motion.div>
									)}
								</AnimatePresence>
								<Input
									className={geist.className}
									placeholder="Search items (ENGLISH ONLY)"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</DialogHeader>

							<div className="mx-auto h-full w-full overflow-y-scroll">
								<Grid
									cellComponent={CellComponent}
									columnCount={11}
									rowCount={Math.ceil(filteredItems.length / 11)}
									columnWidth={41}
									rowHeight={41}
									cellProps={{
										items: filteredItems,
										selectedItems: selectedItems.items,
										onClick: handleSelectItem,
									}}
									className="mx-auto"
								/>
							</div>
							<Separator />
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</section>
	);
}
