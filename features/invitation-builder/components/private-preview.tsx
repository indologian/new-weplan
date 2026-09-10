"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getThemeRenderer } from "../../../themes/registry";
import type {
	InvitationViewModel,
	InviteeViewModel,
} from "../../../types/theme";
import { getBuilderEditHref, getBuilderReviewHref } from "../review/navigation";
import { toggleMusicPlayback } from "../utils/music-playback";

const previewInvitee: InviteeViewModel = {
	id: "builder-preview",
	name: "Tamu Undangan",
	status: "pending",
};

export function PrivatePreview({
	invitation,
	themeSlug,
}: {
	invitation: InvitationViewModel;
	themeSlug: string;
}) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const Renderer = getThemeRenderer(invitation.theme.rendererKey);
	if (!Renderer) return null;

	return (
		<div>
			<nav className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background p-3">
				<Link
					href={getBuilderReviewHref(invitation.id)}
					className="font-semibold"
				>
					Kembali ke review
				</Link>
				<div className="flex gap-2">
					<Link
						href={getBuilderEditHref(themeSlug, invitation.id)}
						className="rounded-md border border-border px-3 py-2 text-sm"
					>
						Edit
					</Link>
					{invitation.musicUrl && (
						<button
							type="button"
							className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
							onClick={async () => {
								if (!audioRef.current) return;
								setIsPlaying(await toggleMusicPlayback(audioRef.current));
							}}
						>
							{isPlaying ? "Pause musik" : "Putar musik"}
						</button>
					)}
				</div>
			</nav>
			{invitation.musicUrl && (
				<>
					{/* biome-ignore lint/a11y/useMediaCaption: instrumental background preview has no dialogue */}
					<audio
						ref={audioRef}
						src={invitation.musicUrl}
						preload="metadata"
						onEnded={() => setIsPlaying(false)}
					/>
				</>
			)}
			<Renderer invitation={invitation} invitee={previewInvitee} />
		</div>
	);
}
