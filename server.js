const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const membershipRoutes = require("./routes/membershipRoutes");
dotenv.config();

const app = express();
app.set("trust proxy", 1);

/* =========================================================
   DATABASE CONNECTION (SERVERLESS SAFE)
========================================================= */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

/* =========================================================
   SECURITY HEADERS
========================================================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

/* =========================================================
   CORS (PRODUCTION SAFE)
========================================================= */
const allowedOrigins = [
  "https://gmpprive.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight
app.options("*", cors());

/* =========================================================
   BODY PARSER
========================================================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   DEV LOGGER
========================================================= */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =========================================================
   HEALTH CHECK
========================================================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
  });
});

/* =========================================================
   RATE LIMIT (API ONLY)
========================================================= */
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000,
});
app.use("/api/", limiter);

/* =========================================================
   ROUTES
========================================================= */
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/packages", require("./routes/packagesRoutes"));
// ✅ NEW - Inventory & Staff
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/staff",     require("./routes/staffRoutes"));
app.use("/api/staff", require("./routes/staffRoutes"));

app.use("/api/membership", membershipRoutes);
/* =========================================================
   404 HANDLER
========================================================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */
app.use(errorHandler);

/* =========================================================
   LOCAL SERVER (NOT FOR PRODUCTION)
========================================================= */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

/* =========================================================
   EXPORT FOR VERCEL
========================================================= */
module.exports = app;
