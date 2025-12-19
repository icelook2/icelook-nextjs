"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  type Appointment,
  calculateEndTime,
  createAppointmentSchema,
  createMultiServiceAppointmentSchema,
  formatTimeForDatabase,
  type TimeSlot,
} from "@/lib/appointments";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ============================================================================
// Get Available Slots
// ============================================================================

interface GetAvailableSlotsParams {
  specialistId: string;
  date: string; // "YYYY-MM-DD"
  serviceDuration: number; // minutes
}

interface AvailableSlotsResult {
  slots: TimeSlot[];
  isWorkingDay: boolean;
}

/**
 * Get available time slots for a specific date.
 * Takes into account working hours, breaks, and existing appointments.
 */
export async function getAvailableSlots(
  params: GetAvailableSlotsParams,
): Promise<ActionResult<AvailableSlotsResult>> {
  const { specialistId, date, serviceDuration } = params;
  const supabase = await createClient();

  // 1. Get working day for this date
  const { data: workingDay, error: workingDayError } = await supabase
    .from("working_days")
    .select(
      `
      *,
      working_day_breaks (*)
    `,
    )
    .eq("specialist_id", specialistId)
    .eq("date", date)
    .single();

  if (workingDayError && workingDayError.code !== "PGRST116") {
    return { success: false, error: workingDayError.message };
  }

  // Not a working day
  if (!workingDay) {
    return { success: true, data: { slots: [], isWorkingDay: false } };
  }

  // 2. Get existing appointments for this date
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("start_time, end_time, status")
    .eq("specialist_id", specialistId)
    .eq("date", date)
    .in("status", ["pending", "confirmed"]);

  if (appointmentsError) {
    return { success: false, error: appointmentsError.message };
  }

  // 3. Get specialist's schedule config for slot duration
  const { data: config } = await supabase
    .from("schedule_configs")
    .select("default_slot_duration")
    .eq("specialist_id", specialistId)
    .single();

  const slotDuration = config?.default_slot_duration ?? 30;

  // 4. Generate time slots
  const slots: TimeSlot[] = [];
  const startTime = workingDay.start_time.slice(0, 5); // "HH:MM"
  const endTime = workingDay.end_time.slice(0, 5);
  const breaks = workingDay.working_day_breaks || [];

  // Parse times to minutes for easier calculation
  const parseTime = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const formatTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const dayStart = parseTime(startTime);
  const dayEnd = parseTime(endTime);

  // Generate slots based on slot duration
  for (
    let time = dayStart;
    time + serviceDuration <= dayEnd;
    time += slotDuration
  ) {
    const slotStart = formatTime(time);
    const slotEnd = calculateEndTime(slotStart, serviceDuration);

    // Check if slot overlaps with breaks
    const overlapsBreak = breaks.some(
      (br: { start_time: string; end_time: string }) => {
        const breakStart = parseTime(br.start_time.slice(0, 5));
        const breakEnd = parseTime(br.end_time.slice(0, 5));
        return time < breakEnd && time + serviceDuration > breakStart;
      },
    );

    // Check if slot overlaps with existing appointments
    const overlapsAppointment = (appointments || []).some((apt) => {
      const aptStart = parseTime(apt.start_time.slice(0, 5));
      const aptEnd = parseTime(apt.end_time.slice(0, 5));
      return time < aptEnd && time + serviceDuration > aptStart;
    });

    let blockedReason: "break" | "booked" | undefined;
    if (overlapsBreak) {
      blockedReason = "break";
    } else if (overlapsAppointment) {
      blockedReason = "booked";
    }

    slots.push({
      start: slotStart,
      end: slotEnd,
      available: !overlapsBreak && !overlapsAppointment,
      blockedReason,
    });
  }

  return { success: true, data: { slots, isWorkingDay: true } };
}

// ============================================================================
// Create Appointment
// ============================================================================

interface CreateAppointmentParams {
  specialist_id: string;
  service_id: string;
  date: string;
  start_time: string;
  client_notes?: string;
  guest_name?: string;
  guest_phone?: string;
}

interface CreateAppointmentResult {
  appointment: Appointment;
  autoConfirmed: boolean;
}

/**
 * Create a new appointment.
 * Handles both authenticated users and guest bookings.
 */
