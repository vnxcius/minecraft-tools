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
			<div className="flex size-8 items-center justify-center rounded border">
				<LoaderIcon size={16} className="mx-auto w-fit animate-spin" />
			</div>
		);

	const icons = {
		light: <SunIcon size={16} />,
		dark: <MoonIcon size={16} />,
	};

	const icon = icons[resolvedTheme as "light" | "dark"] ?? <DeviceLaptopIcon size={16} />;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex size-8 cursor-pointer items-center justify-center rounded border text-muted-foreground hover:bg-accent hover:text-foreground">
				{icon}
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					<MoonIcon size={18} /> Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("light")}>
					<SunIcon size={18} /> Light
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => setTheme("system")}>
					<DeviceLaptopIcon size={18} /> System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
