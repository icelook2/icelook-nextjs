"use client";

import { PrintMaterialsSection } from "./print-materials-section";
import { ProfileLinkSection } from "./profile-link-section";
import { QrCodeSection } from "./qr-code-section";

interface ShareProfileContentProps {
  name: string;
  nickname: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  profileUrl: string;
}

export function ShareProfileContent({
  name,
  nickname,
  avatarUrl,
  rating,
  reviewCount,
  profileUrl,
}: ShareProfileContentProps) {
  return (
    <div className="space-y-6">
      <ProfileLinkSection profileUrl={profileUrl} />
      <QrCodeSection profileUrl={profileUrl} nickname={nickname} />
      <PrintMaterialsSection
        name={name}
        nickname={nickname}
        avatarUrl={avatarUrl}
        rating={rating}
        reviewCount={reviewCount}
        profileUrl={profileUrl}
      />
    </div>
  );
}
