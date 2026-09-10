"use client";

import * as motion from "motion/react-client";
import { useEffect, useState } from "react";
import type { InvitationViewModel } from "../../../types/theme";
import {
	type CountdownParts,
	getCountdownParts,
	getMainEvent,
	getMainEventCountdownTarget,
} from "../../shared/countdown";

function Countdown({ target }: { target: number }) {
	const [parts, setParts] = useState<CountdownParts | null>(null);

	useEffect(() => {
		const update = () => setParts(getCountdownParts(target, Date.now()));
		update();
		const interval = window.setInterval(update, 1000);
		return () => window.clearInterval(interval);
	}, [target]);

	if (!parts) {
		return null;
	}

	return (
		<div
			aria-label="Countdown menuju acara utama"
			className="mt-8 flex justify-center gap-4"
			role="timer"
		>
			{Object.entries(parts).map(([label, value]) => (
				<div className="min-w-16" key={label}>
					<strong className="block text-2xl text-theme-primary">{value}</strong>
					<span className="text-xs uppercase tracking-wide">{label}</span>
				</div>
			))}
		</div>
	);
}

export function Hero({ invitation }: { invitation: InvitationViewModel }) {
	const mainEvent = getMainEvent(invitation);
	const countdownTarget = getMainEventCountdownTarget(invitation);

	return (
		<motion.section
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			className="section-padding text-center min-h-[70vh] flex flex-col justify-center bg-cover bg-center"
			style={
				invitation.coverPhotoUrl
					? { backgroundImage: `url(${invitation.coverPhotoUrl})` }
					: undefined
			}
		>
			<h3 className="uppercase tracking-widest text-sm mb-4">The Wedding Of</h3>
			<h1 className="text-6xl font-serif text-theme-primary mb-4">
				{invitation.groom.nickname} & {invitation.bride.nickname}
			</h1>
			{mainEvent ? (
				<p className="text-lg">
					{new Date(mainEvent.date).toLocaleDateString("en-US", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</p>
			) : null}
			{countdownTarget === null ? null : <Countdown target={countdownTarget} />}
		</motion.section>
	);
}
