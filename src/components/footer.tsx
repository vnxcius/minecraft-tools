import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon } from "./ui/icons";

const year = new Date().getFullYear();

export default function Footer() {
	return (
		<footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-x px-6 py-8 text-muted-foreground text-sm">
			<p>&copy; {year} Vinicius Hilton. Not affiliated with Mojang or Microsoft.</p>
			<div className="flex items-center gap-5">
				<a
					className="flex items-center gap-1 hover:text-foreground"
					href="https://github.com/vnxcius/vnciusdev"
					target="_blank"
					rel="noopener noreferrer"
				>
					GitHub
					<ExternalLinkIcon className="size-4" />
				</a>
				<Link className="hover:text-foreground" to="/">
					Home
				</Link>
			</div>
		</footer>
	);
}
