import axios from 'axios'
import { storage } from './storage'

// Instance Axios centrale — tous les appels API passent par ici.
// Avantage : si l'URL change ou si on veut ajouter un header global, on le fait ici une fois.

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor request : injecte le token JWT + gère le Content-Type automatiquement.
api.interceptors.request.use(async (config) => {
  const token = await storage.get('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Si le body est FormData, on supprime le Content-Type forcé à application/json.
  // Axios (et le navigateur/React Native) le définit automatiquement avec le bon boundary multipart.
  // Le laisser à application/json ferait échouer le parsing multer côté backend.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

// Interceptor response : si 401 → token expiré → déconnexion propre
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.delete('auth_token')
      // Le store Zustand sera écouté par le guard de navigation pour rediriger vers /login
    }
    return Promise.reject(error)
  }
)
