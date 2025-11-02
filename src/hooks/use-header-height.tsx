"use client";

import { useEffect, useState } from "react";

export function useHeaderHeight(): { headerHeight: number } {
	const [headerHeight, setHeaderHeight] = useState(0);

	useEffect(() => {
		const header = document.querySelector("header");
		if (header) setHeaderHeight(header.offsetHeight);
	}, []);

	return { headerHeight };
}
