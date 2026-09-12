import { MidtransCheckout } from "../../../features/payments/midtrans-checkout";

export function CheckoutBoundary({ invitationId }: { invitationId: string }) {
	return <MidtransCheckout invitationId={invitationId} />;
}
