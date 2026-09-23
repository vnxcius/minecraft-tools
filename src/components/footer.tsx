import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "./ui/icons";

const year = new Date().getFullYear();

export default function Footer() {
	return (
		<footer className={"mx-auto my-10 w-fit font-geist font-semibold text-neutral-500 text-sm"}>
			<p>
				&copy; {year}. Made with love by{" "}
				<a
					href="/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary hover:underline"
				>
					Vinicius Hilton.
				</a>
			</p>
			<div
				className={cn(
					"mx-auto flex w-fit items-center gap-2 leading-3",
					"divide-x divide-gray-300",
				)}
			>
				<a
					className="my-3 flex items-center gap-1 pr-3 hover:underline"
					href={"https://github.com/vnxcius/vnciusdev"}
					target="_blank"
					rel="noopener noreferrer"
				>
					Github Repo
					<ExternalLinkIcon className="size-4" />
				</a>
				<a className="pl-2 hover:underline" href="/">
					Changelog
				</a>
			</div>
		</footer>
	);
}
