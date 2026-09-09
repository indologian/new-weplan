import * as motion from "motion/react-client";
import type { InvitationViewModel } from "../../../types/theme";

export function Hero({ invitation }: { invitation: InvitationViewModel }) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding text-center min-h-[70vh] flex flex-col justify-center"
		>
			<h3 className="uppercase tracking-widest text-sm mb-4">The Wedding Of</h3>
			<h1 className="text-6xl font-serif text-theme-primary mb-4">
				{invitation.groom.nickname} & {invitation.bride.nickname}
			</h1>
			<p className="text-lg">
				{new Date(invitation.weddingDate).toLocaleDateString("en-US", {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				})}
			</p>
		</motion.section>
	);
}
