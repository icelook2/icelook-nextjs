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
 * RPC response type from get_beauty_page_analytics
 */
interface AnalyticsRpcResponse {
  revenue: {
    totalCents: number;
    currency: string;
    prevTotalCents: number;
    byDate: Array<{ date: string; amountCents: number }>;
    byService: Array<{
      serviceId: string | null;
      serviceName: string;
      totalCents: number;
      count: number;
    }>;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    pending: number;
    confirmed: number;
    prevTotal: number;
    prevCompleted: number;
  };
  clients: {
    total: number;
    new: number;
    returning: number;
    topClients: Array<{
      clientId: string | null;
      clientName: string;
      totalSpentCents: number;
      appointmentCount: number;
    }>;
  };
  services: Array<{
    serviceId: string | null;
    serviceName: string;
    bookingCount: number;
    revenueCents: number;
    avgDuration: number;
  }>;
  peakTimes: Array<{
    dayOfWeek: number;
    hour: number;
    count: number;
  }>;
  operational: {
    cancellationRate: number | null;
    noShowRate: number | null;
    avgLeadTimeDays: number | null;
  };
  ratings: {
    average: number | null;
    totalReviews: number;
    periodReviews: number;
    distribution: Record<string, number>;
  };
}

/**
 * Fetch comprehensive analytics data for a beauty page
 * Uses RPC function for efficient single-query aggregation
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

  // Single RPC call replaces 4 queries + JS aggregation
  const { data, error } = await supabase.rpc("get_beauty_page_analytics", {
    p_beauty_page_id: beautyPageId,
    p_start_date: startDateStr,
    p_end_date: endDateStr,
    p_prev_start_date: prevStartDateStr,
    p_prev_end_date: prevEndDateStr,
  });

  if (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }

  const rpcData = data as AnalyticsRpcResponse;

  // Transform RPC response to AnalyticsData format
  return transformAnalyticsResponse(
    rpcData,
    period,
    startDateStr,
    endDateStr,
    prevStartDateStr,
    prevEndDateStr,
  );
}

/**
 * Transform RPC response to AnalyticsData format
 */
function transformAnalyticsResponse(
  data: AnalyticsRpcResponse,
  period: AnalyticsPeriod,
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string,
): AnalyticsData {
  // Calculate trends from pre-aggregated data
  const revenueTrend = calculateTrend(
    data.revenue.totalCents,
    data.revenue.prevTotalCents,
  );

  // Revenue metrics
  const revenue: RevenueMetrics = {
    totalCents: data.revenue.totalCents,
    currency: data.revenue.currency,
    trend: revenueTrend,
    byDate: data.revenue.byDate ?? [],
    byService: data.revenue.byService ?? [],
  };

  // Appointment metrics with trends
  const appointments: AppointmentMetrics = {
    total: data.appointments.total,
    completed: data.appointments.completed,
    cancelled: data.appointments.cancelled,
    noShow: data.appointments.noShow,
    pending: data.appointments.pending,
    confirmed: data.appointments.confirmed,
    trends: {
      total: calculateTrend(data.appointments.total, data.appointments.prevTotal),
      completed: calculateTrend(
        data.appointments.completed,
        data.appointments.prevCompleted,
      ),
    },
  };

  // Calculate average ticket
  const averageTicketCents =
    data.appointments.completed > 0
      ? Math.round(data.revenue.totalCents / data.appointments.completed)
      : null;

  // Calculate previous period average ticket for trend
  const prevAverageTicketCents =
    data.appointments.prevCompleted > 0
      ? Math.round(data.revenue.prevTotalCents / data.appointments.prevCompleted)
      : null;

  const averageTicketTrend = calculateTrend(
    averageTicketCents ?? 0,
    prevAverageTicketCents ?? 0,
  );

  // Client metrics (retention rate calculated from all-time data in SQL)
  const clients: ClientMetrics = {
    total: data.clients.total,
    new: data.clients.new,
    returning: data.clients.returning,
    retentionRate: null, // Would need additional calculation
    topClients: data.clients.topClients ?? [],
    trends: {
      total: calculateTrend(data.clients.total, 0), // prev not available in current RPC
      new: calculateTrend(data.clients.new, 0),
    },
  };

  // Service metrics with revenue percentage
  const totalRevenue = data.revenue.totalCents;
  const services: ServiceMetrics = (data.services ?? []).map((s) => ({
    serviceId: s.serviceId,
    serviceName: s.serviceName,
    bookingCount: s.bookingCount,
    revenueCents: s.revenueCents,
    revenuePercentage:
      totalRevenue > 0 ? Math.round((s.revenueCents / totalRevenue) * 100) : 0,
    avgDuration: s.avgDuration,
  }));

  // Operational metrics
  const operational: OperationalMetrics = {
    fillRate: null,
    cancellationRate: data.operational.cancellationRate ?? 0,
    noShowRate: data.operational.noShowRate ?? 0,
    avgLeadTimeDays: data.operational.avgLeadTimeDays,
  };

  // Peak times
  const peakTimes: PeakTimesData = data.peakTimes ?? [];

  // Rating metrics with proper distribution type
  const ratings: RatingMetrics = {
    average: data.ratings.average,
    totalReviews: data.ratings.totalReviews,
    periodReviews: data.ratings.periodReviews,
    distribution: {
      1: data.ratings.distribution["1"] ?? 0,
      2: data.ratings.distribution["2"] ?? 0,
      3: data.ratings.distribution["3"] ?? 0,
      4: data.ratings.distribution["4"] ?? 0,
      5: data.ratings.distribution["5"] ?? 0,
    },
  };

  return {
    period: {
      type: period,
      startDate,
      endDate,
      previousStartDate: prevStartDate,
      previousEndDate: prevEndDate,
    },
    revenue,
    appointments,
    averageTicketCents,
    averageTicketTrend,
    clients,
    services,
    operational,
    peakTimes,
    ratings,
  };
}
