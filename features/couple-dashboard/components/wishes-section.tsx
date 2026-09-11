"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DashboardWish } from "../../../actions/dashboard/dashboard";
import { deleteDashboardWish } from "../../../actions/dashboard/wishes";

export function WishesSection({
	invitationId,
	wishes,
}: {
	invitationId: string;
	wishes: DashboardWish[];
}) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	return (
		<section id="wishes" aria-labelledby="wishes-title">
			<h2 id="wishes-title" className="font-serif text-2xl">
				Ucapan
			</h2>
			{error && (
				<p role="alert" className="mt-3 text-sm text-destructive">
					{error}
				</p>
			)}
			<ul className="mt-4 space-y-3">
				{wishes.map((wish) => (
					<li
						key={wish.id}
						className="rounded-lg border border-border bg-card p-4"
					>
						<p>{wish.message}</p>
						<div className="mt-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
							<span>{wish.guestName}</span>
							<button
								type="button"
								onClick={async () => {
									setError(null);
									try {
										await deleteDashboardWish(invitationId, wish.id);
										router.refresh();
									} catch (deleteError) {
										setError((deleteError as Error).message);
									}
								}}
							>
								Hapus
							</button>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
