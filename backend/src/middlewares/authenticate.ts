import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";


// Middleware qui protège les routes privées.
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  // Il lit le token Bearer dans le header Authorization,
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token d'authentification manquant" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET non défini");

    // le vérifie avec JWT_SECRET, et attache le payload dans req.user.
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    // Si le token est absent ou invalide → 401.
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
