import { api } from '../lib/axios'

export type DashboardPeriod = 'day' | 'week' | 'month'

export interface DashboardKPIs {
  total_bookings:  number
  completed:       number
  pending:         number
  accepted:        number
  cancelled:       number
  unique_clients:  number
  total_revenue:   number
  avg_rating:      number
  review_count:    number
}

export interface RevenueTrendPoint {
  label:    string
  revenue:  number
  bookings: number
}

export interface ServiceBreakdown {
  service_type: string
  count:        number
  revenue:      number
}

export interface RecentActivity {
  id:           string
  owner_name:   string
  avatar_url:   string | null
  service_type: string
  scheduled_at: string
  status:       string
  price:        number | null
}

export interface DashboardData {
  period:        DashboardPeriod
  kpis:          DashboardKPIs
  revenue_trend: RevenueTrendPoint[]
  services:      ServiceBreakdown[]
  recent:        RecentActivity[]
}

export const dashboardService = {
  async get(period: DashboardPeriod = 'week'): Promise<DashboardData> {
    const { data } = await api.get('/dashboard', { params: { period } })
    return data.dashboard
  },
}
