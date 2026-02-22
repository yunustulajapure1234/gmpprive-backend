const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load ENV
dotenv.config();

// Create App
const app = express();
app.set("trust proxy", 1);

/* =========================
   CONNECT DATABASE (ONCE)
========================= */
(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
})();

/* =========================
   BODY PARSER
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   CORS (SECURE VERSION)
========================= */
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowed = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
      ];

      if (allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


/* =========================
   SECURITY
========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

/* =========================
   DEV LOGGER
========================= */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =========================
   HEALTH CHECK (NO LIMIT)
========================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
  });
});

/* =========================
   RATE LIMIT (API ONLY)
========================= */
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000,
});
app.use("/api/", limiter);

/* =========================
   ROUTES
========================= */
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/packages", require("./routes/packagesRoutes"));

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

/* =========================
   START SERVER (LOCAL ONLY)
========================= */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

/* =========================
   EXPORT FOR VERCEL
========================= */
module.exports = app;
