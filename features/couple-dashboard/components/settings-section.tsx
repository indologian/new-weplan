import { InteractionConfigForm } from "../../invitation-builder/components/interaction-config-form";

export function SettingsSection({
	invitationId,
	fullName,
}: {
	invitationId: string | null;
	fullName: string;
}) {
	return (
		<section
			id="settings"
			className="space-y-4"
			aria-labelledby="settings-title"
		>
			<h2 id="settings-title" className="font-serif text-2xl">
				Pengaturan
			</h2>
			<div className="rounded-lg border border-border bg-card p-5">
				<p className="text-sm text-muted-foreground">Profil pasangan</p>
				<p className="font-semibold">{fullName}</p>
			</div>
			{invitationId && <InteractionConfigForm invitationId={invitationId} />}
		</section>
	);
}
