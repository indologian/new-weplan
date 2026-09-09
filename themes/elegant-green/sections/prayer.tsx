import * as motion from "motion/react-client";
import type { InvitationViewModel } from "../../../types/theme";

export function Prayer({ invitation }: { invitation: InvitationViewModel }) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding text-center bg-theme-primary text-white"
		>
			<div className="max-w-2xl mx-auto">
				<p className="font-serif text-xl italic">"{invitation.prayer}"</p>
			</div>
		</motion.section>
	);
}