export async function createAppointment(
  params: CreateAppointmentParams,
): Promise<ActionResult<CreateAppointmentResult>> {
  const t = await getTranslations("booking");

  // Validate input
  const validation = createAppointmentSchema.safeParse(params);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return { success: false, error: issue.message || t("error_generic") };
  }

  const supabase = await createClient();

  // Get current user (may be null for guest booking)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Get specialist data for snapshot
  const { data: specialist, error: specialistError } = await supabase
    .from("specialists")
    .select("id, username, display_name, user_id")
    .eq("id", params.specialist_id)
    .single();

  if (specialistError || !specialist) {
    return { success: false, error: t("error_generic") };
  }

  // 2. Get schedule config for timezone and auto-confirm setting
  const { data: scheduleConfig } = await supabase
    .from("schedule_configs")
    .select("timezone")
    .eq("specialist_id", params.specialist_id)
    .single();

  // 3. Get booking settings for auto-confirm
  const { data: bookingSettings } = await supabase
    .from("specialist_booking_settings")
    .select("auto_confirm")
    .eq("specialist_id", params.specialist_id)
    .single();

  const autoConfirm = bookingSettings?.auto_confirm ?? false;
  const timezone = scheduleConfig?.timezone ?? "Europe/Kyiv";

  // 4. Get service data for snapshot
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, price, currency, duration_minutes")
    .eq("id", params.service_id)
    .single();

  if (serviceError || !service) {
    return { success: false, error: t("error_generic") };
  }

  // 5. Get client data for snapshot (if authenticated)
  let clientName = params.guest_name ?? "";
  const clientPhone = params.guest_phone ?? "";
  let clientEmail: string | null = null;
  let clientId: string | null = null;

  if (user) {
    clientId = user.id;
    clientEmail = user.email ?? null;

    // Get user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) {
      clientName = profile.full_name;
    }
  }

  // Validate guest booking has required info
  if (!user && (!params.guest_name || !params.guest_phone)) {
    return { success: false, error: t("error_generic") };
  }

  // 6. Verify slot is still available
  const endTime = calculateEndTime(params.start_time, service.duration_minutes);

  const { data: existingAppointment } = await supabase
    .from("appointments")
    .select("id")
    .eq("specialist_id", params.specialist_id)
    .eq("date", params.date)
    .in("status", ["pending", "confirmed"])
    .or(
      `and(start_time.lt.${formatTimeForDatabase(endTime)},end_time.gt.${formatTimeForDatabase(params.start_time)})`,
    )
    .limit(1)
    .single();

  if (existingAppointment) {
    return { success: false, error: t("error_slot_taken") };
  }

  // 7. Create the appointment with snapshot data
  const appointmentData = {
    specialist_id: params.specialist_id,
    service_id: params.service_id,
    client_id: clientId,

    // Snapshot data
    specialist_username: specialist.username,
    specialist_display_name: specialist.display_name,
    service_name: service.name,
    service_price: service.price,
    service_currency: service.currency,
    service_duration_minutes: service.duration_minutes,
    client_name: clientName,
    client_phone: clientPhone,
    client_email: clientEmail,

    // Booking details
    date: params.date,
    start_time: formatTimeForDatabase(params.start_time),
    end_time: formatTimeForDatabase(endTime),
    timezone,
    status: autoConfirm ? "confirmed" : "pending",
    client_notes: params.client_notes || null,
  };

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert(appointmentData)
    .select()
    .single();

  if (insertError || !appointment) {
    console.error("Failed to create appointment:", insertError);
    return { success: false, error: t("error_generic") };
  }

  // Revalidate specialist profile page
  revalidatePath(`/@${specialist.username}`);

  return {
    success: true,
    data: {
      appointment: appointment as Appointment,
      autoConfirmed: autoConfirm,
    },
  };
}

// ============================================================================
// Check Slot Availability (quick check)
// ============================================================================

/**
 * Quick check if a specific slot is available.
 */
export async function checkSlotAvailability(
  specialistId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
): Promise<ActionResult<{ available: boolean }>> {
  const supabase = await createClient();
  const endTime = calculateEndTime(startTime, durationMinutes);

  // Check for overlapping appointments
  const { data: existingAppointment, error } = await supabase
    .from("appointments")
    .select("id")
    .eq("specialist_id", specialistId)
    .eq("date", date)
    .in("status", ["pending", "confirmed"])
    .or(
      `and(start_time.lt.${formatTimeForDatabase(endTime)},end_time.gt.${formatTimeForDatabase(startTime)})`,
    )
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: { available: !existingAppointment },
  };
}

// ============================================================================
// Create Multi-Service Appointment
// ============================================================================

interface CreateMultiServiceAppointmentParams {
  specialist_id: string;
  service_ids: string[];
  date: string;
  start_time: string;
  client_notes?: string;
  guest_name?: string;
  guest_phone?: string;
}

interface CreateMultiServiceAppointmentResult {
  appointment: Appointment;
  autoConfirmed: boolean;
}

/**
 * Create a new appointment with multiple services.
 * Services are combined into a single time slot with total duration.
 * Service data is snapshotted to preserve prices at booking time.
 */
