"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type FieldErrors, type Resolver, useForm } from "react-hook-form";
import type { z } from "zod";
import { createPersistentDraft } from "@/actions/invitations/create";
import {
	createUploadUrl,
	updateInvitationPhotoPath,
} from "@/actions/invitations/upload";
import { createClient } from "@/lib/supabase/client";
import {
	type Step1IdentityInput,
	step1IdentitySchema,
} from "@/validations/invitation";
import { useLocalDraft } from "../hooks/use-local-draft";
import { compressImageToWebP } from "../utils/image";
import {
	createSlugAvailabilityChecker,
	fetchSlugAvailability,
} from "../utils/slug-availability";
import { EventsForm } from "./events-form";

function customZodResolver(
	schema: z.ZodType<Step1IdentityInput>,
): Resolver<Step1IdentityInput> {
	return async (values) => {
		const result = await schema.safeParseAsync(values);
		if (result.success) {
			return { values: result.data, errors: {} };
		}

		const errors: FieldErrors<Step1IdentityInput> = {};
		for (const error of result.error.issues) {
			const pathKey = error.path[0];
			if (typeof pathKey === "string" && pathKey in values) {
				errors[pathKey as keyof Step1IdentityInput] = {
					type: "zod",
					message: error.message,
				};
			}
		}
		return { values: {}, errors };
	};
}

type IdentityFormProps = {
	themeSlug: string;
};

