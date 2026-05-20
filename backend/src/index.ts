import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import petRoutes from "./routes/pet.routes";
import professionalRoutes from "./routes/professional.routes";
import bookingRoutes from "./routes/booking.routes";
import reviewRoutes from "./routes/review.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Sécurité & parsing ---
app.use(helmet()); // Headers HTTP sécurisés
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
);
app.use(express.json()); // Parse les bodies JSON

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/professionals", professionalRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);

// --- Health check ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Erreurs non gérées ---
app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Gali'Pet démarré sur http://localhost:${PORT}`);
});

export default app;
