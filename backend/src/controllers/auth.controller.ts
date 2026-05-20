import { Request, Response } from 'express'
import * as authService from '../services/auth.service'

// Controller mince : il reçoit req, appelle le service, renvoie res.
// Toute la logique métier est dans le service — jamais dans le controller.

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { token, profile } = await authService.register(req.body)
    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      profile,
    })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { token, profile } = await authService.login(req.body)
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      profile,
    })
  } catch (error) {
    res.status(401).json({ error: (error as Error).message })
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    await authService.forgotPassword(req.body.email)
    // Réponse toujours identique — pas d'information sur l'existence du compte
    res.status(200).json({
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    })
  } catch {
    res.status(200).json({
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    })
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    // req.user est injecté par le middleware authenticate
    const profile = await authService.getMe(req.user!.sub)
    res.status(200).json({ profile })
  } catch (error) {
    res.status(404).json({ error: (error as Error).message })
  }
}
