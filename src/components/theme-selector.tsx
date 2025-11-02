"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { DeviceLaptopIcon, LoaderIcon, MoonIcon, SunIcon } from "./ui/icons";

export default function ThemeSelector() {
	const [isMounted, setIsMounted] = useState<boolean>(false);
	const { setTheme, resolvedTheme } = useTheme();

	useEffect(() => {
		queueMicrotask(() => setIsMounted(true));
	}, []);

	if (!isMounted)
		return (
			<div className="size-7 border px-1.5 py-1">
				<LoaderIcon size={16} className="mx-auto w-fit animate-spin" />
			</div>
		);

	const icons = {
		light: <SunIcon size={16} />,
		dark: <MoonIcon size={16} />,
	};

	const icon = icons[resolvedTheme as "light" | "dark"] ?? (
		<DeviceLaptopIcon size={16} />
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="cursor-pointer rounded-sm border border-b-3 bg-accent px-1.5 py-1 text-neutral-600 dark:text-neutral-400">
				{icon}
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					<MoonIcon size={18} /> Escuro
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("light")}>
					<SunIcon size={18} /> Claro
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => setTheme("system")}>
					<DeviceLaptopIcon size={18} /> Sistema
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