export function IdentityForm({ themeSlug }: IdentityFormProps) {
	const router = useRouter();
	const { draft, saveDraft, clearDraft, isLoaded } = useLocalDraft();
	// biome-ignore lint/suspicious/noExplicitAny: Temporary until User type is imported
	const [user, setUser] = useState<any>(null);
	const [invitationId, setInvitationId] = useState<string | null>(null);
	const [isCheckingSlug, setIsCheckingSlug] = useState(false);
	const [slugError, setSlugError] = useState<string | null>(null);
	const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [supabase] = useState(() => createClient());

	const form = useForm<Step1IdentityInput>({
		resolver: customZodResolver(step1IdentitySchema),
		defaultValues: {
			slug: "",
			groom_name: "",
			groom_father_name: "",
			groom_mother_name: "",
			bride_name: "",
			bride_father_name: "",
			bride_mother_name: "",
			opening_greeting: "",
			prayer_text: "",
		},
	});

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			setUser(data.user);
		});
	}, [supabase]);

	useEffect(() => {
		if (isLoaded && Object.keys(draft).length > 0) {
			form.reset({
				slug: draft.slug || "",
				groom_name: draft.groom_name || "",
				groom_father_name: draft.groom_father_name || "",
				groom_mother_name: draft.groom_mother_name || "",
				bride_name: draft.bride_name || "",
				bride_father_name: draft.bride_father_name || "",
				bride_mother_name: draft.bride_mother_name || "",
				opening_greeting: draft.opening_greeting || "",
				prayer_text: draft.prayer_text || "",
			});
		}
	}, [isLoaded, draft, form]);

	// Save draft continuously or on blur
	const handleBlur = () => {
		saveDraft(form.getValues());
	};

	const currentSlug = form.watch("slug");

	useEffect(() => {
		setSlugAvailable(null);
		setSlugError(null);

		if (!currentSlug || currentSlug.length < 3) {
			setIsCheckingSlug(false);
			return;
		}

		setIsCheckingSlug(true);
		const checker = createSlugAvailabilityChecker(
			fetchSlugAvailability,
			(_slug, available) => {
				setSlugAvailable(available);
				setSlugError(available ? null : "Slug sudah digunakan.");
				setIsCheckingSlug(false);
			},
		);
		checker.check(currentSlug);

		return checker.cancel;
	}, [currentSlug]);

	const onSubmit = async (data: Step1IdentityInput) => {
		saveDraft(data);

		if (!user) {
			const callbackUrl = encodeURIComponent(`/create/${themeSlug}`);
			router.push(`/login?callbackUrl=${callbackUrl}`);
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await createPersistentDraft(themeSlug, data);
			setInvitationId(res.invitationId);
			clearDraft();
			// Normally would redirect to Step 2, but for this task we show upload UI
		} catch (error) {
			alert((error as Error).message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const fieldClass =
		"mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary";

	return (
		<div className="space-y-8">
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
					<h2 className="text-xl font-bold mb-4">Informasi URL</h2>
					<div>
						<label htmlFor="slug" className="block text-sm font-medium">
							Custom Slug (weplan.com/nama-anda)
						</label>
						<input
							id="slug"
							{...form.register("slug")}
							onBlur={handleBlur}
							className={fieldClass}
							placeholder="contoh: andi-siti"
						/>
						{isCheckingSlug && (
							<p className="text-sm text-muted-foreground mt-1">Mengecek...</p>
						)}
						{slugAvailable === true && (
							<p className="text-sm text-success mt-1">Slug tersedia!</p>
						)}
						{slugError && (
							<p className="text-sm text-destructive mt-1">{slugError}</p>
						)}
						{form.formState.errors.slug && (
							<p className="text-sm text-destructive mt-1">
								{form.formState.errors.slug.message}
							</p>
						)}
					</div>
				</div>

				<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
					<h2 className="text-xl font-bold mb-4">Mempelai Pria</h2>
					<div className="space-y-4">
						<div>
							<label htmlFor="groom_name" className="block text-sm font-medium">
								Nama Panggilan
							</label>
							<input
								id="groom_name"
								{...form.register("groom_name")}
								onBlur={handleBlur}
								className={fieldClass}
							/>
							{form.formState.errors.groom_name && (
								<p className="text-sm text-destructive mt-1">
									{form.formState.errors.groom_name.message}
								</p>
							)}
						</div>
						<div>
							<label
								htmlFor="groom_father_name"
								className="block text-sm font-medium"
							>
								Nama Ayah
							</label>
							<input
								id="groom_father_name"
								{...form.register("groom_father_name")}
								onBlur={handleBlur}
								className={fieldClass}
							/>
						</div>
						<div>
							<label
								htmlFor="groom_mother_name"
								className="block text-sm font-medium"
							>
								Nama Ibu
							</label>
							<input
								id="groom_mother_name"
								{...form.register("groom_mother_name")}
								onBlur={handleBlur}
								className={fieldClass}
							/>
						</div>
					</div>
				</div>

				<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
					<h2 className="text-xl font-bold mb-4">Mempelai Wanita</h2>
					<div className="space-y-4">
						<div>
							<label htmlFor="bride_name" className="block text-sm font-medium">
								Nama Panggilan
							</label>
							<input
								id="bride_name"
								{...form.register("bride_name")}
								onBlur={handleBlur}
								className={fieldClass}
							/>
							{form.formState.errors.bride_name && (
								<p className="text-sm text-destructive mt-1">
									{form.formState.errors.bride_name.message}
								</p>
							)}
						</div>
						<div>
							<label
								htmlFor="bride_father_name"
								className="block text-sm font-medium"
							>
								Nama Ayah
							</label>
							<input
								id="bride_father_name"
								{...form.register("bride_father_name")}
								onBlur={handleBlur}
								className={fieldClass}
							/>
						</div>
						<div>
							<label
								htmlFor="bride_mother_name"
								className="block text-sm font-medium"
							>
								Nama Ibu
							</label>
							<input
								id="bride_mother_name"
								{...form.register("bride_mother_name")}
								onBlur={handleBlur}
								className={fieldClass}
							/>
						</div>
					</div>
				</div>

				<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
					<h2 className="text-xl font-bold mb-4">Teks Undangan</h2>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="opening_greeting"
								className="block text-sm font-medium"
							>
								Salam Pembuka
							</label>
							<textarea
								id="opening_greeting"
								{...form.register("opening_greeting")}
								onBlur={handleBlur}
								className={fieldClass}
								rows={3}
							/>
						</div>
						<div>
							<label
								htmlFor="prayer_text"
								className="block text-sm font-medium"
							>
								Teks Doa
							</label>
							<textarea
								id="prayer_text"
								{...form.register("prayer_text")}
								onBlur={handleBlur}
								className={fieldClass}
								rows={3}
							/>
						</div>
					</div>
				</div>

				{!invitationId && (
					<button
						type="submit"
						disabled={isSubmitting || slugAvailable === false}
						className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold"
					>
						{isSubmitting ? "Menyimpan..." : "Simpan & Lanjut ke Upload Foto"}
					</button>
				)}
			</form>

			{invitationId && (
				<>
					<PhotoUploadBoundary invitationId={invitationId} />
					<EventsForm invitationId={invitationId} />
				</>
			)}
		</div>
	);
}

function PhotoUploadBoundary({ invitationId }: { invitationId: string }) {
	const [uploading, setUploading] = useState(false);

	const handleUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
		type: "cover" | "groom" | "bride",
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		try {
			// 1. Optimize image locally
			const webpBlob = await compressImageToWebP(file);
			if (webpBlob.size > 500 * 1024) {
				throw new Error(
					"Gambar terlalu besar setelah optimasi. Pilih gambar lain.",
				);
			}

			// 2. Get Signed URL
			const { signedUrl } = await createUploadUrl(invitationId, type);

			// 3. Upload to Supabase Storage
			const res = await fetch(signedUrl, {
				method: "PUT",
				body: webpBlob,
				headers: { "Content-Type": "image/webp" },
			});

			if (!res.ok) {
				throw new Error("Gagal mengunggah foto.");
			}

			// 4. Update Database path
			await updateInvitationPhotoPath(invitationId, type);
			alert("Foto berhasil diunggah.");
		} catch (error) {
			alert((error as Error).message);
		} finally {
			setUploading(false);
			e.target.value = ""; // reset input
		}
	};

	return (
		<div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
			<h2 className="text-xl font-bold">Upload Foto</h2>
			<div className="grid gap-4">
				<div className="border p-4 rounded-md">
					<p className="font-medium mb-2">Cover Photo</p>
					<input
						type="file"
						accept="image/*"
						onChange={(e) => handleUpload(e, "cover")}
						disabled={uploading}
					/>
				</div>
				<div className="border p-4 rounded-md">
					<p className="font-medium mb-2">Groom Photo</p>
					<input
						type="file"
						accept="image/*"
						onChange={(e) => handleUpload(e, "groom")}
						disabled={uploading}
					/>
				</div>
				<div className="border p-4 rounded-md">
					<p className="font-medium mb-2">Bride Photo</p>
					<input
						type="file"
						accept="image/*"
						onChange={(e) => handleUpload(e, "bride")}
						disabled={uploading}
					/>
				</div>
			</div>
			<button
				type="button"
				className="w-full border border-primary text-primary py-3 rounded-lg font-bold"
				onClick={() =>
					document
						.getElementById("events-step")
						?.scrollIntoView({ behavior: "smooth" })
				}
			>
				Lanjut ke Acara
			</button>
		</div>
	);
}
