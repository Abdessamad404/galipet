import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// Instance Axios centrale — tous les appels API passent par ici.
// Avantage : si l'URL change ou si on veut ajouter un header global, on le fait ici une fois.

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor request : injecte le token JWT dans chaque requête automatiquement.
// Comme ça, dans les services on appelle juste api.get('/...') sans gérer le token manuellement.
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor response : si 401 → token expiré → déconnexion propre
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token')
      // Le store Zustand sera écouté par le guard de navigation pour rediriger vers /login
    }
    return Promise.reject(error)
  }
)
