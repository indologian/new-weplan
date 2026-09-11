import * as motion from "motion/react-client";
import type { InvitationViewModel } from "../../../types/theme";

export function Maps({ invitation }: { invitation: InvitationViewModel }) {
	const mainEvent = invitation.events.find((event) => event.isMainEvent);
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
			<a
				href={mainEvent.mapsUrl}
				target="_blank"
				rel="noreferrer"
				className="inline-flex rounded-full bg-theme-primary px-6 py-3 text-white"
			>
				Open map for {mainEvent.locationName}
			</a>
		</motion.section>
	);
}
