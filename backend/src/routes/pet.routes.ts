import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { validate } from '../middlewares/validate'
import { upload, uploadDocument } from '../middlewares/upload'
import { createPetSchema, updatePetSchema } from '../schemas/pet.schemas'
import * as petController from '../controllers/pet.controller'

const router = Router()

router.use(authenticate)

// CRUD de base
router.get('/',    petController.getPets)
router.post('/',   validate(createPetSchema), petController.createPet)
router.get('/:id', petController.getPet)
router.patch('/:id', validate(updatePetSchema), petController.updatePet)
router.delete('/:id', petController.deletePet)

// Photos — AVANT /:id pour éviter les conflits de routing
router.post('/:id/photo',                upload.single('photo'),    petController.uploadMainPhoto)
router.post('/:id/gallery',              upload.single('photo'),    petController.uploadGalleryPhoto)
router.delete('/:id/gallery/:index',                                petController.deleteGalleryPhoto)
router.post('/:id/health-docs',          uploadDocument.single('document'), petController.uploadHealthDoc)

export default router
