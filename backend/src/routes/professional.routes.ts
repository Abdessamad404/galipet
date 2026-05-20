import { Router } from "express";
import {
  getNearbyProfessionals,
  getProPublicProfile,
} from "../controllers/professional.controller";

const router = Router();

// Public — pas besoin d'être connecté
router.get("/nearby", getNearbyProfessionals);
router.get("/:id", getProPublicProfile);

export default router;
