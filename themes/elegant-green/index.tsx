"use client";

import { useState } from "react";
import type { InvitationThemeProps } from "../types";
import "./theme.css";

import { Bride } from "./sections/bride";
import { Events } from "./sections/events";
import { Footer } from "./sections/footer";
import { Gallery } from "./sections/gallery";
import { Gift } from "./sections/gift";
import { Greeting } from "./sections/greeting";
import { Groom } from "./sections/groom";
import { Hero } from "./sections/hero";
import { Maps } from "./sections/maps";
import { OpenInvitation } from "./sections/open-invitation";
import { Prayer } from "./sections/prayer";
import { Rsvp } from "./sections/rsvp";
import { CoupleStory } from "./sections/story";
import { Wishes } from "./sections/wishes";

export function ElegantGreenTheme({
  invitation,
  invitee,
}: InvitationThemeProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="theme-elegant-green">
        <OpenInvitation
          invitation={invitation}
          invitee={invitee}
          onOpen={() => setIsOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="theme-elegant-green">
      <Hero invitation={invitation} />
      <Greeting invitation={invitation} />
      <Groom invitation={invitation} />
      <Bride invitation={invitation} />
      <Prayer invitation={invitation} />
      <Events invitation={invitation} />
      <Maps invitation={invitation} />
      {invitation.story && invitation.story.length > 0 && (
        <CoupleStory invitation={invitation} />
      )}
      {invitation.gallery && invitation.gallery.length > 0 && (
        <Gallery invitation={invitation} />
      )}
      <Rsvp invitee={invitee} />
      <Gift invitation={invitation} />
      <Wishes invitation={invitation} />
      <Footer invitation={invitation} />
    </div>
  );
}
