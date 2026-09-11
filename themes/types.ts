import type { ComponentType } from "react";
import type { InvitationViewModel, InviteeViewModel } from "../types/theme";

export interface InvitationThemeProps {
	invitation: InvitationViewModel;
	invitee: InviteeViewModel;
	onOpen?: () => void;
}

export type ThemeComponent = ComponentType<InvitationThemeProps>;
