import Link from "next/link";
import type { getOwnedInvitationReview } from "../../../actions/invitations/review";
import { getBuilderEditHref } from "../review/navigation";
import { CheckoutBoundary } from "./checkout-boundary";

type Review = Awaited<ReturnType<typeof getOwnedInvitationReview>>;

function formatPrice(price: string) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(BigInt(price));
}

export function ReviewSummary({ review }: { review: Review }) {
	return (
		<main className="mx-auto max-w-3xl space-y-6 px-4 py-12">
			<header>
				<p className="text-sm font-semibold uppercase tracking-wide text-primary">
					Review Undangan
				</p>
				<h1 className="mt-2 text-3xl font-bold">
					{review.viewModel.groom.nickname} &amp;{" "}
					{review.viewModel.bride.nickname}
				</h1>
				<p className="mt-2 text-muted-foreground">
					Periksa isi dan pilihan paket sebelum melanjutkan ke pembayaran.
				</p>
			</header>

			<section className="rounded-lg border border-border bg-card p-6">
				<h2 className="text-xl font-semibold">Ringkasan pilihan</h2>
				<dl className="mt-4 grid gap-3 sm:grid-cols-2">
					<div>
						<dt className="text-sm text-muted-foreground">Tema</dt>
						<dd className="font-medium">{review.commercial.themeName}</dd>
					</div>
					<div>
						<dt className="text-sm text-muted-foreground">Paket</dt>
						<dd className="font-medium">{review.commercial.tierName}</dd>
					</div>
					<div>
						<dt className="text-sm text-muted-foreground">Durasi aktif</dt>
						<dd className="font-medium">
							{review.commercial.activeMonths} bulan
						</dd>
					</div>
					<div>
						<dt className="text-sm text-muted-foreground">Harga saat ini</dt>
						<dd className="font-medium">
							{formatPrice(review.commercial.price)}
						</dd>
					</div>
				</dl>
			</section>

			<section className="rounded-lg border border-border bg-card p-6">
				<h2 className="text-xl font-semibold">Isi undangan</h2>
				<ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
					<li>{review.viewModel.events.length} acara</li>
					<li>{review.viewModel.story.length} cerita</li>
					<li>{review.viewModel.gallery.length} media galeri</li>
					<li>{review.viewModel.gifts.length} rekening hadiah</li>
					<li>RSVP: {review.viewModel.rsvpEnabled ? "aktif" : "nonaktif"}</li>
					<li>
						Ucapan: {review.viewModel.wishesEnabled ? "aktif" : "nonaktif"}
					</li>
				</ul>
			</section>

			<div className="grid gap-3 sm:grid-cols-2">
				<Link
					href={getBuilderEditHref(review.themeSlug, review.invitationId)}
					className="rounded-md border border-border px-4 py-3 text-center font-semibold"
				>
					Kembali edit
				</Link>
				<Link
					href={`/create/review/${review.invitationId}/preview`}
					className="rounded-md border border-primary px-4 py-3 text-center font-semibold text-primary"
				>
					Lihat preview
				</Link>
			</div>

			<CheckoutBoundary invitationId={review.invitationId} />
		</main>
	);
}
