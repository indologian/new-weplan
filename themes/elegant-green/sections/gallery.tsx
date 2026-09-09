import * as motion from "motion/react-client";
import Image from "next/image";
import type { InvitationViewModel } from "../../../types/theme";

export function Gallery({ invitation }: { invitation: InvitationViewModel }) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding"
		>
			<h2 className="text-4xl font-serif text-center mb-12 text-theme-primary">
				Gallery
			</h2>
			<div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
				{invitation.gallery.map((img) => (
					<div
						key={img.id}
						className="aspect-square bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center"
					>
						<Image
							src={img.url}
							alt={img.alt}
							className="w-full h-full object-cover"
							width={500}
							height={500}
							unoptimized
						/>
					</div>
				))}
			</div>
		</motion.section>
	);
}
