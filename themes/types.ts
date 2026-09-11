import type { ComponentType, ReactNode } from "react";
import type { InvitationViewModel, InviteeViewModel } from "../types/theme";

export interface InvitationThemeProps {
	invitation: InvitationViewModel;
	invitee: InviteeViewModel;
	onOpen?: () => void;
	rsvpInteraction?: ReactNode;
	wishesInteraction?: ReactNode;
}

export type ThemeComponent = ComponentType<InvitationThemeProps>;
