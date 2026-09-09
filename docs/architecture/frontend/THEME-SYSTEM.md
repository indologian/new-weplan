# Theme System

Recommended root:
```
themes/
  registry.ts
  types.ts
  shared/
  elegant-green/
    index.tsx
    config.ts
    animations.ts
    theme.css
    sections/
```

All themes use the same data contract:
```ts
export interface InvitationThemeProps {
  invitation: InvitationViewModel
  invitee: InviteeViewModel
}
```

DB stores `renderer_key`; registry maps it to an allowlisted component.

Tier must NOT determine source folder. Admin may move a theme between tiers without code movement.

Sections:
1. Open Invitation
2. Hero/date/countdown
3. Opening greeting
4. Groom
5. Bride
6. Prayer
7. Events
8. Maps
9. Couple Story
10. Gallery
11. RSVP
12. Gift
13. Wishes
14. Footer

Animations are source-code theme concerns.
