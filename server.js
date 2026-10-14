import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./server/config/db.js";
import authRoutes from "./server/routes/auth.js";
import hostelRoutes from "./server/routes/hostels.js";
import bookingRoutes from "./server/routes/bookings.js";
import favouriteRoutes from "./server/routes/favourites.js";
import inquiryRoutes from "./server/routes/inquiries.js";
import adminRoutes from "./server/routes/admin.js";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Configuration
// 1. CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || "*";
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. Body Parser Middleware
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// 3. Static uploads serving
const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
app.use("/uploads", express.static(uploadsDir));

// 4. API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "HostelHub Express server is running",
    database: {
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "hostelhub"
    },
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/admin", adminRoutes);

// Fallback for static frontend files
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Initialize database and start server
async function startServer() {
  await initDatabase();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

export default app;
