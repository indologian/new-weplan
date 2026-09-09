import type { EventModel, InvitationViewModel } from "../../types/theme";

export interface CountdownParts {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

export function getMainEvent(
	invitation: InvitationViewModel,
): EventModel | null {
	return invitation.events.find((event) => event.isMainEvent) ?? null;
}

export function getMainEventCountdownTarget(
	invitation: InvitationViewModel,
): number | null {
	const mainEvent = getMainEvent(invitation);
	if (!mainEvent) {
		return null;
	}

	const target = new Date(mainEvent.date).getTime();
	return Number.isFinite(target) ? target : null;
}

export function getCountdownParts(target: number, now: number): CountdownParts {
	const remainingSeconds = Math.max(0, Math.floor((target - now) / 1000));

	return {
		days: Math.floor(remainingSeconds / 86_400),
		hours: Math.floor((remainingSeconds % 86_400) / 3_600),
		minutes: Math.floor((remainingSeconds % 3_600) / 60),
		seconds: remainingSeconds % 60,
	};
}
