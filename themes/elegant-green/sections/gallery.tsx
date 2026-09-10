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
				{invitation.gallery.map((item) => (
					<div
						key={item.id}
						className="aspect-square bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center"
					>
						{item.type === "image" ? (
							<Image
								src={item.url}
								alt={item.alt}
								className="w-full h-full object-cover"
								width={500}
								height={500}
								unoptimized
							/>
						) : (
							<iframe
								src={`https://www.youtube-nocookie.com/embed/${item.videoId}`}
								title="Wedding gallery video"
								className="h-full w-full"
								allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
							/>
						)}
					</div>
				))}
			</div>
		</motion.section>
	);
}
