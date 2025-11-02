import { Geist } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "./ui/icons";

const geist = Geist();
const year = new Date().getFullYear();

export default function Footer() {
	return (
		<footer
			className={`${geist.className} mx-auto my-10 w-fit font-semibold text-neutral-500 text-sm`}
		>
			<p>
				&copy; {year}. Made with love by{" "}
				<Link href="/" target="_blank" className="text-primary hover:underline">
					Vinicius Hilton.
				</Link>
			</p>
			<div
				className={cn(
					"mx-auto flex w-fit items-center gap-2 leading-3",
					"divide-x divide-gray-300",
				)}
			>
				<Link
					className="my-3 flex items-center gap-1 pr-3 hover:underline"
					href={"https://github.com/vnxcius/vnciusdev"}
					target="_blank"
					rel="noopener noreferrer"
				>
					Github Repo
					<ExternalLinkIcon className="size-4" />
				</Link>
				<Link className="pl-2 hover:underline" href={"/"}>
					Changelog
				</Link>
			</div>
		</footer>
	);
}
