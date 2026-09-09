import { cva, type VariantProps } from "class-variance-authority";
import { type ClassValue, clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
	"inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-[opacity,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary: "bg-primary text-primary-foreground hover:opacity-90",
				secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
				destructive: "bg-destructive text-primary-foreground hover:opacity-90",
			},
		},
		defaultVariants: {
			variant: "primary",
		},
	},
);

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
	return (
		<button className={cn(buttonVariants({ variant }), className)} {...props} />
	);
}
