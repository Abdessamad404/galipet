import { supabase } from '../lib/supabaseClient'

export interface DashboardData {
  period:   'day' | 'week' | 'month'
  kpis: {
    total_bookings:  number
    completed:       number
    pending:         number
    accepted:        number
    cancelled:       number
    unique_clients:  number
    total_revenue:   number   // sum of price on completed bookings
    avg_rating:      number
    review_count:    number
  }
  revenue_trend: { label: string; revenue: number; bookings: number }[]  // last 7 days
  services:      { service_type: string; count: number; revenue: number }[]
  recent:        {
    id:           string
    owner_name:   string
    avatar_url:   string | null
    service_type: string
    scheduled_at: string
    status:       string
    price:        number | null
  }[]
}

function periodStart(period: 'day' | 'week' | 'month'): string {
  const now = new Date()
  if (period === 'day')   now.setHours(0, 0, 0, 0)
  if (period === 'week')  now.setDate(now.getDate() - 6)
  if (period === 'month') now.setDate(now.getDate() - 29)
  return now.toISOString()
}

export const dashboardService = {

  async get(proId: string, period: 'day' | 'week' | 'month'): Promise<DashboardData> {
    const since = periodStart(period)

    // ── All bookings for this pro in the period ──
    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('id, owner_id, service_type, scheduled_at, status, price, created_at')
      .eq('pro_id', proId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (bErr) throw new Error(bErr.message)
    const rows = bookings ?? []

    // ── KPIs ──
    const completed  = rows.filter((r) => r.status === 'completed')
    const pending    = rows.filter((r) => r.status === 'pending')
    const accepted   = rows.filter((r) => r.status === 'accepted')
    const cancelled  = rows.filter((r) => r.status === 'cancelled' || r.status === 'rejected')
    const uniqueOwners = new Set(rows.map((r) => r.owner_id)).size
    const totalRevenue = completed.reduce((sum, r) => sum + (Number(r.price) || 0), 0)

    // ── Rating ──
    const { data: ratingRow } = await supabase
      .from('pro_ratings')
      .select('avg_rating, review_count')
      .eq('pro_id', proId)
      .maybeSingle()

    // ── Revenue trend — last 7 days always ──
    const trendSince = new Date()
    trendSince.setDate(trendSince.getDate() - 6)
    trendSince.setHours(0, 0, 0, 0)

    const { data: trendRows } = await supabase
      .from('bookings')
      .select('scheduled_at, price, status')
      .eq('pro_id', proId)
      .gte('scheduled_at', trendSince.toISOString())
      .order('scheduled_at', { ascending: true })

    const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const trend: Record<string, { revenue: number; bookings: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      trend[key] = { revenue: 0, bookings: 0 }
    }
    for (const r of trendRows ?? []) {
      const key = r.scheduled_at.slice(0, 10)
      if (trend[key]) {
        trend[key].bookings++
        if (r.status === 'completed') trend[key].revenue += Number(r.price) || 0
      }
    }
    const revenue_trend = Object.entries(trend).map(([date, v]) => ({
      label:    dayLabels[new Date(date + 'T12:00:00').getDay()],
      revenue:  v.revenue,
      bookings: v.bookings,
    }))

    // ── Services breakdown ──
    const svcMap: Record<string, { count: number; revenue: number }> = {}
    for (const r of rows) {
      if (!svcMap[r.service_type]) svcMap[r.service_type] = { count: 0, revenue: 0 }
      svcMap[r.service_type].count++
      if (r.status === 'completed') svcMap[r.service_type].revenue += Number(r.price) || 0
    }
    const services = Object.entries(svcMap).map(([service_type, v]) => ({
      service_type, ...v,
    })).sort((a, b) => b.count - a.count)

    // ── Recent activity — last 5 bookings with owner name ──
    const recentRows = rows.slice(0, 5)
    const ownerIds   = [...new Set(recentRows.map((r) => r.owner_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', ownerIds)

    const profileMap: Record<string, any> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    const recent = recentRows.map((r) => {
      const p = profileMap[r.owner_id]
      return {
        id:           r.id,
        owner_name:   p ? `${p.first_name} ${p.last_name}` : 'Client inconnu',
        avatar_url:   p?.avatar_url ?? null,
        service_type: r.service_type,
        scheduled_at: r.scheduled_at,
        status:       r.status,
        price:        r.price ? Number(r.price) : null,
      }
    })

    return {
      period,
      kpis: {
        total_bookings: rows.length,
        completed:      completed.length,
        pending:        pending.length,
        accepted:       accepted.length,
        cancelled:      cancelled.length,
        unique_clients: uniqueOwners,
        total_revenue:  totalRevenue,
        avg_rating:     ratingRow ? Number(ratingRow.avg_rating) : 0,
        review_count:   ratingRow ? Number(ratingRow.review_count) : 0,
      },
      revenue_trend,
      services,
      recent,
    }
  },
}
