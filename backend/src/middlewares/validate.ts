import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

// Middleware générique de validation Zod.
// Usage dans les routes : router.post('/register', validate(registerSchema), authController.register)

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => ({
          champ: e.path.join('.'),
          message: e.message,
        }))
        res.status(400).json({ error: 'Données invalides', détails: messages })
        return
      }
      next(error)
    }
  }
}
