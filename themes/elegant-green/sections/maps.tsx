import * as motion from "motion/react-client";
import type { InvitationViewModel } from "../../../types/theme";

export function Maps({ invitation }: { invitation: InvitationViewModel }) {
	const mainEvent = invitation.events[0];
	if (!mainEvent?.mapsUrl) return null;

	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding text-center"
		>
			<h2 className="text-3xl font-serif mb-6 text-theme-primary">
				Location Map
			</h2>
			<div className="max-w-3xl mx-auto aspect-video bg-gray-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
				{/* Placeholder for map embed */}
				<p className="text-gray-500">Map embed for {mainEvent.locationName}</p>
			</div>
		</motion.section>
	);
}
