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

const app = express();
app.set("trust proxy", 1);
/* =========================
   BODY PARSER
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   DATABASE CONNECTION
========================= */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB Connection Error:", error);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});



/* =========================
   CORS
========================= */
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        origin.includes("vercel.app") ||
        origin.includes("localhost")
      ) {
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
   RATE LIMIT
========================= */
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 1000,
});
app.use("/api/", limiter);

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GMP Privé API is running 🚀",
  });
});

/* =========================
   ROUTES
========================= */
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/packages", require("./routes/packagesRoutes"));

/* =========================
   404
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
   EXPORT FOR VERCEL
========================= */
module.exports = app;
