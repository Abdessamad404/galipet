import multer from 'multer'

// memoryStorage = le fichier reste en RAM (Buffer), jamais écrit sur le disque.
// On l'envoie directement à Cloudinary via upload_stream.
// Avantage : pas de fichier temporaire à nettoyer, pas de dépendance au système de fichiers.
const storage = multer.memoryStorage()

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // On accepte uniquement les images (jpeg, png, webp, etc.)
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Seules les images sont acceptées (jpeg, png, webp)'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
})

// Middleware pour les documents (PDF + images) — utilisé pour les certifications
const documentFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Seuls les formats image et PDF sont acceptés'))
  }
}

export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB pour les docs
  },
})
