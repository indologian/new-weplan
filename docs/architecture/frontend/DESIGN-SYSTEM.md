# Design System

## Website
Use semantic CSS variables as source of truth:
- primary / primary-foreground
- secondary / secondary-foreground
- background / foreground
- card / card-foreground
- muted / muted-foreground
- border
- accent
- success
- warning
- destructive
- radius tokens
- body and heading font tokens

Reusable components must use semantic tokens, not hardcoded brand hex/Tailwind palette names.

Application UI: Tailwind + shadcn/ui.
Forms: React Hook Form + Zod.
Icons: lucide-react.

## Invitation themes
Invitation colors/fonts are isolated under each theme and must not inherit website brand tokens unintentionally.

## Animation
Use Motion for React for theme reveal/opening/scroll animations; CSS/Tailwind for simple transitions. Prefer opacity/transform; support reduced motion.
