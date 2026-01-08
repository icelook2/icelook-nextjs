/**
 * Analytics period type for filtering data
 *
 * Each period compares with its logical previous period:
 * - today → yesterday
 * - yesterday → day before yesterday
 * - this_week → last week
 * - last_7_days → previous 7 days
 * - this_month → last month
 * - last_30_days → previous 30 days
 * - this_quarter → last quarter
 * - last_quarter → quarter before that
 * - this_year → last year
 * - last_year → year before that
 * - all_time → no comparison
 */
export type AnalyticsPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_7_days"
  | "this_month"
  | "last_30_days"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "all_time";

/**
 * Revenue metrics for the analytics dashboard
 */
export type RevenueMetrics = {
  /** Total revenue in cents */
  totalCents: number;
  /** Currency code */
  currency: string;
  /** Percentage change from previous period (-100 to +Infinity) */
  trend: number | null;
  /** Revenue broken down by date */
  byDate: Array<{ date: string; amountCents: number }>;
  /** Revenue broken down by service */
  byService: Array<{
    serviceId: string | null;
    serviceName: string;
    totalCents: number;
    count: number;
  }>;
};

/**
 * Appointment status counts
 */
export type AppointmentMetrics = {
  /** Total appointments in period */
  total: number;
  /** Completed appointments */
  completed: number;
  /** Cancelled appointments */
  cancelled: number;
  /** No-show appointments */
  noShow: number;
  /** Pending appointments */
  pending: number;
  /** Confirmed appointments */
  confirmed: number;
  /** Trends compared to previous period */
  trends: {
    total: number | null;
    completed: number | null;
  };
};

/**
 * Client-related metrics
 */
export type ClientMetrics = {
  /** Total unique clients in period */
  total: number;
  /** New clients (first visit ever) */
  new: number;
  /** Returning clients (2+ visits ever) */
  returning: number;
  /** Retention rate as percentage (0-100) */
  retentionRate: number | null;
  /** Top clients by spending */
  topClients: Array<{
    clientId: string | null;
    clientName: string;
    totalSpentCents: number;
    appointmentCount: number;
  }>;
  /** Trends compared to previous period */
  trends: {
    total: number | null;
    new: number | null;
  };
};

/**
 * Service performance metrics
 */
export type ServiceMetrics = Array<{
  serviceId: string | null;
  serviceName: string;
  /** Number of bookings */
  bookingCount: number;
  /** Total revenue in cents */
  revenueCents: number;
  /** Percentage of total revenue */
  revenuePercentage: number;
  /** Average duration in minutes */
  avgDuration: number;
}>;

/**
 * Operational metrics (rates)
 */
export type OperationalMetrics = {
  /** Fill rate as percentage (booked / available hours) */
  fillRate: number | null;
  /** Cancellation rate as percentage */
  cancellationRate: number;
  /** No-show rate as percentage */
  noShowRate: number;
  /** Average booking lead time in days */
  avgLeadTimeDays: number | null;
};

/**
 * Peak times data for heatmap visualization
 */
export type PeakTimesData = Array<{
  /** Day of week (0 = Sunday, 6 = Saturday) */
  dayOfWeek: number;
  /** Hour of day (0-23) */
  hour: number;
  /** Number of appointments at this time */
  count: number;
}>;

/**
 * Rating/review metrics
 */
export type RatingMetrics = {
  /** Average rating (1-5) */
  average: number | null;
  /** Total number of reviews */
  totalReviews: number;
  /** Reviews in current period */
  periodReviews: number;
  /** Distribution of ratings (1-5) */
  distribution: Record<number, number>;
};

/**
 * Complete analytics data structure
 */
export type AnalyticsData = {
  /** Period info */
  period: {
    type: AnalyticsPeriod;
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
  /** Revenue metrics */
  revenue: RevenueMetrics;
  /** Appointment counts and statuses */
  appointments: AppointmentMetrics;
  /** Average ticket value in cents */
  averageTicketCents: number | null;
  /** Average ticket trend compared to previous period */
  averageTicketTrend: number | null;
  /** Client metrics */
  clients: ClientMetrics;
  /** Service performance breakdown */
  services: ServiceMetrics;
  /** Operational rates */
  operational: OperationalMetrics;
  /** Peak booking times */
  peakTimes: PeakTimesData;
  /** Rating metrics */
  ratings: RatingMetrics;
};

/**
 * Date range for custom period selection
 */
export type DateRange = {
  from: Date;
  to: Date;
};
