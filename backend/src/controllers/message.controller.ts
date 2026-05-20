import { Request, Response } from 'express'
import { messageService } from '../services/message.service'
import { z } from 'zod'

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
})

// ── Liste des conversations ──
export async function listConversations(req: Request, res: Response) {
  try {
    const conversations = await messageService.listForUser(req.user!.sub)
    res.json({ conversations })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ── Ouvrir/créer une conversation avec un pro ──
export async function getOrCreateConversation(req: Request, res: Response) {
  const { proId } = req.params
  try {
    // Le demandeur peut être owner ou pro — on détermine les rôles selon le param
    const userId = req.user!.sub
    // On suppose que le user qui appelle est le owner, le proId est le pro
    // (Pour le pro qui ouvre une conversation, on utilise l'autre endpoint)
    const conversation = await messageService.getOrCreate(userId, proId)
    res.json({ conversation })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Messages d'une conversation ──
export async function getMessages(req: Request, res: Response) {
  try {
    const messages = await messageService.getMessages(req.params.id, req.user!.sub)
    // Marquer comme lus automatiquement
    await messageService.markRead(req.params.id, req.user!.sub)
    res.json({ messages })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Envoyer un message ──
export async function sendMessage(req: Request, res: Response) {
  const parsed = sendSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Contenu invalide' })
  }
  try {
    const message = await messageService.send(req.params.id, req.user!.sub, parsed.data.content)
    res.status(201).json({ message })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Nombre de non lus ──
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const count = await messageService.unreadCount(req.user!.sub)
    res.json({ count })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
