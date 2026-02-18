const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const adminRoutes = require("./routes/adminRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const packagesRoutes = require("./routes/packagesRoutes");

const app = express();

/* =========================
   ✅ BODY PARSER
   ========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ✅ CORS (MUST BE FIRST)
   ========================= */
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:5173", // Vite default port
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

/* =========================
   ✅ SECURITY HEADERS (UPDATED)
   ========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "https://gmpprive.s3.eu-north-1.amazonaws.com",
          "https://*.amazonaws.com",
        ],
        connectSrc: [
          "'self'",
          "https://gmpprive.s3.eu-north-1.amazonaws.com",
          "https://*.amazonaws.com",
        ],
      },
    },
  })
);

/* =========================
   DEV LOGGER
   ========================= */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =========================
   RATE LIMIT
   ========================= */
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000,
  message: "Too many requests, try later.",
});
app.use("/api/", limiter);

/* =========================
   HEALTH CHECK
   ========================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GMP Privé API is running",
    time: new Date().toISOString(),
  });
});

/* =========================
   ✅ ROUTES
   ========================= */
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/packages", packagesRoutes);

/* =========================
   404 HANDLER
   ========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================
   ERROR HANDLER
   ========================= */
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   🚀 GMP PRIVÉ API SERVER                     ║
║   Mode: ${process.env.NODE_ENV || "development"}                ║
║   Port: ${PORT}                              ║
║   URL: http://localhost:${PORT}             ║
╚════════════════════════════════════════════════╝
`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;