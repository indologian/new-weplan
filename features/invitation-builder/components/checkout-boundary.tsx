export function CheckoutBoundary({ invitationId }: { invitationId: string }) {
	return (
		<div data-checkout-invitation-id={invitationId}>
			<button
				type="button"
				disabled
				className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
			>
				Bayar &amp; Publish
			</button>
			<p className="mt-2 text-sm text-muted-foreground">
				Checkout belum tersedia. Undangan belum dipublikasikan atau diaktifkan.
			</p>
		</div>
	);
}
