import { format } from "date-fns";
import type {
  AnalyticsData,
  AnalyticsPeriod,
  AppointmentMetrics,
  ClientMetrics,
  OperationalMetrics,
  PeakTimesData,
  RatingMetrics,
  RevenueMetrics,
  ServiceMetrics,
} from "@/app/[nickname]/settings/analytics/_lib/types";
import {
  calculateTrend,
  getDateRangeForPeriod,
  getPreviousPeriodRange,
} from "@/app/[nickname]/settings/analytics/_lib/utils";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetch comprehensive analytics data for a beauty page
 */
export async function getBeautyPageAnalytics(
  beautyPageId: string,
  period: AnalyticsPeriod,
): Promise<AnalyticsData> {
  const supabase = await createClient();

  // Calculate date ranges
  const { startDate, endDate } = getDateRangeForPeriod(period);
  const { startDate: prevStartDate, endDate: prevEndDate } =
    getPreviousPeriodRange(period, startDate, endDate);

  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");
  const prevStartDateStr = format(prevStartDate, "yyyy-MM-dd");
  const prevEndDateStr = format(prevEndDate, "yyyy-MM-dd");

  // Fetch all required data in parallel
  const [
    currentAppointments,
    previousAppointments,
    allTimeAppointments,
    reviews,
  ] = await Promise.all([
    // Current period appointments
    supabase
      .from("appointments")
      .select("*")
      .eq("beauty_page_id", beautyPageId)
      .gte("date", startDateStr)
      .lte("date", endDateStr),

    // Previous period appointments (for trend calculation)
    supabase
      .from("appointments")
      .select("service_price_cents, status, client_id, client_name")
      .eq("beauty_page_id", beautyPageId)
      .gte("date", prevStartDateStr)
      .lte("date", prevEndDateStr),

    // All-time appointments for client retention calculation
    supabase
      .from("appointments")
      .select("client_id, client_name, status, service_price_cents")
      .eq("beauty_page_id", beautyPageId)
      .eq("status", "completed"),

    // Reviews for rating metrics
    supabase
      .from("reviews")
      .select("rating, created_at")
      .eq("beauty_page_id", beautyPageId),
  ]);

  if (currentAppointments.error) {
    console.error(
      "Error fetching current appointments:",
      currentAppointments.error,
    );
    throw currentAppointments.error;
  }

  const appointments = currentAppointments.data ?? [];
  const prevAppointments = previousAppointments.data ?? [];
  const allAppointments = allTimeAppointments.data ?? [];
  const allReviews = reviews.data ?? [];

  // Calculate metrics
  const revenue = calculateRevenueMetrics(
    appointments,
    prevAppointments,
    startDateStr,
    endDateStr,
  );
  const appointmentMetrics = calculateAppointmentMetrics(
    appointments,
    prevAppointments,
  );
  const clients = calculateClientMetrics(
    appointments,
    allAppointments,
    prevAppointments,
  );
  const services = calculateServiceMetrics(appointments, revenue.totalCents);
  const operational = calculateOperationalMetrics(appointments);
  const peakTimes = calculatePeakTimes(appointments);
  const ratings = calculateRatingMetrics(allReviews, startDateStr, endDateStr);

  // Calculate average ticket and its trend
  const completedCount = appointments.filter(
    (a) => a.status === "completed",
  ).length;
  const averageTicketCents =
    completedCount > 0 ? Math.round(revenue.totalCents / completedCount) : null;

  // Calculate previous period average ticket for trend
  const prevCompletedCount = prevAppointments.filter(
    (a) => a.status === "completed",
  ).length;
  const prevRevenue = prevAppointments
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + a.service_price_cents, 0);
  const prevAverageTicketCents =
    prevCompletedCount > 0
      ? Math.round(prevRevenue / prevCompletedCount)
      : null;
  const averageTicketTrend = calculateTrend(
    averageTicketCents ?? 0,
    prevAverageTicketCents ?? 0,
  );

  return {
    period: {
      type: period,
      startDate: startDateStr,
      endDate: endDateStr,
      previousStartDate: prevStartDateStr,
      previousEndDate: prevEndDateStr,
    },
    revenue,
    appointments: appointmentMetrics,
    averageTicketCents,
    averageTicketTrend,
    clients,
    services,
    operational,
    peakTimes,
    ratings,
  };
}

/**
 * Calculate revenue metrics from appointments
 */
