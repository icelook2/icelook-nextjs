/**
 * Steps in the beauty page creation flow (7-step wizard)
 *
 * 1. intro - Introduction explaining what a beauty page is
 * 2. name - Page name only
 * 3. nickname - Unique URL/slug (Fleeso-style preview)
 * 4. services - Optional service setup
 * 5. working-days - Optional working days selection
 * 6. working-hours - Optional working hours configuration (conditional)
 * 7. confirmation - Final review before creation
 */
export type CreateBeautyPageStep =
  | "intro"
  | "name"
  | "nickname"
  | "services"
  | "working-days"
  | "working-hours"
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
 * Working hours configuration per weekday
 * Weekday uses our system: 0=Monday, 6=Sunday
 */
export interface WeekdayHoursData {
  weekday: number;
  weekdayName: string;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

/**
 * Selected date info for grouping by weekday
 */
export interface SelectedDateInfo {
  dateStr: string; // "2024-01-15"
  weekday: number; // 0=Monday, 6=Sunday
  weekdayName: string; // "Monday"
}

/**
 * Main state object for the creation flow
 * All form data is stored here and persists across steps
 */
export interface CreateBeautyPageState {
  step: CreateBeautyPageStep;

  // Step 2: Name (required)
  name: string;

  // Step 3: Nickname (required)
  nickname: string;

  // Step 4: Services (optional - empty array if skipped)
  services: ServiceData[];

  // Step 5: Working Days (optional - empty set if skipped)
  selectedDates: Set<string>; // "YYYY-MM-DD" format

  // Step 6: Working Hours (optional - empty map if skipped)
  // Key is weekday (0=Monday, 6=Sunday)
  weekdayHours: Map<number, WeekdayHoursData>;
}

/**
 * Initial state for the creation flow
 */
export const initialState: CreateBeautyPageState = {
  step: "intro",
  name: "",
  nickname: "",
  services: [],
  selectedDates: new Set(),
  weekdayHours: new Map(),
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
