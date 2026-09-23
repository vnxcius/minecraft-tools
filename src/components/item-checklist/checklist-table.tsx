import { XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

/** number input that lets you clear the field while typing and snaps back on blur */
function GoalInput({ goal, onChange }: { goal: number; onChange: (goal: number) => void }) {
	const [text, setText] = useState(String(goal));
	return (
		<Input
			type="number"
			min={1}
			inputMode="numeric"
			aria-label="Quantity goal"
			className="h-8 w-20 px-2"
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
	if (rows.length === 0) {
		return (
			<p className="rounded-md border border-dashed p-6 text-center text-gray-500">
				Nothing here yet. Click an item on the list to add it to your checklist.
			</p>
		);
	}

	return (
		<div className="min-h-0 overflow-y-auto rounded-md border">
			<table className="w-full text-left text-sm">
				<thead className="sticky top-0 bg-card text-gray-500 text-xs">
					<tr className="border-b">
						<th className="w-10 px-3 py-2 font-normal">Done</th>
						<th className="px-3 py-2 font-normal">Item</th>
						<th className="w-24 px-3 py-2 font-normal">Goal</th>
						<th className="w-10 px-3 py-2">
							<span className="sr-only">Remove</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map(({ entry, item }) => (
						<tr key={entry.id} className="border-b last:border-b-0">
							<td className="px-3 py-1.5">
								<Checkbox
									aria-label={`Mark ${item.name} as completed`}
									checked={entry.done}
									onCheckedChange={(done) => onChange(entry.id, { done })}
								/>
							</td>
							<td className={cn("px-3 py-1.5", entry.done && "text-gray-500 line-through")}>
								<div className="flex items-center gap-2">
									<img
										src={item.src}
										alt=""
										width={26}
										height={26}
										decoding="async"
										className="size-6.5 shrink-0"
									/>
									<span>{item.name}</span>
								</div>
							</td>
							<td className="px-3 py-1.5">
								<GoalInput goal={entry.goal} onChange={(goal) => onChange(entry.id, { goal })} />
							</td>
							<td className="px-3 py-1.5">
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={`Remove ${item.name}`}
									onClick={() => onRemove(entry.id)}
								>
									<XIcon className="text-red-500" />
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
