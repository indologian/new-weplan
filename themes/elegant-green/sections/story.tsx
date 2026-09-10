import * as motion from "motion/react-client";
import Image from "next/image";
import type { InvitationViewModel } from "../../../types/theme";

export function CoupleStory({
	invitation,
}: {
	invitation: InvitationViewModel;
}) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding bg-theme-accent/20"
		>
			<h2 className="text-4xl font-serif text-center mb-12 text-theme-primary">
				Our Story
			</h2>
			<div className="max-w-2xl mx-auto space-y-8">
				{invitation.story.map((item, i) => (
					<div
						key={item.id}
						className={`flex flex-col md:flex-row gap-4 ${i % 2 === 0 ? "" : "md:flex-row-reverse"}`}
					>
						<div className="md:w-1/3 font-bold text-theme-primary text-xl">
							{item.imageUrl && (
								<Image
									src={item.imageUrl}
									alt={item.title}
									width={320}
									height={240}
									unoptimized
									className="mb-3 w-full rounded-lg object-cover"
								/>
							)}
							{item.date}
						</div>
						<div className="md:w-2/3 bg-white p-6 rounded-xl shadow-sm border border-theme-primary/10">
							<h3 className="font-serif text-xl mb-2">{item.title}</h3>
							<p className="text-theme-text/80">{item.description}</p>
						</div>
					</div>
				))}
			</div>
		</motion.section>
	);
}
