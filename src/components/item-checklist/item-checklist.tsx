import { InfoIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useHeaderHeight } from "@/hooks/use-header-height";
import { type Item, versions } from "@/lib/items";
import CellComponent from "./cell-component";

interface Props {
	items: Item[];
	version: string;
	onVersionChange: (version: string) => void;
}

export default function ItemChecklist({ items, version, onVersionChange }: Props) {
	const { headerHeight } = useHeaderHeight();
	// ids are kept across version changes so items come back if you switch back
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

	const selectedItems = useMemo(() => {
		const byId = new Map(items.map((i) => [i.id, i]));
		return selectedIds.flatMap((id) => byId.get(id) ?? []);
	}, [items, selectedIds]);

	const collapse = {
		opacity: 0,
		translateY: -40,
		height: 0,
	};

	const handleSelectItem = (item: Item) => {
		// add the item or remove it if already selected
		setSelectedIds((prev) =>
			prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
		);
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
		<section className="px-12" style={{ height: `calc(100svh - ${headerHeight}px)` }}>
			<div className="relative h-full border-x py-12">
				<h1 className="mb-2.5 text-center text-4xl text-primary">Items Checklist</h1>
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
									<img src={"/diamond_pickaxe.gif"} alt="Diamond Pickaxe" width={26} height={26} />
									Select items
								</DialogTitle>
								<DialogDescription className="font-geist">
									Here you can select items you need to build something, then mark them as completed
									once you have them.
								</DialogDescription>
								<Separator />
								<AnimatePresence>
									{selectedItems.length > 0 && (
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
												<h2 className="text-neutral-600 dark:text-neutral-500">Selected items</h2>
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
														<p className="font-geist">Click on the item to remove it</p>
													</motion.button>
												)}
											</div>
											<ul className="flex max-h-14 flex-wrap items-center gap-0.5 overflow-y-scroll rounded-md border border-input bg-input/30 p-1">
												<AnimatePresence>
													{selectedItems.map((item) => (
														<li key={item.id} className="min-w-fit">
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
																<img
																	src={item.src}
																	alt={item.name}
																	width={26}
																	height={26}
																	className="size-6.5"
																/>
															</motion.button>
														</li>
													))}
												</AnimatePresence>
											</ul>
										</motion.div>
									)}
								</AnimatePresence>
								<div className="flex gap-2 font-geist">
									<Input
										placeholder="Search items (ENGLISH ONLY)"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>
									<Select value={version} onValueChange={(v) => v && onVersionChange(v)}>
										<SelectTrigger aria-label="Minecraft version">
											<SelectValue />
										</SelectTrigger>
										<SelectContent align="end">
											{versions.map((v) => (
												<SelectItem key={v.id} value={v.id}>
													{v.id}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</DialogHeader>

							{/* fixed height so react-window only renders the visible rows */}
							<div className="mx-auto h-[40svh] min-h-48 w-full">
								<Grid
									cellComponent={CellComponent}
									columnCount={11}
									rowCount={Math.ceil(filteredItems.length / 11)}
									columnWidth={40}
									rowHeight={41}
									cellProps={{
										items: filteredItems,
										selectedItems: selectedItems,
										onClick: handleSelectItem,
									}}
									className="mx-auto"
									style={{ height: "100%", overflowX: "hidden" }}
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
