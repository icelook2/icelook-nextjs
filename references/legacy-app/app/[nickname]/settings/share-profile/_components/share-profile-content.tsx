"use client";

import { ProfileLinkSection } from "./profile-link-section";

interface ShareProfileContentProps {
  profileUrl: string;
}

export function ShareProfileContent({ profileUrl }: ShareProfileContentProps) {
  return (
    <div className="space-y-6">
      <ProfileLinkSection profileUrl={profileUrl} />
    </div>
  );
}
