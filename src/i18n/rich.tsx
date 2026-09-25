import { Fragment, type ReactNode } from "react";

/**
 * A translated template with React parts: rich("Tip: {name} costs XP", { name: <b>Mending</b> }).
 * The sentence stays whole in the translation, only the parts are elements.
 */
export function rich(template: string, parts: Record<string, ReactNode>): ReactNode {
	// split with a capture group: the placeholder names land on the odd indexes
	return template
		.split(/\{(\w+)\}/g)
		.map((piece, index) =>
			index % 2 ? (
				<Fragment key={index}>{piece in parts ? parts[piece] : `{${piece}}`}</Fragment>
			) : (
				piece
			),
		);
}
