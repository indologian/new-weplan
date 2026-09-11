import * as motion from "motion/react-client";
import type { InvitationViewModel } from "../../../types/theme";

export function Wishes({ invitation }: { invitation: InvitationViewModel }) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding bg-theme-accent/10"
		>
			<h2 className="text-3xl font-serif text-center mb-8 text-theme-primary">
				Wishes
			</h2>
			<div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-theme-primary/10">
				<div className="space-y-4 max-h-96 overflow-y-auto pr-2">
					{invitation.wishes.length === 0 && (
						<p className="text-center text-gray-500">No wishes yet.</p>
					)}
					{invitation.wishes.map((wish) => (
						<div key={wish.id} className="border-b pb-4 last:border-0">
							<p className="font-bold text-theme-primary">{wish.name}</p>
							<p className="text-sm text-gray-500 mb-1">
								{new Date(wish.createdAt).toLocaleDateString()}
							</p>
							<p className="text-theme-text">{wish.message}</p>
						</div>
					))}
				</div>
			</div>
		</motion.section>
	);
}