export async function createMultiServiceAppointment(
  params: CreateMultiServiceAppointmentParams,
): Promise<ActionResult<CreateMultiServiceAppointmentResult>> {
  const t = await getTranslations("booking");

  // Validate input
  const validation = createMultiServiceAppointmentSchema.safeParse(params);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return { success: false, error: issue.message || t("error_generic") };
  }

  const supabase = await createClient();

  // Get current user (may be null for guest booking)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Get specialist data for snapshot
  const { data: specialist, error: specialistError } = await supabase
    .from("specialists")
    .select("id, username, display_name, user_id")
    .eq("id", params.specialist_id)
    .single();

  if (specialistError || !specialist) {
    return { success: false, error: t("error_generic") };
  }

  // 2. Get schedule config for timezone
  const { data: scheduleConfig } = await supabase
    .from("schedule_configs")
    .select("timezone")
    .eq("specialist_id", params.specialist_id)
    .single();

  // 3. Get booking settings for auto-confirm
  const { data: bookingSettings } = await supabase
    .from("specialist_booking_settings")
    .select("auto_confirm")
    .eq("specialist_id", params.specialist_id)
    .single();

  const autoConfirm = bookingSettings?.auto_confirm ?? false;
  const timezone = scheduleConfig?.timezone ?? "Europe/Kyiv";

  // 4. Get all services data for snapshot
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, name, price, currency, duration_minutes")
    .in("id", params.service_ids);

  if (servicesError || !services || services.length === 0) {
    return { success: false, error: t("error_generic") };
  }

  // Verify all requested services were found
  if (services.length !== params.service_ids.length) {
    return { success: false, error: t("error_generic") };
  }

  // 5. Validate all services have the same currency
  const currencies = [...new Set(services.map((s) => s.currency))];
  if (currencies.length > 1) {
    return { success: false, error: t("error_mixed_currencies") };
  }

  // 6. Calculate totals
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDurationMinutes = services.reduce(
    (sum, s) => sum + s.duration_minutes,
    0,
  );
  const currency = services[0].currency;

  // 7. Get client data for snapshot (if authenticated)
  let clientName = params.guest_name ?? "";
  const clientPhone = params.guest_phone ?? "";
  let clientEmail: string | null = null;
  let clientId: string | null = null;

  if (user) {
    clientId = user.id;
    clientEmail = user.email ?? null;

    // Get user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) {
      clientName = profile.full_name;
    }
  }

  // Validate guest booking has required info
  if (!user && (!params.guest_name || !params.guest_phone)) {
    return { success: false, error: t("error_generic") };
  }

  // 8. Verify slot is still available
  const endTime = calculateEndTime(params.start_time, totalDurationMinutes);

  const { data: existingAppointment } = await supabase
    .from("appointments")
    .select("id")
    .eq("specialist_id", params.specialist_id)
    .eq("date", params.date)
    .in("status", ["pending", "confirmed"])
    .or(
      `and(start_time.lt.${formatTimeForDatabase(endTime)},end_time.gt.${formatTimeForDatabase(params.start_time)})`,
    )
    .limit(1)
    .single();

  if (existingAppointment) {
    return { success: false, error: t("error_slot_taken") };
  }

  // 9. Create the appointment with total price and duration
  // Use first service for backward compatibility with single-service fields
  const primaryService = services.find((s) => s.id === params.service_ids[0]);
  if (!primaryService) {
    return { success: false, error: t("error_generic") };
  }

  const appointmentData = {
    specialist_id: params.specialist_id,
    service_id: primaryService.id,
    client_id: clientId,

    // Snapshot: Specialist data at booking time
    specialist_username: specialist.username,
    specialist_display_name: specialist.display_name,

    // Snapshot: Primary service data (for backward compatibility)
    service_name: primaryService.name,
    service_price: primaryService.price,
    service_currency: primaryService.currency,
    service_duration_minutes: primaryService.duration_minutes,

    // Multi-service totals
    total_price: totalPrice,
    total_duration_minutes: totalDurationMinutes,

    // Snapshot: Client data at booking time
    client_name: clientName,
    client_phone: clientPhone,
    client_email: clientEmail,

    // Booking details
    date: params.date,
    start_time: formatTimeForDatabase(params.start_time),
    end_time: formatTimeForDatabase(endTime),
    timezone,
    status: autoConfirm ? "confirmed" : "pending",
    client_notes: params.client_notes || null,
  };

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert(appointmentData)
    .select()
    .single();

  if (insertError || !appointment) {
    console.error("Failed to create appointment:", insertError);
    return { success: false, error: t("error_generic") };
  }

  // 10. Create appointment_services records for each service
  // Order services by their position in the original request
  // Build a map for efficient lookup (all services were validated earlier)
  const servicesMap = new Map(services.map((s) => [s.id, s]));
  const appointmentServicesData = params.service_ids.map((serviceId, index) => {
    const service = servicesMap.get(serviceId);
    // Service is guaranteed to exist due to earlier validation
    return {
      appointment_id: appointment.id,
      service_id: serviceId,
      service_name: service?.name ?? "",
      service_price: service?.price ?? 0,
      service_currency: currency,
      service_duration_minutes: service?.duration_minutes ?? 0,
      position: index,
    };
  });

  const { error: servicesInsertError } = await supabase
    .from("appointment_services")
    .insert(appointmentServicesData);

  if (servicesInsertError) {
    // Log error but don't fail - appointment was created successfully
    console.error(
      "Failed to create appointment_services:",
      servicesInsertError,
    );
  }

  // Revalidate specialist profile page
  revalidatePath(`/@${specialist.username}`);

  return {
    success: true,
    data: {
      appointment: appointment as Appointment,
      autoConfirmed: autoConfirm,
    },
  };
}
