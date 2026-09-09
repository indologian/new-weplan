import { Button } from "@/components/ui/button";

export default function HomePage() {
	return (
		<main className="mx-auto max-w-6xl px-6 py-16">
			<section className="rounded-lg border border-border bg-card p-[clamp(2rem,8vw,5rem)] text-card-foreground">
				<p className="m-0 font-bold text-primary">Weplan</p>
				<h1 className="my-4 font-serif text-[clamp(2.25rem,6vw,4.5rem)]">
					Rencanakan hari istimewa Anda.
				</h1>
				<p className="m-0 text-lg text-muted-foreground">
					Fondasi aplikasi siap untuk perjalanan pernikahan Anda.
				</p>
				<Button className="mt-8" type="button">
					Mulai merencanakan
				</Button>
			</section>
		</main>
	);
}
