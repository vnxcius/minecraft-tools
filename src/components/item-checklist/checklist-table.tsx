import { Close as CloseIcon } from "pixelarticons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import type { Item } from "@/lib/items";
import { cn } from "@/lib/utils";

export interface ChecklistEntry {
	id: string;
	goal: number;
	done: boolean;
}

interface Props {
	rows: { entry: ChecklistEntry; item: Item }[];
	onChange: (id: string, patch: Partial<Omit<ChecklistEntry, "id">>) => void;
	onRemove: (id: string) => void;
}

const ROW_BG = "bg-row";

/** number input that lets you clear the field while typing and snaps back on blur */
function GoalInput({ goal, onChange }: { goal: number; onChange: (goal: number) => void }) {
	const [text, setText] = useState(String(goal));
	const { t } = useI18n();
	return (
		<Input
			type="number"
			min={1}
			inputMode="numeric"
			aria-label={t("checklist.goal")}
			className="h-8 w-20 [appearance:textfield] px-2 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			value={text}
			onChange={(e) => {
				setText(e.target.value);
				const n = Math.floor(Number(e.target.value));
				if (n >= 1) onChange(n);
			}}
			onBlur={() => setText(String(goal))}
		/>
	);
}

export default function ChecklistTable({ rows, onChange, onRemove }: Props) {
	const { t, itemName } = useI18n();
	if (rows.length === 0) {
		return (
			<p className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
				{t("checklist.empty")}
			</p>
		);
	}

	return (
		<div className="min-h-0 overflow-y-auto rounded-md border">
			<table className="w-full text-left text-sm">
				<thead className={"sticky top-0 bg-background text-xs text-muted-foreground"}>
					<tr className="border-b">
						<th className="w-10 px-3 py-2 font-normal">{t("checklist.col.done")}</th>
						<th className="px-3 py-2 font-normal">{t("checklist.col.item")}</th>
						<th className="w-24 px-3 py-2 text-center font-normal">{t("checklist.col.goal")}</th>
						<th className="w-10 px-3 py-2">
							<span className="sr-only">{t("checklist.col.remove")}</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map(({ entry, item }) => (
						<tr key={entry.id} className={cn("border-b last:border-b-0", ROW_BG)}>
							<td className="px-3 py-1.5">
								<Checkbox
									aria-label={t("checklist.markDone", { item: itemName(item.id) })}
									checked={entry.done}
									onCheckedChange={(done) => onChange(entry.id, { done })}
								/>
							</td>
							<td className={cn("px-3 py-1.5", entry.done && "text-muted-foreground line-through")}>
								<button
									type="button"
									className="flex cursor-pointer items-center gap-2 text-left select-none"
									onClick={() => onChange(entry.id, { done: !entry.done })}
								>
									<img
										src={item.src}
										alt=""
										width={26}
										height={26}
										decoding="async"
										className="size-6.5 shrink-0"
									/>
									<span>{itemName(item.id)}</span>
								</button>
							</td>
							<td className="px-3 py-1.5">
								<GoalInput goal={entry.goal} onChange={(goal) => onChange(entry.id, { goal })} />
							</td>
							<td className="px-3 py-1.5">
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={t("checklist.remove", { item: itemName(item.id) })}
									onClick={() => onRemove(entry.id)}
								>
									<CloseIcon className="text-red-500" />
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
