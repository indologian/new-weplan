"use client";

import { useRef } from "react";
import { PublicRsvp } from "../../../features/rsvp/public-rsvp";
import { PublicWishes } from "../../../features/wishes/public-wishes";
import { getThemeRenderer } from "../../../themes/registry";
import type {
	InvitationViewModel,
	InviteeViewModel,
} from "../../../types/theme";

export async function playInvitationMusic(
	audio: Pick<HTMLAudioElement, "play"> | null,
) {
	if (!audio) return;
	try {
		await audio.play();
	} catch {
		// Opening remains successful when browser playback is unavailable.
	}
}

export function PublicInvitationRenderer({
	invitation,
	invitee,
	guestToken,
}: {
	invitation: InvitationViewModel;
	invitee: InviteeViewModel;
	guestToken: string;
}) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const Renderer = getThemeRenderer(invitation.theme.rendererKey);
	if (!Renderer) return null;
	return (
		<>
			{invitation.musicUrl && (
				<>
					{/* biome-ignore lint/a11y/useMediaCaption: instrumental invitation background music has no dialogue */}
					<audio ref={audioRef} src={invitation.musicUrl} preload="metadata" />
				</>
			)}
			<Renderer
				invitation={invitation}
				invitee={invitee}
				rsvpInteraction={<PublicRsvp guestToken={guestToken} />}
				wishesInteraction={<PublicWishes guestToken={guestToken} />}
				onOpen={() => {
					void playInvitationMusic(audioRef.current);
				}}
			/>
		</>
	);
}
