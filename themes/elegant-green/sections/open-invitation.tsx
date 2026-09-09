import * as motion from "motion/react-client";
import type {
	InvitationViewModel,
	InviteeViewModel,
} from "../../../types/theme";

export function OpenInvitation({
	invitation,
	invitee,
	onOpen,
}: {
	invitation: InvitationViewModel;
	invitee: InviteeViewModel;
	onOpen: () => void;
}) {
	return (
		<motion.section
			className="min-h-screen flex flex-col items-center justify-center section-padding bg-cover bg-center text-center"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
		>
			<div className="max-w-md w-full bg-white/80 p-8 rounded-xl shadow-lg backdrop-blur-sm">
				<h2 className="text-xl mb-2 text-theme-text">Dear {invitee.name},</h2>
				<p className="mb-6">You are invited to the wedding of</p>
				<h1 className="text-4xl mb-8 font-serif text-theme-primary">
					{invitation.groom.nickname} & {invitation.bride.nickname}
				</h1>
				<button type="button"
					onClick={onOpen}
					className="bg-theme-primary text-white px-6 py-3 rounded-full hover:bg-theme-text transition-colors"
				>
					Open Invitation
				</button>
			</div>
		</motion.section>
	);
}
