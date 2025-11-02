import type { HTMLProps } from "react";
import { cn } from "@/lib/utils";

interface Props extends HTMLProps<"div"> {
	noBorderTop?: boolean;
	noBorderBottom?: boolean;
}

export default function SectionSeparator({
	noBorderTop,
	noBorderBottom,
	className,
}: Props) {
	return (
		<div
			className={cn(
				className,
				"section-separator border-y px-12",
				noBorderTop && "border-t-0",
				noBorderBottom && "border-b-0",
			)}
		>
			<div className="relative h-4">
				<svg
					role="presentation"
					className="pointer-events-none absolute inset-0 z-[-1] size-full select-none border-x text-border"
				>
					<defs>
						<pattern
							id=":S2:"
							width="4"
							height="4"
							patternUnits="userSpaceOnUse"
							patternTransform="rotate(45)"
						>
							<line
								x1="0"
								y1="0"
								x2="0"
								y2="4"
								stroke="currentColor"
								strokeWidth="1.5"
							></line>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#:S2:)"></rect>
				</svg>
			</div>
		</div>
	);
}
