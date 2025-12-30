/**
 * Booking Layout Components
 *
 * Horizontal 4-column booking layout for tablet/desktop.
 * Columns: Services | Specialists | Date & Time | Confirmation
 * Provides bi-directional filtering between columns.
 */

export {
  BookingLayout,
  type BookingLayoutTranslations,
} from "./booking-layout";
export {
  BookingLayoutProvider,
  useBookingLayout,
  type SpecialistWithPrice,
} from "./booking-layout-context";
export { ServicesColumn } from "./services-column";
export { SpecialistsColumn } from "./specialists-column";
export { DateTimeColumn } from "./date-time-column";
export { ConfirmationColumn } from "./confirmation-column";
export { CalendarView } from "./calendar-view";
export { TimeSlotGrid } from "./time-slot-grid";
export { SpecialistBookingCard } from "./specialist-booking-card";
