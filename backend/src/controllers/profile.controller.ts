import { Request, Response } from 'express'
import * as profileService from '../services/profile.service'

// Les controllers restent minces :
// ils lisent req, appellent le service, et formatent la réponse.
// Aucune logique métier ici.

// ─────────────────────────────────────────────
// PROFIL
// ─────────────────────────────────────────────

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await profileService.getProfile(req.user!.sub)
    res.json({ profile })
  } catch (error) {
    res.status(404).json({ error: (error as Error).message })
  }
}

export const getPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await profileService.getPublicProfile(req.params.id)
    res.json({ profile })
  } catch (error) {
    res.status(404).json({ error: (error as Error).message })
  }
}

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await profileService.updateProfile(req.user!.sub, req.body)
    res.json({ profile })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier reçu' })
      return
    }
    const profile = await profileService.uploadAvatar(req.user!.sub, req.file.buffer)
    res.json({ profile })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const uploadActivityPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier reçu' })
      return
    }
    const photos = await profileService.uploadActivityPhoto(req.user!.sub, req.file.buffer)
    res.json({ photos })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const deleteActivityPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const index = parseInt(req.params.index, 10)
    if (isNaN(index)) {
      res.status(400).json({ error: 'Index invalide' })
      return
    }
    const photos = await profileService.deleteActivityPhoto(req.user!.sub, index)
    res.json({ photos })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

// ─────────────────────────────────────────────
// CERTIFICATIONS
// ─────────────────────────────────────────────

export const getCertifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const certifications = await profileService.getCertifications(req.user!.sub)
    res.json({ certifications })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const createCertification = async (req: Request, res: Response): Promise<void> => {
  try {
    const certification = await profileService.createCertification(
      req.user!.sub,
      req.body,
      req.file?.buffer
    )
    res.status(201).json({ certification })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const updateCertification = async (req: Request, res: Response): Promise<void> => {
  try {
    const certification = await profileService.updateCertification(
      req.user!.sub,
      req.params.id,
      req.body
    )
    res.json({ certification })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const deleteCertification = async (req: Request, res: Response): Promise<void> => {
  try {
    await profileService.deleteCertification(req.user!.sub, req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

// ─────────────────────────────────────────────
// Q&A "À propos"
// ─────────────────────────────────────────────

export const getAboutQA = async (req: Request, res: Response): Promise<void> => {
  try {
    const qa = await profileService.getAboutQA(req.user!.sub)
    res.json({ qa })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const createQA = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await profileService.createQA(req.user!.sub, req.body)
    res.status(201).json({ qa: item })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const updateQA = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await profileService.updateQA(req.user!.sub, req.params.id, req.body)
    res.json({ qa: item })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const deleteQA = async (req: Request, res: Response): Promise<void> => {
  try {
    await profileService.deleteQA(req.user!.sub, req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}
