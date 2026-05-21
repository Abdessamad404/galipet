import { Request, Response } from 'express'
import { dashboardService } from '../services/dashboard.service'

export async function getDashboard(req: Request, res: Response) {
  try {
    const proId  = req.user!.sub
    const period = (['day', 'week', 'month'].includes(req.query.period as string)
      ? req.query.period
      : 'week') as 'day' | 'week' | 'month'

    const data = await dashboardService.get(proId, period)
    res.json({ dashboard: data })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
