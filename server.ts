import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

import { initDatabase } from "./server/config/db";
import { initStorageEngine } from "./server/models/store";

import authRoutes from "./server/routes/auth";
import hostelRoutes from "./server/routes/hostels";
import bookingRoutes from "./server/routes/bookings";
import favouriteRoutes from "./server/routes/favourites";
import inquiryRoutes from "./server/routes/inquiries";
import adminRoutes from "./server/routes/admin";


dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS for frontend API calls
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parsing middleware
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Static uploads serving
const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "HostelHub Ghana REST API is live & operational",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/admin", adminRoutes);

// Global 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

async function start() {
  // Initialize Database & seed data
  await initDatabase();
  await initStorageEngine();

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[HostelHub Backend] Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
