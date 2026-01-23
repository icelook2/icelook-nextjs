/**
 * Data structure for PDF generation.
 * Contains all the profile information needed to render print materials.
 */
export interface PdfProfileData {
  name: string;
  nickname: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  profileUrl: string;
  qrCodeDataUrl: string;
}
