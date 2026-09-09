import * as motion from "motion/react-client";
import type { InvitationViewModel } from "../../../types/theme";

export function Footer({ invitation }: { invitation: InvitationViewModel }) {
	return (
		<motion.footer
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			viewport={{ once: true }}
			className="p-12 text-center bg-theme-text text-white"
		>
			<h2 className="text-3xl font-serif mb-4">
				{invitation.groom.nickname} & {invitation.bride.nickname}
			</h2>
			<p className="mb-8 opacity-80">{invitation.footerGreeting}</p>
			<p className="text-sm opacity-50">Powered by Weplan</p>
		</motion.footer>
	);
}
