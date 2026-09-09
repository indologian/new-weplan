import * as motion from "motion/react-client";
import type { InviteeViewModel } from "../../../types/theme";

export function Rsvp({ invitee }: { invitee: InviteeViewModel }) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding text-center bg-theme-primary text-white"
		>
			<div className="max-w-xl mx-auto p-8 rounded-2xl border border-white/20">
				<h2 className="text-3xl font-serif mb-4">RSVP</h2>
				<p className="mb-6">Please confirm your attendance, {invitee.name}.</p>
				<div className="space-x-4">
					<button type="button" className="bg-white text-theme-primary px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors">
						Accept
					</button>
					<button type="button" className="border border-white text-white px-6 py-2 rounded-full font-bold hover:bg-white/10 transition-colors">
						Decline
					</button>
				</div>
			</div>
		</motion.section>
	);
}
