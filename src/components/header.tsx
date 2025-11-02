"use client";

import { BoxIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SectionSeparator from "./section-separator";
import ThemeSelector from "./theme-selector";
import { CalculatorIcon, ListDetailsIcon } from "./ui/icons";

export default function Header() {
	return (
		<header className="border-b">
			<div className="flex w-full items-center justify-between px-18 py-3">
				<Link href={"/"}>
					<Image
						src={"/logo.svg"}
						width={52}
						height={44}
						alt="Minecraft Tools Logo"
						className="w-8"
					/>
				</Link>

				<ul className="flex items-center gap-8 text-sm **:flex **:items-center **:gap-1 *:hover:underline">
					<li>
						<Link href={"/tool/stack-calculator"}>
							<CalculatorIcon size={18} className="h-lh" />
							Stack Calculator
						</Link>
					</li>
					<li>
						<Link href={"/tool/item-checklist"}>
							<ListDetailsIcon size={18} className="h-lh" />
							Item Checklist
						</Link>
					</li>
					<li>
						<Link href={"/tool/3d-armor-trim-viewer"}>
							<BoxIcon size={18} className="h-lh" />
							3D Armor Trim Viewer
						</Link>
					</li>
				</ul>

				<ThemeSelector />
			</div>
			<SectionSeparator noBorderBottom />
		</header>
	);
}
