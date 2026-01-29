/**
 * Steps in the beauty page creation flow (7-step wizard)
 *
 * 1. name - Page name only
 * 2. nickname - Unique URL/slug (Fleeso-style preview)
 * 3. avatar - Optional avatar upload (preview only, uploads after creation)
 * 4. contacts - Optional contact info (Instagram, Telegram, Phone)
 * 5. services - Optional service setup
 * 6. first-working-day - Optional first working day setup (single day)
 * 7. confirmation - Final review before creation
 */
export type CreateBeautyPageStep =
  | "name"
  | "nickname"
  | "avatar"
  | "contacts"
  | "services"
  | "first-working-day"
  | "confirmation";

/**
 * Service data for the services step
 * Supports multiple services with local IDs for list management
 */
export interface ServiceData {
  id: string; // Local ID for React key and list operations
  name: string;
  priceCents: number;
  durationMinutes: number;
}

/**
 * Break time configuration (e.g., lunch break)
 */
export interface BreakTimeData {
  startTime: string; // "12:00"
  endTime: string; // "13:00"
}

/**
 * First working day configuration
 * Simple: just one date with start and end time, optional break
 */
export interface FirstWorkingDayData {
  date: string; // "YYYY-MM-DD" format
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  breakTime?: BreakTimeData; // Optional break (e.g., lunch)
}

/**
 * Main state object for the creation flow
 * All form data is stored here and persists across steps
 */
export interface CreateBeautyPageState {
  step: CreateBeautyPageStep;

  // Step 1: Name (required)
  name: string;

  // Step 2: Nickname (required)
  nickname: string;

  // Step 3: Avatar (optional - preview only, uploads after creation)
  avatarFile: File | null;
  avatarPreviewUrl: string | null;

  // Step 4: Contacts (optional - social media and phone)
  instagram: string;
  telegram: string;
  phone: string;

  // Step 5: Services (optional - empty array if skipped)
  services: ServiceData[];

  // Step 6: First Working Day (optional - null if skipped)
  firstWorkingDay: FirstWorkingDayData | null;
}

/**
 * Initial state for the creation flow
 */
export const initialState: CreateBeautyPageState = {
  step: "name",
  name: "",
  nickname: "",
  avatarFile: null,
  avatarPreviewUrl: null,
  instagram: "",
  telegram: "",
  phone: "",
  services: [],
  firstWorkingDay: null,
};

/**
 * Props for step components
 */
export interface StepProps {
  state: CreateBeautyPageState;
  onUpdate: (updates: Partial<CreateBeautyPageState>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

/**
 * Generate a unique local ID for services
 */
export function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Convert JS getDay() result (0=Sun, 1=Mon) to our weekday system (0=Mon, 6=Sun)
 */
export function jsWeekdayToOurs(jsWeekday: number): number {
  return jsWeekday === 0 ? 6 : jsWeekday - 1;
}
