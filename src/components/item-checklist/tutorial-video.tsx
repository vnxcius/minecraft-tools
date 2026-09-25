import {
	Expand as ExpandIcon,
	Trash as TrashIcon,
	Youtube as YoutubeIcon,
} from "pixelarticons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { embedUrl, parseYouTube, type YouTubeVideo } from "@/lib/youtube";

interface Props {
	video: YouTubeVideo | null;
	onVideoChange: (video: YouTubeVideo | null) => void;
	expanded: boolean;
	onExpandedChange: (expanded: boolean) => void;
}

export default function TutorialVideo({ video, onVideoChange, expanded, onExpandedChange }: Props) {
	const [link, setLink] = useState("");
	const [invalid, setInvalid] = useState(false);
	const { t } = useI18n();
	const expandButton = useRef<HTMLButtonElement>(null);
	const wasExpanded = useRef(expanded);

	// back from the expanded view, the focus returns to the button that opened it
	useEffect(() => {
		if (wasExpanded.current && !expanded) expandButton.current?.focus();
		wasExpanded.current = expanded;
	}, [expanded]);

	if (!video) {
		return (
			// noValidate: the browser would reject links without https://, the parser takes them
			<form
				noValidate
				className="flex flex-col gap-2 section-box p-3"
				onSubmit={(event) => {
					event.preventDefault();
					const parsed = parseYouTube(link);
					setInvalid(!parsed);
					if (parsed) {
						onVideoChange(parsed);
						setLink("");
					}
				}}
			>
				<div className="flex items-center gap-2">
					<YoutubeIcon className="size-5 shrink-0 text-[#e03131]" />
					<h2 className="font-bold">{t("tutorial.question")}</h2>
				</div>
				<p className="text-sm text-muted-foreground">{t("tutorial.hint")}</p>
				<div className="flex gap-2">
					<Input
						type="url"
						inputMode="url"
						aria-label={t("tutorial.link")}
						aria-invalid={invalid || undefined}
						aria-describedby={invalid ? "tutorial-link-error" : undefined}
						placeholder="https://www.youtube.com/watch?v=..."
						value={link}
						onChange={(event) => {
							setLink(event.target.value);
							setInvalid(false);
						}}
					/>
					<Button type="submit" disabled={!link.trim()}>
						{t("tutorial.watch")}
					</Button>
				</div>
				{invalid && (
					<p id="tutorial-link-error" className="text-xs text-destructive">
						{t("tutorial.invalid")}
					</p>
				)}
			</form>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex h-9 items-center justify-between gap-2">
				<h2 className="flex items-center gap-2 font-bold">
					<YoutubeIcon className="size-5 text-[#e03131]" />
					{t("tutorial.title")}
				</h2>
				<div className="flex gap-1.5">
					<Button
						ref={expandButton}
						variant="outline"
						size="sm"
						onClick={() => onExpandedChange(true)}
						disabled={expanded}
					>
						<ExpandIcon />
						{t("tutorial.expand")}
					</Button>
					<Button
						className="text-destructive"
						variant="outline"
						size="icon-sm"
						aria-label={t("tutorial.remove")}
						onClick={() => {
							onExpandedChange(false);
							onVideoChange(null);
						}}
					>
						<TrashIcon />
					</Button>
				</div>
			</div>

			<div
				className={cn(
					"bg-black",
					expanded
						? "fixed top-3 right-3 left-3 z-60 aspect-video shadow-2xl lg:@container-size lg:top-6 lg:right-132 lg:bottom-6 lg:left-6 lg:flex lg:aspect-auto lg:items-center lg:justify-center lg:bg-transparent lg:shadow-none"
						: // on wide screens the panel has a fixed height; a full-width player would leave no room
							// for the checklist under it
							"mx-auto aspect-video w-full shrink-0 border-2 border-black/40 lg:max-w-[calc(36svh*16/9)]",
				)}
			>
				<iframe
					key={`${video.id}:${video.start ?? 0}`}
					src={embedUrl(video)}
					title={t("tutorial.videoTitle")}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowFullScreen
					referrerPolicy="strict-origin-when-cross-origin"
					// only what the player needs, plus popups for its "Watch on YouTube" links. Scripts with
					// same-origin only escape a sandbox on our own origin; this is YouTube's, it needs both.
					// oxlint-disable-next-line react/iframe-missing-sandbox
					sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
					className={cn(
						"block size-full",
						expanded &&
							"lg:aspect-video lg:size-auto lg:w-[min(100cqw,calc(100cqh*16/9))] lg:shadow-2xl",
					)}
				/>
			</div>
		</div>
	);
}
