// Special offer status type
export type SpecialOfferStatus = "active" | "booked" | "expired";

/**
 * Special offer as stored in the database
 */
export type SpecialOffer = {
  id: string;
  beautyPageId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  discountPercentage: number;
  originalPriceCents: number;
  discountedPriceCents: number;
  status: SpecialOfferStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Special offer with service details for display
 */
export type SpecialOfferWithService = SpecialOffer & {
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    serviceGroupId: string;
  };
};

/**
 * Input for creating a new special offer
 */
export type CreateSpecialOfferInput = {
  beautyPageId: string;
  nickname: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  discountPercentage: number;
};

/**
 * Form values for the create dialog
 */
export type CreateSpecialOfferFormValues = {
  serviceId: string;
  date: Date;
  startTime: string;
  discountPercentage: number;
};
