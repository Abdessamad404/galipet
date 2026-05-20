import { v2 as cloudinary } from 'cloudinary'

// Configuration via variables d'environnement
// Les clés sont dans .env — ne jamais les exposer côté frontend
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

/**
 * Upload un buffer en mémoire vers Cloudinary.
 * On utilise upload_stream parce que multer stocke le fichier en RAM (memoryStorage),
 * donc on n'a jamais de fichier temporaire sur le disque — plus propre et plus sécurisé.
 *
 * @param buffer  - Le fichier en mémoire (req.file.buffer)
 * @param folder  - Sous-dossier dans Cloudinary (ex: "avatars", "activity-photos")
 * @param publicId - Identifiant unique du fichier (permet l'écrasement propre)
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `galipet/${folder}`,
        public_id: publicId,
        overwrite: true,
        // auto = Cloudinary choisit le meilleur format (webp si supporté) et compresse
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload Cloudinary échoué'))
        } else {
          resolve(result.secure_url)
        }
      }
    )
    stream.end(buffer)
  })
}

/**
 * Supprime un fichier Cloudinary par son public_id.
 * Le public_id est la partie de l'URL sans le domaine ni l'extension.
 * Ex: "galipet/avatars/avatar_abc123"
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
