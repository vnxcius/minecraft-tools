import type { SVGProps } from ".";

export function InfoBoxIcon(props: SVGProps) {
	return (
		<svg
			{...props}
			role="img"
			aria-label="info-box"
			width={props.size ?? "24"}
			height={props.size ?? "24"}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M3 3h2v18H3V3zm16 0H5v2h14v14H5v2h16V3h-2zm-8 6h2V7h-2v2zm2 8h-2v-6h2v6z"
				fill="currentColor"
			/>
		</svg>
	);
}
