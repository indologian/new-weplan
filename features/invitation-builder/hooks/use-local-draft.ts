import { useEffect, useState } from "react";
import type { Step1IdentityInput } from "@/validations/invitation";

const DRAFT_KEY = "weplan_step1_draft";

export function useLocalDraft() {
	const [draft, setDraft] = useState<Partial<Step1IdentityInput>>({});
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(DRAFT_KEY);
			if (saved) {
				setDraft(JSON.parse(saved));
			}
		} catch (e) {
			console.error("Failed to restore draft:", e);
		} finally {
			setIsLoaded(true);
		}
	}, []);

	const saveDraft = (data: Partial<Step1IdentityInput>) => {
		setDraft(data);
		try {
			localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
		} catch (e) {
			console.error("Failed to save draft:", e);
		}
	};

	const clearDraft = () => {
		setDraft({});
		localStorage.removeItem(DRAFT_KEY);
	};

	return { draft, saveDraft, clearDraft, isLoaded };
}
