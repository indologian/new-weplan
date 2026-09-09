import * as motion from "motion/react-client";
import type { InvitationViewModel } from "../../../types/theme";

export function Gift({ invitation }: { invitation: InvitationViewModel }) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding text-center"
		>
			<h2 className="text-3xl font-serif mb-6 text-theme-primary">
				Wedding Gift
			</h2>
			<p className="max-w-xl mx-auto mb-8 text-theme-text/80">
				Your blessing is the most meaningful gift. However, if you wish to give
				a gift, you may send it via the details below.
			</p>
			<div className="max-w-md mx-auto space-y-4">
				{invitation.gifts.map((gift) => (
					<div
						key={gift.id}
						className="p-4 border border-theme-primary/20 rounded-xl bg-white shadow-sm"
					>
						<p className="font-bold">{gift.provider}</p>
						<p className="text-xl tracking-widest my-2">{gift.accountNumber}</p>
						<p className="text-sm uppercase">{gift.accountName}</p>
					</div>
				))}
			</div>
		</motion.section>
	);
}
