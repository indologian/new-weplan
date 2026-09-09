import * as motion from "motion/react-client";
import type { InvitationViewModel } from "../../../types/theme";

export function Events({ invitation }: { invitation: InvitationViewModel }) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding bg-theme-accent/10"
		>
			<h2 className="text-4xl font-serif text-center mb-12 text-theme-primary">
				Wedding Events
			</h2>
			<div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
				{invitation.events.map((event) => (
					<div
						key={event.id}
						className="bg-white p-6 rounded-xl shadow-sm text-center border border-theme-primary/10"
					>
						<h3 className="text-2xl font-serif mb-2">{event.title}</h3>
						<p className="mb-1 font-semibold">
							{new Date(event.date).toLocaleDateString()}
						</p>
						<p className="mb-4 text-theme-text/80">{event.time}</p>
						<p className="font-medium">{event.locationName}</p>
						<p className="text-sm text-theme-text/70 mb-4">
							{event.locationAddress}
						</p>
						{event.mapsUrl && (
							<a
								href={event.mapsUrl}
								target="_blank"
								rel="noreferrer"
								className="bg-theme-secondary text-theme-text px-4 py-2 rounded-full text-sm inline-block"
							>
								View on Maps
							</a>
						)}
					</div>
				))}
			</div>
		</motion.section>
	);
}
