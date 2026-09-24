import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
	return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
	return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
	className,
	align = "start",
	side = "bottom",
	sideOffset = 4,
	...props
}: MenuPrimitive.Popup.Props &
	Pick<MenuPrimitive.Positioner.Props, "align" | "side" | "sideOffset">) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Positioner
				className="isolate z-50 outline-none"
				align={align}
				side={side}
				sideOffset={sideOffset}
			>
				<MenuPrimitive.Popup
					data-slot="dropdown-menu-content"
					className={cn(
						"data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none data-closed:animate-out data-open:animate-in",
						className,
					)}
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	);
}

function DropdownMenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
	return (
		<MenuPrimitive.Item
			data-slot="dropdown-menu-item"
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			{...props}
		/>
	);
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
	return (
		<MenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn("-mx-1 my-1 h-px bg-border", className)}
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
};
