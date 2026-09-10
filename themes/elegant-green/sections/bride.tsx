import * as motion from "motion/react-client";
import Image from "next/image";
import type { InvitationViewModel } from "../../../types/theme";

export function Bride({ invitation }: { invitation: InvitationViewModel }) {
	return (
		<motion.section
			initial={{ opacity: 0, x: 20 }}
			whileInView={{ opacity: 1, x: 0 }}
			viewport={{ once: true }}
			className="section-padding text-center"
		>
			{invitation.bride.photoUrl && (
				<Image
					src={invitation.bride.photoUrl}
					alt={invitation.bride.name}
					width={240}
					height={240}
					unoptimized
					className="mx-auto mb-6 size-60 rounded-full object-cover"
				/>
			)}
			<h2 className="text-3xl font-serif mb-4">{invitation.bride.name}</h2>
			<p className="text-theme-text/80 mb-2">
				Daughter of {invitation.bride.parents}
			</p>
			{invitation.bride.instagram && (
				<a
					href={invitation.bride.instagram}
					className="text-theme-primary underline"
				>
					@instagram
				</a>
			)}
		</motion.section>
	);
}