function calculateRevenueMetrics(
  appointments: Array<{
    date: string;
    status: string;
    service_price_cents: number;
    service_currency: string;
    service_id: string | null;
    service_name: string;
  }>,
  previousAppointments: Array<{
    status: string;
    service_price_cents: number;
  }>,
  _startDate: string,
  _endDate: string,
): RevenueMetrics {
  // Only count completed appointments for revenue
  const completed = appointments.filter((a) => a.status === "completed");
  const prevCompleted = previousAppointments.filter(
    (a) => a.status === "completed",
  );

  const totalCents = completed.reduce(
    (sum, a) => sum + a.service_price_cents,
    0,
  );
  const prevTotalCents = prevCompleted.reduce(
    (sum, a) => sum + a.service_price_cents,
    0,
  );

  // Get currency (default to UAH if no completed appointments)
  const currency = completed[0]?.service_currency ?? "UAH";

  // Revenue by date
  const byDateMap = new Map<string, number>();
  for (const a of completed) {
    const current = byDateMap.get(a.date) ?? 0;
    byDateMap.set(a.date, current + a.service_price_cents);
  }
  const byDate = Array.from(byDateMap.entries())
    .map(([date, amountCents]) => ({ date, amountCents }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Revenue by service
  const byServiceMap = new Map<
    string,
    { serviceName: string; totalCents: number; count: number }
  >();
  for (const a of completed) {
    const key = a.service_id ?? a.service_name;
    const current = byServiceMap.get(key) ?? {
      serviceName: a.service_name,
      totalCents: 0,
      count: 0,
    };
    byServiceMap.set(key, {
      serviceName: a.service_name,
      totalCents: current.totalCents + a.service_price_cents,
      count: current.count + 1,
    });
  }
  const byService = Array.from(byServiceMap.entries())
    .map(([serviceId, data]) => ({
      serviceId: serviceId === data.serviceName ? null : serviceId,
      serviceName: data.serviceName,
      totalCents: data.totalCents,
      count: data.count,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);

  return {
    totalCents,
    currency,
    trend: calculateTrend(totalCents, prevTotalCents),
    byDate,
    byService,
  };
}

/**
 * Calculate appointment status metrics
 */
function calculateAppointmentMetrics(
  appointments: Array<{ status: string }>,
  previousAppointments: Array<{ status: string }>,
): AppointmentMetrics {
  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const noShow = appointments.filter((a) => a.status === "no_show").length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;

  // Calculate previous period metrics for trends
  const prevTotal = previousAppointments.length;
  const prevCompleted = previousAppointments.filter(
    (a) => a.status === "completed",
  ).length;

  return {
    total,
    completed,
    cancelled,
    noShow,
    pending,
    confirmed,
    trends: {
      total: calculateTrend(total, prevTotal),
      completed: calculateTrend(completed, prevCompleted),
    },
  };
}

/**
 * Calculate client metrics
 */
function calculateClientMetrics(
  periodAppointments: Array<{
    client_id: string | null;
    client_name: string;
    status: string;
    service_price_cents: number;
  }>,
  allTimeAppointments: Array<{
    client_id: string | null;
    client_name: string;
    status: string;
    service_price_cents: number;
  }>,
  previousAppointments: Array<{
    client_id: string | null;
    client_name: string;
    status: string;
  }>,
): ClientMetrics {
  // Get unique clients in period (completed only)
  const periodCompleted = periodAppointments.filter(
    (a) => a.status === "completed",
  );
  const periodClientKeys = new Set(
    periodCompleted.map((a) => a.client_id ?? a.client_name),
  );
  const total = periodClientKeys.size;

  // Calculate all-time visit counts per client
  const allTimeVisits = new Map<string, number>();
  for (const a of allTimeAppointments) {
    const key = a.client_id ?? a.client_name;
    allTimeVisits.set(key, (allTimeVisits.get(key) ?? 0) + 1);
  }

  // New vs returning (based on whether they had visits BEFORE this period)
  // For simplicity, we'll count returning as those with 2+ all-time visits
  let newClients = 0;
  let returningClients = 0;

  for (const clientKey of periodClientKeys) {
    const totalVisits = allTimeVisits.get(clientKey) ?? 0;
    if (totalVisits <= 1) {
      newClients++;
    } else {
      returningClients++;
    }
  }

  // Retention rate: clients with 2+ visits / total unique clients all-time
  const allTimeClientKeys = new Set(
    allTimeAppointments.map((a) => a.client_id ?? a.client_name),
  );
  const clientsWithMultipleVisits = Array.from(allTimeVisits.entries()).filter(
    ([, count]) => count >= 2,
  ).length;
  const retentionRate =
    allTimeClientKeys.size > 0
      ? (clientsWithMultipleVisits / allTimeClientKeys.size) * 100
      : null;

  // Top clients by spending in period
  const clientSpending = new Map<
    string,
    { name: string; totalCents: number; count: number }
  >();
  for (const a of periodCompleted) {
    const key = a.client_id ?? a.client_name;
    const current = clientSpending.get(key) ?? {
      name: a.client_name,
      totalCents: 0,
      count: 0,
    };
    clientSpending.set(key, {
      name: a.client_name,
      totalCents: current.totalCents + a.service_price_cents,
      count: current.count + 1,
    });
  }

  const topClients = Array.from(clientSpending.entries())
    .map(([key, data]) => ({
      clientId: key === data.name ? null : key,
      clientName: data.name,
      totalSpentCents: data.totalCents,
      appointmentCount: data.count,
    }))
    .sort((a, b) => b.totalSpentCents - a.totalSpentCents)
    .slice(0, 10);

  // Calculate previous period metrics for trends
  const prevCompleted = previousAppointments.filter(
    (a) => a.status === "completed",
  );
  const prevClientKeys = new Set(
    prevCompleted.map((a) => a.client_id ?? a.client_name),
  );
  const prevTotal = prevClientKeys.size;

  // Calculate previous period new clients
  let prevNewClients = 0;
  for (const clientKey of prevClientKeys) {
    const totalVisits = allTimeVisits.get(clientKey) ?? 0;
    // In previous period, a client was "new" if they had only 1 visit at that time
    // This is an approximation - for accurate calculation we'd need historical data
    if (totalVisits <= 1) {
      prevNewClients++;
    }
  }

  return {
    total,
    new: newClients,
    returning: returningClients,
    retentionRate: retentionRate !== null ? Math.round(retentionRate) : null,
    topClients,
    trends: {
      total: calculateTrend(total, prevTotal),
      new: calculateTrend(newClients, prevNewClients),
    },
  };
}

/**
 * Calculate service performance metrics
 */
function calculateServiceMetrics(
  appointments: Array<{
    status: string;
    service_id: string | null;
    service_name: string;
    service_price_cents: number;
    service_duration_minutes: number;
  }>,
  totalRevenue: number,
): ServiceMetrics {
  const completed = appointments.filter((a) => a.status === "completed");

  const serviceMap = new Map<
    string,
    {
      serviceName: string;
      count: number;
      revenueCents: number;
      totalDuration: number;
    }
  >();

  for (const a of completed) {
    const key = a.service_id ?? a.service_name;
    const current = serviceMap.get(key) ?? {
      serviceName: a.service_name,
      count: 0,
      revenueCents: 0,
      totalDuration: 0,
    };
    serviceMap.set(key, {
      serviceName: a.service_name,
      count: current.count + 1,
      revenueCents: current.revenueCents + a.service_price_cents,
      totalDuration: current.totalDuration + a.service_duration_minutes,
    });
  }

  return Array.from(serviceMap.entries())
    .map(([key, data]) => ({
      serviceId: key === data.serviceName ? null : key,
      serviceName: data.serviceName,
      bookingCount: data.count,
      revenueCents: data.revenueCents,
      revenuePercentage:
        totalRevenue > 0
          ? Math.round((data.revenueCents / totalRevenue) * 100)
          : 0,
      avgDuration: Math.round(data.totalDuration / data.count),
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

/**
 * Calculate operational metrics
 */
function calculateOperationalMetrics(
  appointments: Array<{
    status: string;
    created_at: string;
    date: string;
  }>,
): OperationalMetrics {
  const total = appointments.length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const noShow = appointments.filter((a) => a.status === "no_show").length;

  // Cancellation and no-show rates
  const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;
  const noShowRate = total > 0 ? (noShow / total) * 100 : 0;

  // Average lead time (days between booking and appointment)
  const leadTimes: number[] = [];
  for (const a of appointments) {
    const createdDate = new Date(a.created_at);
    const appointmentDate = new Date(a.date);
    const daysDiff = Math.floor(
      (appointmentDate.getTime() - createdDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysDiff >= 0) {
      leadTimes.push(daysDiff);
    }
  }
  const avgLeadTimeDays =
    leadTimes.length > 0
      ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
      : null;

  // Fill rate would require working hours data - set to null for now
  // This can be enhanced later with working_days table data
  const fillRate = null;

  return {
    fillRate,
    cancellationRate: Math.round(cancellationRate * 10) / 10,
    noShowRate: Math.round(noShowRate * 10) / 10,
    avgLeadTimeDays,
  };
}

/**
 * Calculate peak times from appointments
 */
function calculatePeakTimes(
  appointments: Array<{ date: string; start_time: string; status: string }>,
): PeakTimesData {
  // Only consider completed/confirmed appointments
  const relevant = appointments.filter(
    (a) => a.status === "completed" || a.status === "confirmed",
  );

  const peakMap = new Map<string, number>();

  for (const a of relevant) {
    const date = new Date(a.date);
    const dayOfWeek = date.getDay();
    const hour = Number.parseInt(a.start_time.split(":")[0], 10);
    const key = `${dayOfWeek}-${hour}`;
    peakMap.set(key, (peakMap.get(key) ?? 0) + 1);
  }

  return Array.from(peakMap.entries()).map(([key, count]) => {
    const [dayOfWeek, hour] = key.split("-").map(Number);
    return { dayOfWeek, hour, count };
  });
}

/**
 * Calculate rating metrics from reviews
 */
function calculateRatingMetrics(
  reviews: Array<{ rating: number; created_at: string }>,
  startDate: string,
  endDate: string,
): RatingMetrics {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      average: null,
      totalReviews: 0,
      periodReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  // Calculate average
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / totalReviews) * 10) / 10;

  // Reviews in period
  const periodReviews = reviews.filter((r) => {
    const reviewDate = r.created_at.split("T")[0];
    return reviewDate >= startDate && reviewDate <= endDate;
  }).length;

  // Distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
  }

  return { average, totalReviews, periodReviews, distribution };
}
