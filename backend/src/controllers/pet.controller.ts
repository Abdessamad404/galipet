import { Request, Response } from 'express'
import * as petService from '../services/pet.service'

export const getPets = async (req: Request, res: Response): Promise<void> => {
  try {
    const pets = await petService.getPets(req.user!.sub)
    res.json({ pets })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const getPet = async (req: Request, res: Response): Promise<void> => {
  try {
    const pet = await petService.getPet(req.params.id, req.user!.sub)
    res.json({ pet })
  } catch (error) {
    res.status(404).json({ error: (error as Error).message })
  }
}

export const createPet = async (req: Request, res: Response): Promise<void> => {
  try {
    const pet = await petService.createPet(req.user!.sub, req.body)
    res.status(201).json({ pet })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const updatePet = async (req: Request, res: Response): Promise<void> => {
  try {
    const pet = await petService.updatePet(req.params.id, req.user!.sub, req.body)
    res.json({ pet })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const deletePet = async (req: Request, res: Response): Promise<void> => {
  try {
    await petService.deletePet(req.params.id, req.user!.sub)
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const uploadMainPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ error: 'Aucun fichier reçu' }); return }
    const pet = await petService.uploadMainPhoto(req.params.id, req.user!.sub, req.file.buffer)
    res.json({ pet })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const uploadGalleryPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ error: 'Aucun fichier reçu' }); return }
    const pet = await petService.uploadGalleryPhoto(req.params.id, req.user!.sub, req.file.buffer)
    res.json({ pet })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const deleteGalleryPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const index = parseInt(req.params.index, 10)
    if (isNaN(index)) { res.status(400).json({ error: 'Index invalide' }); return }
    const pet = await petService.deleteGalleryPhoto(req.params.id, req.user!.sub, index)
    res.json({ pet })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const uploadHealthDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ error: 'Aucun fichier reçu' }); return }
    const pet = await petService.uploadHealthDoc(req.params.id, req.user!.sub, req.file.buffer)
    res.json({ pet })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}
